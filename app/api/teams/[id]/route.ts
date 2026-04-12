import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// GET /api/teams/[id] — full team detail: members, pending invites, boards
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch team — readable if owner or member
    const { data: team } = await supabase
      .from('teams')
      .select('id, name, slug, avatar_color, owner_id, created_at')
      .eq('id', id)
      .single();

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // Verify access
    const isOwner = team.owner_id === user.id;
    if (!isOwner) {
      const { data: membership } = await admin
        .from('team_members')
        .select('id')
        .eq('team_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Members with profiles
    const { data: membersRaw } = await admin
      .from('team_members')
      .select('id, user_id, role, created_at, profiles(id, name, avatar_url, email)')
      .eq('team_id', id)
      .order('created_at', { ascending: true });

    const members = (membersRaw ?? []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
      profile: m.profiles,
    }));

    // Owner profile
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('id, name, avatar_url, email')
      .eq('id', team.owner_id)
      .single();

    // Pending invitations
    const { data: invitations } = await admin
      .from('team_invitations')
      .select('id, email, role, token, expires_at, created_at')
      .eq('team_id', id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Team boards
    const { data: boards } = await supabase
      .from('boards')
      .select('id, name, description, is_public, created_at, updated_at')
      .eq('team_id', id)
      .order('updated_at', { ascending: false });

    return NextResponse.json({
      team: {
        ...team,
        owner_profile: ownerProfile,
      },
      members,
      invitations: invitations ?? [],
      boards: boards ?? [],
      current_user_role: isOwner ? 'owner' : (membersRaw?.find((m: any) => m.user_id === user.id) as any)?.role ?? 'member',
    });
  } catch (err) {
    console.error('GET /api/teams/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

// PATCH /api/teams/[id] — update team name/avatar_color (owner/admin only)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: team } = await admin.from('teams').select('owner_id').eq('id', id).single();
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const isOwner = team.owner_id === user.id;
    if (!isOwner) {
      const { data: m } = await admin.from('team_members').select('role').eq('team_id', id).eq('user_id', user.id).maybeSingle();
      if (m?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, string | null> = {};
    if (body.name?.trim()) updates.name = body.name.trim();
    if (body.avatar_color) updates.avatar_color = body.avatar_color;
    if ('avatar_url' in body) updates.avatar_url = body.avatar_url ?? null;

    const { data: updated } = await admin.from('teams').update(updates).eq('id', id).select().single();
    return NextResponse.json({ team: updated });
  } catch (err) {
    console.error('PATCH /api/teams/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

// DELETE /api/teams/[id] — delete team (owner only)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: team } = await admin.from('teams').select('owner_id').eq('id', id).single();
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    if (team.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Detach boards before deleting (don't delete the boards themselves)
    await admin.from('boards').update({ team_id: null }).eq('team_id', id);
    await admin.from('teams').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/teams/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
