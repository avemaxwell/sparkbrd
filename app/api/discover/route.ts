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

    // Fetch tacks from public boards
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
    const { data: myTacks } = await supabase
      .from('tacks')
      .select('content_url, source')
      .in(
        'board_id',
        // get the user's board IDs
        (await supabase
          .from('boards')
          .select('id')
          .eq('owner_id', user.id)
          .then(r => (r.data || []).map((b: { id: string }) => b.id)))
      );

    // Build a set of domains the user has already tacked from
    const myDomains = new Set<string>();
    const myUrls = new Set<string>();
    for (const t of myTacks || []) {
      myUrls.add(t.content_url);
      if (t.source) myDomains.add(t.source);
      try {
        const hostname = new URL(t.content_url).hostname.replace('www.', '');
        myDomains.add(hostname);
      } catch {}
    }

    // Score each public tack by interest overlap
    const scored = filtered
      .filter(t => !myUrls.has(t.content_url)) // never show things they already have
      .map(t => {
        let score = 0;
        try {
          const host = new URL(t.content_url).hostname.replace('www.', '');
          if (myDomains.has(host)) score += 2;
        } catch {}
        if (t.source && myDomains.has(t.source)) score += 1;
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
