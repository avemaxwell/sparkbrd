import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logTeamActivity, ActivityType } from '@/lib/team-activity';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify access
    const { data: team } = await admin.from('teams').select('owner_id').eq('id', id).single();
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const isOwner = team.owner_id === user.id;
    if (!isOwner) {
      const { data: membership } = await admin
        .from('team_members').select('id').eq('team_id', id).eq('user_id', user.id).maybeSingle();
      if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: activity } = await admin
      .from('team_activity')
      .select('*')
      .eq('team_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ activity: activity ?? [] });
  } catch (err) {
    console.error('GET /api/teams/[id]/activity error:', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

// POST — log a client-side activity event (tack_added, board_created)
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify team membership
    const { data: team } = await admin.from('teams').select('owner_id').eq('id', id).single();
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    const isOwner = team.owner_id === user.id;
    if (!isOwner) {
      const { data: m } = await admin.from('team_members').select('id').eq('team_id', id).eq('user_id', user.id).maybeSingle();
      if (!m) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, board_id, board_name, tack_id, tack_thumbnail } = body;

    if (!['tack_added', 'board_created'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const { data: actorProfile } = await admin.from('profiles').select('name, avatar_url').eq('id', user.id).single();

    await logTeamActivity({
      teamId: id,
      userId: user.id,
      type: type as ActivityType,
      actorName: actorProfile?.name ?? null,
      actorAvatar: actorProfile?.avatar_url ?? null,
      boardId: board_id ?? null,
      boardName: board_name ?? null,
      tackId: tack_id ?? null,
      tackThumbnail: tack_thumbnail ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/teams/[id]/activity error:', err);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
