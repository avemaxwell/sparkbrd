import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string; uid: string }> };

// PATCH /api/teams/[id]/members/[uid] — update member role
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id: teamId, uid } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: team } = await admin.from('teams').select('owner_id').eq('id', teamId).single();
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const isOwner = team.owner_id === user.id;
    if (!isOwner) {
      const { data: m } = await admin.from('team_members').select('role').eq('team_id', teamId).eq('user_id', user.id).maybeSingle();
      if (m?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cannot change owner's role
    if (uid === team.owner_id) return NextResponse.json({ error: 'Cannot change the owner\'s role' }, { status: 400 });

    const { role } = await request.json();
    if (!['admin', 'member'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    const { data: updated, error } = await admin
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', uid)
      .select()
      .single();

    if (error || !updated) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    return NextResponse.json({ member: updated });
  } catch (err) {
    console.error('PATCH /api/teams/[id]/members/[uid] error:', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/members/[uid] — remove member or leave team
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id: teamId, uid } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: team } = await admin.from('teams').select('owner_id').eq('id', teamId).single();
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // Cannot remove the owner
    if (uid === team.owner_id) return NextResponse.json({ error: 'Cannot remove the team owner' }, { status: 400 });

    const isSelf = uid === user.id;
    const isOwner = team.owner_id === user.id;

    if (!isSelf && !isOwner) {
      const { data: m } = await admin.from('team_members').select('role').eq('team_id', teamId).eq('user_id', user.id).maybeSingle();
      if (m?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await admin
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', uid);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/teams/[id]/members/[uid] error:', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
