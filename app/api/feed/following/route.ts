import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/feed/following
// Returns latest public tacks from boards owned by people you follow.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get IDs of everyone the current user follows
    const { data: followRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (!followRows || followRows.length === 0) {
      return NextResponse.json({ tacks: [] });
    }

    const followingIds = followRows.map(r => r.following_id);

    // Fetch recent public tacks from those users' public boards
    const { data: tacks } = await supabase
      .from('tacks')
      .select(`
        id,
        content_url,
        note,
        source,
        created_at,
        board_id,
        user_id,
        hidden_as_ai,
        boards!inner(id, name, is_public, owner_id),
        owner_profile:profiles!tacks_user_id_fkey(id, name, avatar_url)
      `)
      .eq('hidden_as_ai', false)
      .eq('boards.is_public', true)
      .in('boards.owner_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(80);

    return NextResponse.json({ tacks: tacks ?? [] });
  } catch (err) {
    console.error('GET /api/feed/following error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
