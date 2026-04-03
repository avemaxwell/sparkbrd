import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// Expand user query into semantically related visual search terms via Claude
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
    // Always include the original query terms too
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

    if (!query) return NextResponse.json({ tacks: [], terms: [] });

    const { data: { user } } = await supabase.auth.getUser();

    // Expand query semantically
    const terms = await expandQuery(query);

    // Build OR filter: each term checked against tags, title, and source
    const orParts = terms.flatMap(term => {
      const safe = term.replace(/[%_]/g, '\\$&'); // escape ILIKE special chars
      return [
        `tags.ilike.%${safe}%`,
        `title.ilike.%${safe}%`,
        `source.ilike.%${safe}%`,
      ];
    }).join(',');

    // Search public tacks
    const { data: publicResults } = await supabase
      .from('tacks')
      .select('id, content_url, title, source, board_id, boards!inner(is_public, owner_id)')
      .eq('boards.is_public', true)
      .or(orParts)
      .limit(limit);

    // Normalize to plain shape to avoid type conflicts between the two queries
    type TackResult = { id: string; content_url: string; title: string | null; source: string | null; board_id: string };
    let results: TackResult[] = (publicResults || []).map(t => ({
      id: t.id, content_url: t.content_url, title: t.title, source: t.source, board_id: t.board_id,
    }));

    // Also search user's own tacks (including private boards)
    if (user) {
      const { data: ownResults } = await supabase
        .from('tacks')
        .select('id, content_url, title, source, board_id, boards!inner(owner_id)')
        .eq('boards.owner_id', user.id)
        .or(orParts)
        .limit(limit);

      if (ownResults) {
        const existingIds = new Set(results.map(t => t.id));
        const own: TackResult[] = ownResults
          .filter(t => !existingIds.has(t.id))
          .map(t => ({ id: t.id, content_url: t.content_url, title: t.title, source: t.source, board_id: t.board_id }));
        results = [...results, ...own];
      }
    }

    // Dedupe by content_url
    const seen = new Set<string>();
    const feed = results.filter(t => {
      if (seen.has(t.content_url)) return false;
      seen.add(t.content_url);
      return true;
    }).slice(0, limit);

    return NextResponse.json({ tacks: feed, terms });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ tacks: [], terms: [] });
  }
}
