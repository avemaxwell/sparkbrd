import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

async function expandQuery(query: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [query];

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `You are a visual search assistant. Expand this image search query into 12-15 diverse keywords covering: visual appearance, colors, mood, style, materials, setting, activities, synonyms, and related concepts. Be specific and visual — think about what someone would SEE in the image. Query: "${query}"\n\nReturn only comma-separated lowercase keywords, nothing else.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : query;
    const terms = text.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const original = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    return [...new Set([...original, ...terms])].slice(0, 15);
  } catch {
    return query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 80);

    if (!query) return NextResponse.json({ tacks: [], boards: [], terms: [] });

    const { data: { user } } = await supabase.auth.getUser();

    const terms = await expandQuery(query);

    // Build a tsquery: each term as a prefix match, all OR'd together.
    // This uses the existing GIN index on (tags || title || source).
    const tsQuery = terms
      .map(t => t.replace(/[^a-zA-Z0-9\s]/g, '').trim())
      .filter(Boolean)
      .map(t => `${t}:*`)       // prefix matching so "flower" matches "flowers"
      .join(' | ');

    // Fallback ilike parts for the note field (not in the GIN index)
    const noteOrParts = terms
      .map(t => `note.ilike.%${t.replace(/[%_]/g, '\\$&')}%`)
      .join(',');

    type TackResult = { id: string; content_url: string; title: string | null; source: string | null; board_id: string };

    // Primary: full-text search via GIN index
    const { data: publicTacksFts } = await supabase
      .from('tacks')
      .select('id, content_url, title, source, board_id, boards!inner(is_public, owner_id)')
      .eq('boards.is_public', true)
      .textSearch('tags', tsQuery, { type: 'websearch', config: 'english' })
      .not('content_url', 'ilike', '%.svg%')
      .limit(limit);

    // Secondary: also search title/note/source via ilike (catches tacks with no tags)
    const { data: publicTacksFallback } = await supabase
      .from('tacks')
      .select('id, content_url, title, source, board_id, boards!inner(is_public, owner_id)')
      .eq('boards.is_public', true)
      .or(`title.ilike.%${query.replace(/[%_]/g, '\\$&')}%,${noteOrParts}`)
      .not('content_url', 'ilike', '%.svg%')
      .limit(limit);

    const seenIds = new Set<string>();
    let tacks: TackResult[] = [];
    for (const t of [...(publicTacksFts || []), ...(publicTacksFallback || [])]) {
      if (seenIds.has(t.id)) continue;
      seenIds.add(t.id);
      tacks.push({ id: t.id, content_url: t.content_url, title: t.title, source: t.source, board_id: t.board_id });
    }

    if (user) {
      const { data: ownTacks } = await supabase
        .from('tacks')
        .select('id, content_url, title, source, board_id, boards!inner(owner_id)')
        .eq('boards.owner_id', user.id)
        .or(`tags.ilike.%${query.replace(/[%_]/g, '\\$&')}%,title.ilike.%${query.replace(/[%_]/g, '\\$&')}%,${noteOrParts}`)
        .not('content_url', 'ilike', '%.svg%')
        .limit(limit);

      if (ownTacks) {
        for (const t of ownTacks) {
          if (seenIds.has(t.id)) continue;
          seenIds.add(t.id);
          tacks.push({ id: t.id, content_url: t.content_url, title: t.title, source: t.source, board_id: t.board_id });
        }
      }
    }

    tacks = tacks.slice(0, limit);

    // ── Board search ─────────────────────────────────────────────────────────
    // Build a simple OR across name and description for the raw query terms
    const rawTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const boardOrParts = rawTerms.flatMap(term => {
      const safe = term.replace(/[%_]/g, '\\$&');
      return [`name.ilike.%${safe}%`, `description.ilike.%${safe}%`];
    }).join(',');

    type BoardResult = {
      id: string; name: string; description: string | null;
      owner_id: string; owner_name: string | null; preview_images: string[];
    };
    let boards: BoardResult[] = [];

    if (boardOrParts) {
      const { data: publicBoards } = await supabase
        .from('boards')
        .select('id, name, description, owner_id')
        .eq('is_public', true)
        .or(boardOrParts)
        .limit(20);

      let rawBoards = publicBoards || [];

      if (user) {
        const { data: ownBoards } = await supabase
          .from('boards')
          .select('id, name, description, owner_id')
          .eq('owner_id', user.id)
          .or(boardOrParts)
          .limit(20);

        if (ownBoards) {
          const existingIds = new Set(rawBoards.map(b => b.id));
          rawBoards = [...rawBoards, ...ownBoards.filter(b => !existingIds.has(b.id))];
        }
      }

      if (rawBoards.length > 0) {
        const boardIds = rawBoards.map(b => b.id);

        // Fetch preview tacks for all boards in one query
        const { data: previewTacks } = await supabase
          .from('tacks')
          .select('board_id, content_url')
          .in('board_id', boardIds)
          .order('created_at', { ascending: false })
          .limit(boardIds.length * 3);

        const imageMap: Record<string, string[]> = {};
        for (const t of previewTacks ?? []) {
          if (!imageMap[t.board_id]) imageMap[t.board_id] = [];
          if (imageMap[t.board_id].length < 3) imageMap[t.board_id].push(t.content_url);
        }

        // Fetch owner profiles
        const ownerIds = [...new Set(rawBoards.map(b => b.owner_id))];
        const { data: ownerProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ownerIds);
        const ownerMap = Object.fromEntries((ownerProfiles ?? []).map(p => [p.id, p.name]));

        boards = rawBoards.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          owner_id: b.owner_id,
          owner_name: ownerMap[b.owner_id] ?? null,
          preview_images: imageMap[b.id] ?? [],
        }));
      }
    }

    return NextResponse.json({ tacks, boards, terms });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ tacks: [], boards: [], terms: [] });
  }
}
