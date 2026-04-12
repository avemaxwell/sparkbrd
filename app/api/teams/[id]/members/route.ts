import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// POST /api/teams/[id]/members — invite by email
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: teamId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Must be owner or admin
    const { data: team } = await admin.from('teams').select('owner_id, name').eq('id', teamId).single();
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const isOwner = team.owner_id === user.id;
    if (!isOwner) {
      const { data: m } = await admin.from('team_members').select('role').eq('team_id', teamId).eq('user_id', user.id).maybeSingle();
      if (m?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, role = 'member' } = await request.json();
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!['admin', 'member'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    // Check if already a member
    const { data: existingUser } = await admin.from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (existingUser) {
      const { data: alreadyMember } = await admin.from('team_members').select('id').eq('team_id', teamId).eq('user_id', existingUser.id).maybeSingle();
      if (alreadyMember) return NextResponse.json({ error: 'This person is already a team member' }, { status: 409 });
      if (existingUser.id === team.owner_id) return NextResponse.json({ error: 'This person is the team owner' }, { status: 409 });
    }

    // Upsert invitation (reset expiry if re-inviting)
    const { data: invitation, error: invErr } = await admin
      .from('team_invitations')
      .upsert({
        team_id: teamId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'team_id,email' })
      .select()
      .single();

    if (invErr || !invitation) throw invErr;

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sparkurio.com'}/team-invite/${invitation.token}`;

    // Send email
    const { data: inviterProfile } = await admin.from('profiles').select('name').eq('id', user.id).single();
    try {
      const { sendInviteEmail } = await import('@/lib/email');
      await sendInviteEmail({
        to: email.trim(),
        inviterName: inviterProfile?.name ?? 'Someone',
        boardName: team.name,
        inviteUrl,
        role,
        needsUpgrade: false,
      });
    } catch (emailErr) {
      console.error('Team invite email failed (non-fatal):', emailErr);
    }

    return NextResponse.json({ invitation, invite_url: inviteUrl });
  } catch (err) {
    console.error('POST /api/teams/[id]/members error:', err);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
