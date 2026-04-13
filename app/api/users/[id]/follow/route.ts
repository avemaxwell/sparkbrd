import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// GET /api/users/[id]/follow
// Returns: { following: boolean, followerCount: number, followingCount: number }
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id: targetId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [followerRes, followingRes, selfRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', targetId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', targetId),
      user
        ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      following: !!selfRes.data,
      followerCount: followerRes.count ?? 0,
      followingCount: followingRes.count ?? 0,
    });
  } catch (err) {
    console.error('GET /api/users/[id]/follow error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/users/[id]/follow — toggle follow/unfollow
// Returns: { following: boolean }
export async function POST(_req: Request, { params }: Params) {
  try {
    const { id: targetId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.id === targetId) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetId)
      .maybeSingle();

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
      return NextResponse.json({ following: false });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      return NextResponse.json({ following: true });
    }
  } catch (err) {
    console.error('POST /api/users/[id]/follow error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
