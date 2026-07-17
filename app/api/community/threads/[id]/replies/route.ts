import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { body } = await request.json();
    if (!body?.trim() || body.trim().length > 2000) {
      return NextResponse.json({ error: 'Reply is required and must be under 2000 characters' }, { status: 400 });
    }

    const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();

    const { data: reply, error } = await supabase
      .from('community_replies')
      .insert({
        thread_id: id,
        user_id: user.id,
        actor_name: profile?.name ?? null,
        actor_avatar: profile?.avatar_url ?? null,
        body: body.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('POST /api/community/threads/[id]/replies error:', err);
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
