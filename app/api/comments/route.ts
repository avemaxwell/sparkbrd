import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logTeamActivity } from '@/lib/team-activity';

async function attachProfiles(supabase: Awaited<ReturnType<typeof createClient>>, comments: Array<{ user_id: string; [key: string]: unknown }>) {
  const userIds = [...new Set(comments.map(c => c.user_id))];
  if (userIds.length === 0) return {};
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);
  return Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
}

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
      .select('id, board_id, tack_id, parent_id, body, created_at, updated_at, user_id')
      .eq('board_id', boardId)
      .eq('tack_id', tackId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const profileMap = await attachProfiles(supabase, data ?? []);

    const allIds = new Set((data || []).map(c => c.id));
    const replyCounts: Record<string, number> = {};
    for (const c of data || []) {
      if (c.parent_id && allIds.has(c.parent_id)) {
        replyCounts[c.parent_id] = (replyCounts[c.parent_id] ?? 0) + 1;
      }
    }

    const comments = (data || []).map(c => {
      const profile = profileMap[c.user_id];
      return {
        id: c.id,
        board_id: c.board_id,
        tack_id: c.tack_id,
        parent_id: c.parent_id,
        body: c.body,
        created_at: c.created_at,
        updated_at: c.updated_at,
        author: {
          id: profile?.id ?? c.user_id,
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
      .select('id, board_id, tack_id, parent_id, body, created_at, updated_at, user_id')
      .single();

    if (insertErr || !inserted) throw insertErr;

    // Fetch the author profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', user.id)
      .single();

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

    if (!parent_id) {
      if (tack.user_id !== user.id) {
        notifRecipientId = tack.user_id;
        notifType = 'comment_on_my_tack';
      }
    } else {
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
        comment_id: inserted.id,
      });
    }

    // Fire mention notifications for @name patterns in the comment body.
    // We resolve names against all board collaborators via the admin client.
    const mentionedNames = [...commentBody.matchAll(/@([\w\s]+?)(?=\s|$|[^\w\s])/g)]
      .map(m => m[1].trim().toLowerCase())
      .filter(Boolean);

    if (mentionedNames.length > 0) {
      const admin = createAdminClient();
      const { data: boardMembers } = await admin
        .from('board_members')
        .select('user_id')
        .eq('board_id', board_id);
      const { data: boardRow } = await admin
        .from('boards')
        .select('owner_id')
        .eq('id', board_id)
        .single();

      const collaboratorIds = [
        ...(boardMembers ?? []).map((m: any) => m.user_id),
        ...(boardRow ? [boardRow.owner_id] : []),
      ].filter((id: string) => id !== user.id);

      if (collaboratorIds.length > 0) {
        const { data: collabProfiles } = await admin
          .from('profiles')
          .select('id, name')
          .in('id', collaboratorIds);

        const mentionNotifs = (collabProfiles ?? [])
          .filter((p: any) => p.name && mentionedNames.includes(p.name.toLowerCase()))
          // Don't double-notify if they already got comment_on_my_tack or reply
          .filter((p: any) => p.id !== notifRecipientId)
          .map((p: any) => ({
            recipient_id: p.id,
            actor_id: user.id,
            type: 'mention_in_comment',
            board_id,
            tack_id,
            comment_id: inserted.id,
          }));

        if (mentionNotifs.length > 0) {
          await supabase.from('notifications').insert(mentionNotifs);
        }
      }
    }

    // Log to team activity feed if this board belongs to a team
    const admin2 = createAdminClient();
    const { data: boardRow } = await admin2.from('boards').select('team_id, name').eq('id', board_id).single();
    if (boardRow?.team_id) {
      await logTeamActivity({
        teamId: boardRow.team_id,
        userId: user.id,
        type: 'comment_posted',
        actorName: profile?.name ?? null,
        actorAvatar: profile?.avatar_url ?? null,
        boardId: board_id,
        boardName: boardRow.name,
        tackId: tack_id,
        commentBody: commentBody.trim().slice(0, 120),
      });
    }

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('POST /api/comments error:', err);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
