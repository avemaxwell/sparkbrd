import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };
type BoardRow = { id: string; name: string; kind: string | null; parent_id: string | null; owner_id: string; is_public: boolean; team_id: string | null };

const MAX_DEPTH = 10;

async function hasAccess(admin: ReturnType<typeof createAdminClient>, board: BoardRow, userId: string): Promise<boolean> {
  if (board.owner_id === userId) return true;
  if (board.is_public) return true;
  if (board.team_id) {
    const { data: tm } = await admin.from('team_members').select('id').eq('team_id', board.team_id).eq('user_id', userId).maybeSingle();
    if (tm) return true;
  }
  const { data: bm } = await admin.from('board_members').select('id').eq('board_id', board.id).eq('user_id', userId).maybeSingle();
  return !!bm;
}

// GET /api/boards/[id]/ancestors — walk parent_id up for the breadcrumb.
// Iterative (not a recursive CTE) so each ancestor gets the same access
// check as any other board — the trail is truncated at the first ancestor
// the requester can't see, rather than leaking a private parent's name.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: leaf } = await admin
      .from('boards')
      .select('id, name, kind, parent_id, owner_id, is_public, team_id')
      .eq('id', id)
      .single<BoardRow>();

    if (!leaf) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    if (!(await hasAccess(admin, leaf, user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const ancestors: { id: string; name: string; kind: string | null }[] = [];
    let currentParentId = leaf.parent_id;

    for (let i = 0; i < MAX_DEPTH && currentParentId; i++) {
      const { data: parent } = await admin
        .from('boards')
        .select('id, name, kind, parent_id, owner_id, is_public, team_id')
        .eq('id', currentParentId)
        .single<BoardRow>();

      if (!parent || !(await hasAccess(admin, parent, user.id))) break;

      ancestors.unshift({ id: parent.id, name: parent.name, kind: parent.kind });
      currentParentId = parent.parent_id;
    }

    return NextResponse.json({ ancestors });
  } catch (err) {
    console.error('GET /api/boards/[id]/ancestors error:', err);
    return NextResponse.json({ error: 'Failed to load ancestors' }, { status: 500 });
  }
}
