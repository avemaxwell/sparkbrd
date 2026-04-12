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

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasAccess = await verifyBoardAccess(id, user.id);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: posts } = await admin
      .from('board_discussion')
      .select('*')
      .eq('board_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ posts: posts ?? [] });
  } catch (err) {
    console.error('GET /api/boards/[id]/discussion error:', err);
    return NextResponse.json({ error: 'Failed to fetch discussion' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasAccess = await verifyBoardAccess(id, user.id);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { message, activity_id, parent_id } = body;

    if (!message?.trim() || message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message required and must be under 2000 characters' }, { status: 400 });
    }

    const { data: profile } = await admin.from('profiles').select('name, avatar_url').eq('id', user.id).single();

    const { data: post, error } = await admin
      .from('board_discussion')
      .insert({
        board_id: id,
        user_id: user.id,
        actor_name: profile?.name ?? null,
        actor_avatar: profile?.avatar_url ?? null,
        body: message.trim(),
        activity_id: activity_id ?? null,
        parent_id: parent_id ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post });
  } catch (err) {
    console.error('POST /api/boards/[id]/discussion error:', err);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}
