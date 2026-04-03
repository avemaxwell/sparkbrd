import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { body } = await request.json();

    if (!body?.trim()) return NextResponse.json({ error: 'Body is required' }, { status: 400 });
    if (body.trim().length > 2000) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

    const { data, error } = await supabase
      .from('comments')
      .update({ body: body.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, board_id, tack_id, parent_id, body, created_at, updated_at, user_id')
      .single();

    if (error || !data) return NextResponse.json({ error: 'Comment not found or forbidden' }, { status: 404 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      comment: {
        id: data.id,
        board_id: data.board_id,
        tack_id: data.tack_id,
        parent_id: data.parent_id,
        body: data.body,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author: { id: profile?.id ?? user.id, name: profile?.name ?? null, avatar_url: profile?.avatar_url ?? null },
        reply_count: 0,
      },
    });
  } catch (err) {
    console.error('PATCH /api/comments/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: comment } = await supabase
      .from('comments')
      .select('id, user_id, board_id')
      .eq('id', id)
      .single();

    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    let authorized = comment.user_id === user.id;
    if (!authorized) {
      const { data: board } = await supabase
        .from('boards')
        .select('owner_id')
        .eq('id', comment.board_id)
        .single();
      authorized = board?.owner_id === user.id;
    }

    if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await supabase.from('comments').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/comments/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
