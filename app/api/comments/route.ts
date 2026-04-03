import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('board_id');
    const tackId = searchParams.get('tack_id');

    if (!boardId || !tackId) {
      return NextResponse.json({ error: 'board_id and tack_id are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, board_id, tack_id, parent_id, body, created_at, updated_at,
        profiles!user_id(id, name, avatar_url)
      `)
      .eq('board_id', boardId)
      .eq('tack_id', tackId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Compute reply_count client-side from the flat list
    const allIds = new Set((data || []).map(c => c.id));
    const replyCounts: Record<string, number> = {};
    for (const c of data || []) {
      if (c.parent_id && allIds.has(c.parent_id)) {
        replyCounts[c.parent_id] = (replyCounts[c.parent_id] ?? 0) + 1;
      }
    }

    const comments = (data || []).map(c => {
      const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      return {
        id: c.id,
        board_id: c.board_id,
        tack_id: c.tack_id,
        parent_id: c.parent_id,
        body: c.body,
        created_at: c.created_at,
        updated_at: c.updated_at,
        author: {
          id: profile?.id ?? '',
          name: profile?.name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
        reply_count: replyCounts[c.id] ?? 0,
      };
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error('GET /api/comments error:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { board_id, tack_id, parent_id, body: commentBody } = body;

    if (!board_id || !tack_id || !commentBody?.trim()) {
      return NextResponse.json({ error: 'board_id, tack_id, and body are required' }, { status: 400 });
    }
    if (commentBody.trim().length > 2000) {
      return NextResponse.json({ error: 'Comment too long' }, { status: 400 });
    }

    // Verify tack belongs to this board
    const { data: tack, error: tackErr } = await supabase
      .from('tacks')
      .select('id, user_id')
      .eq('id', tack_id)
      .eq('board_id', board_id)
      .single();

    if (tackErr || !tack) {
      return NextResponse.json({ error: 'Tack not found on this board' }, { status: 404 });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('comments')
      .insert({
        board_id,
        tack_id,
        user_id: user.id,
        parent_id: parent_id ?? null,
        body: commentBody.trim(),
      })
      .select(`
        id, board_id, tack_id, parent_id, body, created_at, updated_at,
        profiles!user_id(id, name, avatar_url)
      `)
      .single();

    if (insertErr || !inserted) throw insertErr;

    const profile = Array.isArray(inserted.profiles) ? inserted.profiles[0] : inserted.profiles;
    const comment = {
      id: inserted.id,
      board_id: inserted.board_id,
      tack_id: inserted.tack_id,
      parent_id: inserted.parent_id,
      body: inserted.body,
      created_at: inserted.created_at,
      updated_at: inserted.updated_at,
      author: {
        id: profile?.id ?? user.id,
        name: profile?.name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      reply_count: 0,
    };

    // Create notification
    let notifRecipientId: string | null = null;
    let notifType: string | null = null;
    let notifCommentId: string | null = inserted.id;

    if (!parent_id) {
      // Comment on a tack — notify tack owner
      if (tack.user_id !== user.id) {
        notifRecipientId = tack.user_id;
        notifType = 'comment_on_my_tack';
      }
    } else {
      // Reply — notify parent comment author
      const { data: parentComment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', parent_id)
        .single();
      if (parentComment && parentComment.user_id !== user.id) {
        notifRecipientId = parentComment.user_id;
        notifType = 'reply_to_my_comment';
      }
    }

    if (notifRecipientId && notifType) {
      await supabase.from('notifications').insert({
        recipient_id: notifRecipientId,
        actor_id: user.id,
        type: notifType,
        board_id,
        tack_id,
        comment_id: notifCommentId,
      });
    }

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('POST /api/comments error:', err);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
