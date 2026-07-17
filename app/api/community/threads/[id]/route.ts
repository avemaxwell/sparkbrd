import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: thread, error: threadErr } = await supabase
      .from('community_threads')
      .select('*, community_categories(slug, name)')
      .eq('id', id)
      .single();

    if (threadErr || !thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

    const { data: replies, error: repliesErr } = await supabase
      .from('community_replies')
      .select('*')
      .eq('thread_id', id)
      .order('created_at', { ascending: true });

    if (repliesErr) throw repliesErr;

    return NextResponse.json({
      thread: { ...thread, category: thread.community_categories },
      replies: replies ?? [],
    });
  } catch (err) {
    console.error('GET /api/community/threads/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('community_threads').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/community/threads/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
  }
}
