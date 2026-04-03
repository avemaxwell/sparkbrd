import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ notifications: [], unread_count: 0 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, type, is_read, created_at, board_id, tack_id, comment_id,
        actor:profiles!actor_id(id, name, avatar_url),
        board:boards!board_id(name),
        tack:tacks!tack_id(content_url)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const notifications = (data || []).map(n => {
      const actor = Array.isArray(n.actor) ? n.actor[0] : n.actor;
      const board = Array.isArray(n.board) ? n.board[0] : n.board;
      const tack = Array.isArray(n.tack) ? n.tack[0] : n.tack;
      return {
        id: n.id,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
        board_id: n.board_id,
        tack_id: n.tack_id,
        comment_id: n.comment_id,
        actor: { id: actor?.id ?? '', name: actor?.name ?? null, avatar_url: actor?.avatar_url ?? null },
        board_name: board?.name ?? null,
        tack_thumbnail: tack?.content_url ?? null,
      };
    });

    const unread_count = notifications.filter(n => !n.is_read).length;

    return NextResponse.json({ notifications, unread_count });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ notifications: [], unread_count: 0 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 });
    }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids)
      .eq('recipient_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/notifications error:', err);
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
  }
}
