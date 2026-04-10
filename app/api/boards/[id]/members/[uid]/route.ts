import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── PATCH /api/boards/[id]/members/[uid] ─────────────────────────────────────
// Changes a member's role. Board owner only.

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const { id: boardId, uid: targetUserId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: board } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single();

    if (!board || board.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { role } = await req.json() as { role?: string };
    if (!['editor', 'viewer'].includes(role ?? '')) {
      return NextResponse.json({ error: 'role must be editor or viewer' }, { status: 400 });
    }

    const { error } = await supabase
      .from('board_members')
      .update({ role })
      .eq('board_id', boardId)
      .eq('user_id', targetUserId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/boards/[id]/members/[uid] error:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// ─── DELETE /api/boards/[id]/members/[uid] ────────────────────────────────────
// Removes a member from a board.
// Allowed by: board owner, or the member removing themselves.

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const { id: boardId, uid: targetUserId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only the board owner or the member themselves may remove a membership.
    const isRemovingSelf = user.id === targetUserId;

    if (!isRemovingSelf) {
      const { data: board } = await supabase
        .from('boards')
        .select('owner_id')
        .eq('id', boardId)
        .single();

      if (!board || board.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { error } = await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', targetUserId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/boards/[id]/members/[uid] error:', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
