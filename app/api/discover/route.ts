import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 80);

    // Get current user (optional — personalization only if logged in)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch tacks from public boards, joined with board owner info
    // Exclude the current user's own tacks from the feed
    const { data: publicTacks, error } = await supabase
      .from('tacks')
      .select(`
        id,
        content_url,
        title,
        source,
        board_id,
        boards!inner(id, name, owner_id, is_public)
      `)
      .eq('boards.is_public', true)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !publicTacks || publicTacks.length === 0) {
      return NextResponse.json({ tacks: [], personalized: false });
    }

    // If not logged in — return latest public tacks, deduped by URL
    if (!user) {
      const seen = new Set<string>();
      const feed = publicTacks.filter(t => {
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
    const scored = publicTacks
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
