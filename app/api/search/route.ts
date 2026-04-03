import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

async function expandQuery(query: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [query];

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Expand this visual image search query into 8-10 related keywords that would appear in image tags or descriptions. Query: "${query}"\n\nReturn only comma-separated lowercase keywords, nothing else.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : query;
    const terms = text.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const original = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    return [...new Set([...original, ...terms])].slice(0, 12);
  } catch {
    return query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
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

    // ── Tack search ──────────────────────────────────────────────────────────
    const orParts = terms.flatMap(term => {
      const safe = term.replace(/[%_]/g, '\\$&');
      return [
        `tags.ilike.%${safe}%`,
        `title.ilike.%${safe}%`,
        `source.ilike.%${safe}%`,
      ];
    }).join(',');

    type TackResult = { id: string; content_url: string; title: string | null; source: string | null; board_id: string };

    const { data: publicTacks } = await supabase
      .from('tacks')
      .select('id, content_url, title, source, board_id, boards!inner(is_public, owner_id)')
      .eq('boards.is_public', true)
      .or(orParts)
      .limit(limit);

    let tacks: TackResult[] = (publicTacks || []).map(t => ({
      id: t.id, content_url: t.content_url, title: t.title, source: t.source, board_id: t.board_id,
    }));

    if (user) {
      const { data: ownTacks } = await supabase
        .from('tacks')
        .select('id, content_url, title, source, board_id, boards!inner(owner_id)')
        .eq('boards.owner_id', user.id)
        .or(orParts)
        .limit(limit);

      if (ownTacks) {
        const existingIds = new Set(tacks.map(t => t.id));
        const own: TackResult[] = ownTacks
          .filter(t => !existingIds.has(t.id))
          .map(t => ({ id: t.id, content_url: t.content_url, title: t.title, source: t.source, board_id: t.board_id }));
        tacks = [...tacks, ...own];
      }
    }

    // Dedupe by content_url
    const seenUrls = new Set<string>();
    tacks = tacks.filter(t => {
      if (seenUrls.has(t.content_url)) return false;
      seenUrls.add(t.content_url);
      return true;
    }).slice(0, limit);

    // ── Board search ─────────────────────────────────────────────────────────
    // Build a simple OR across name and description for the raw query terms
    const rawTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const boardOrParts = rawTerms.flatMap(term => {
      const safe = term.replace(/[%_]/g, '\\$&');
      return [`name.ilike.%${safe}%`, `description.ilike.%${safe}%`];
    }).join(',');

    type BoardResult = { id: string; name: string; description: string | null; owner_id: string };
    let boards: BoardResult[] = [];

    if (boardOrParts) {
      const { data: publicBoards } = await supabase
        .from('boards')
        .select('id, name, description, owner_id')
        .eq('is_public', true)
        .or(boardOrParts)
        .limit(20);

      boards = (publicBoards || []).map(b => ({
        id: b.id, name: b.name, description: b.description, owner_id: b.owner_id,
      }));

      if (user) {
        const { data: ownBoards } = await supabase
          .from('boards')
          .select('id, name, description, owner_id')
          .eq('owner_id', user.id)
          .or(boardOrParts)
          .limit(20);

        if (ownBoards) {
          const existingIds = new Set(boards.map(b => b.id));
          const own = ownBoards
            .filter(b => !existingIds.has(b.id))
            .map(b => ({ id: b.id, name: b.name, description: b.description, owner_id: b.owner_id }));
          boards = [...boards, ...own];
        }
      }
    }

    return NextResponse.json({ tacks, boards, terms });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ tacks: [], boards: [], terms: [] });
  }
}
