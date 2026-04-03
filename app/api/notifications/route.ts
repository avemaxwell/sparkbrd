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
      .select('id, type, is_read, created_at, board_id, tack_id, comment_id, actor_id')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = data ?? [];

    // Fetch actor profiles in one query
    const actorIds = [...new Set(rows.map(n => n.actor_id).filter(Boolean))];
    const profileMap: Record<string, { id: string; name: string | null; avatar_url: string | null }> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', actorIds);
      for (const p of profiles ?? []) profileMap[p.id] = p;
    }

    // Fetch board names in one query
    const boardIds = [...new Set(rows.map(n => n.board_id).filter(Boolean))];
    const boardMap: Record<string, string> = {};
    if (boardIds.length > 0) {
      const { data: boards } = await supabase
        .from('boards')
        .select('id, name')
        .in('id', boardIds);
      for (const b of boards ?? []) boardMap[b.id] = b.name;
    }

    // Fetch tack thumbnails in one query
    const tackIds = [...new Set(rows.map(n => n.tack_id).filter(Boolean))];
    const tackMap: Record<string, string> = {};
    if (tackIds.length > 0) {
      const { data: tacks } = await supabase
        .from('tacks')
        .select('id, content_url')
        .in('id', tackIds);
      for (const t of tacks ?? []) tackMap[t.id] = t.content_url;
    }

    const notifications = rows.map(n => {
      const actor = profileMap[n.actor_id] ?? null;
      return {
        id: n.id,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
        board_id: n.board_id,
        tack_id: n.tack_id,
        comment_id: n.comment_id,
        actor: { id: actor?.id ?? n.actor_id ?? '', name: actor?.name ?? null, avatar_url: actor?.avatar_url ?? null },
        board_name: n.board_id ? (boardMap[n.board_id] ?? null) : null,
        tack_thumbnail: n.tack_id ? (tackMap[n.tack_id] ?? null) : null,
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
