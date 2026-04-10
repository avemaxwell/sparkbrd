import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// ─── GET /api/boards/[id]/collaborators ───────────────────────────────────────
// Returns all members (owner + board_members) for @mention autocomplete.
// Accessible by any board member, not just the owner.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify caller has access to this board (owner or member)
    const { data: board } = await supabase
      .from('boards')
      .select('id, owner_id')
      .eq('id', boardId)
      .single();

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    const isOwner = board.owner_id === user.id;
    if (!isOwner) {
      const { data: membership } = await admin
        .from('board_members')
        .select('id')
        .eq('board_id', boardId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Collect all participant user IDs: owner + members
    const { data: members } = await admin
      .from('board_members')
      .select('user_id')
      .eq('board_id', boardId);

    const userIds = [board.owner_id, ...(members ?? []).map((m: any) => m.user_id)];
    const uniqueIds = [...new Set(userIds)].filter(id => id !== user.id); // exclude self

    if (uniqueIds.length === 0) return NextResponse.json({ collaborators: [] });

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', uniqueIds);

    return NextResponse.json({ collaborators: profiles ?? [] });
  } catch (err) {
    console.error('GET /api/boards/[id]/collaborators error:', err);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}
