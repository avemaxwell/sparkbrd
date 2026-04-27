import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 80);
    const q = searchParams.get('q')?.trim() ?? '';

    // Get current user (optional — personalization only if logged in)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch tacks from public boards — exclude SVG stickers
    let query = supabase
      .from('tacks')
      .select(`
        id,
        content_url,
        title,
        source,
        board_id,
        tags,
        boards!inner(id, name, owner_id, is_public)
      `)
      .eq('boards.is_public', true)
      .not('content_url', 'ilike', '%.svg%')
      .order('created_at', { ascending: false });

    // If searching, filter server-side on title, source, and tags
    if (q) {
      query = query.or(`title.ilike.%${q}%,source.ilike.%${q}%`);
    } else {
      query = query.limit(200);
    }

    const { data: publicTacks, error } = await query;

    if (error || !publicTacks || publicTacks.length === 0) {
      return NextResponse.json({ tacks: [], personalized: false });
    }

    // Tag-based client filter when searching (tags is an array column)
    const filtered = q
      ? publicTacks.filter(t => {
          const lower = q.toLowerCase();
          if (t.title?.toLowerCase().includes(lower)) return true;
          if (t.source?.toLowerCase().includes(lower)) return true;
          if (Array.isArray(t.tags) && t.tags.some((tag: string) => tag.toLowerCase().includes(lower))) return true;
          return false;
        })
      : publicTacks;

    // If searching, skip personalization — just return deduped results
    if (q) {
      const seen = new Set<string>();
      const feed = filtered.filter(t => {
        if (seen.has(t.content_url)) return false;
        seen.add(t.content_url);
        return true;
      }).slice(0, limit);
      return NextResponse.json({ tacks: feed, personalized: false });
    }

    // If not logged in — return latest public tacks, deduped by URL
    if (!user) {
      const seen = new Set<string>();
      const feed = filtered.filter(t => {
        if (seen.has(t.content_url)) return false;
        seen.add(t.content_url);
        return true;
      }).slice(0, limit);

      return NextResponse.json({ tacks: feed, personalized: false });
    }

    // Logged-in: fetch user's own tacks to build interest signals
    const myBoardIds = await supabase
      .from('boards')
      .select('id')
      .eq('owner_id', user.id)
      .then(r => (r.data || []).map((b: { id: string }) => b.id));

    const { data: myTacks } = await supabase
      .from('tacks')
      .select('content_url, source, tags, title, note')
      .in('board_id', myBoardIds);

    // Build interest signals from the user's collection
    const myDomains = new Set<string>();
    const myUrls   = new Set<string>();
    const myTags   = new Set<string>();
    const myWords  = new Set<string>();

    for (const t of myTacks || []) {
      myUrls.add(t.content_url);
      if (t.source) myDomains.add(t.source);
      try { myDomains.add(new URL(t.content_url).hostname.replace('www.', '')); } catch {}
      // Tags — highest-fidelity signal
      if (Array.isArray(t.tags)) {
        for (const tag of t.tags) { if (tag) myTags.add(tag.toLowerCase().trim()); }
      }
      // Words from title / note — softer signal
      for (const text of [t.title, t.note]) {
        if (!text) continue;
        for (const word of text.toLowerCase().split(/\W+/)) {
          if (word.length > 4) myWords.add(word);
        }
      }
    }

    // Score each public tack by interest overlap
    const scored = filtered
      .filter(t => !myUrls.has(t.content_url)) // never show things they already have
      .map(t => {
        let score = 0;
        // Domain match (e.g. same Pinterest board, same site the user likes)
        try {
          if (myDomains.has(new URL(t.content_url).hostname.replace('www.', ''))) score += 2;
        } catch {}
        if (t.source && myDomains.has(t.source)) score += 1;
        // Tag overlap — strongest relevance signal
        if (Array.isArray(t.tags)) {
          for (const tag of t.tags) {
            if (tag && myTags.has(tag.toLowerCase().trim())) score += 4;
          }
        }
        // Title keyword overlap
        if (t.title) {
          for (const word of t.title.toLowerCase().split(/\W+/)) {
            if (word.length > 4 && myWords.has(word)) score += 1;
          }
        }
        return { ...t, _score: score };
      });

    // Sort: high-interest first, then recency (already sorted by created_at desc)
    scored.sort((a, b) => b._score - a._score);

    // Dedupe by URL, take limit
    const seen = new Set<string>();
    const feed = scored.filter(t => {
      if (seen.has(t.content_url)) return false;
      seen.add(t.content_url);
      return true;
    }).slice(0, limit);

    return NextResponse.json({ tacks: feed, personalized: true });

  } catch (err) {
    console.error('Discover error:', err);
    return NextResponse.json({ tacks: [], personalized: false });
  }
}
