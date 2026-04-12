import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string; invId: string }> };

// DELETE /api/teams/[id]/invitations/[invId] — revoke pending invitation
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id: teamId, invId } = await params;
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

    const { error } = await admin
      .from('team_invitations')
      .delete()
      .eq('id', invId)
      .eq('team_id', teamId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/teams/[id]/invitations/[invId] error:', err);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
