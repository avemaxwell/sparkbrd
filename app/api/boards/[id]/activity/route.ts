import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

async function verifyBoardAccess(boardId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: board } = await admin.from('boards').select('owner_id, is_public').eq('id', boardId).single();
  if (!board) return false;
  if (board.owner_id === userId) return true;
  if (board.is_public) return true;
  const { data: m } = await admin.from('board_members').select('id').eq('board_id', boardId).eq('user_id', userId).maybeSingle();
  return !!m;
}

// GET — board-scoped activity events (from team_activity filtered by board_id)
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasAccess = await verifyBoardAccess(id, user.id);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: activity } = await admin
      .from('team_activity')
      .select('*')
      .eq('board_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ activity: activity ?? [] });
  } catch (err) {
    console.error('GET /api/boards/[id]/activity error:', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
