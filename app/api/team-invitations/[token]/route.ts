import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logTeamActivity } from '@/lib/team-activity';

type Params = { params: Promise<{ token: string }> };

// GET /api/team-invitations/[token] — fetch invite details (public, no auth required)
export async function GET(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const admin = createAdminClient();

    const { data: invitation } = await admin
      .from('team_invitations')
      .select('id, email, role, expires_at, team_id, invited_by, teams(id, name, slug, avatar_color)')
      .eq('token', token)
      .single();

    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    const { data: inviterProfile } = await admin
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', invitation.invited_by)
      .single();

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        team: invitation.teams,
        inviter: inviterProfile,
      },
    });
  } catch (err) {
    console.error('GET /api/team-invitations/[token] error:', err);
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}

// POST /api/team-invitations/[token] — accept invite (must be authenticated)
export async function POST(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: invitation } = await admin
      .from('team_invitations')
      .select('id, email, role, expires_at, team_id, invited_by')
      .eq('token', token)
      .single();

    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    // Verify email matches (case-insensitive) using auth user email (always present)
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation was sent to a different email address' }, { status: 403 });
    }

    // Verify user has team plan
    const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).single();
    if (profile?.plan !== 'team') {
      return NextResponse.json({ error: 'You need a Team plan to join a team workspace. Upgrade in settings.' }, { status: 403 });
    }

    // Check not already a member
    const { data: existing } = await admin
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Already a member — clean up invite and return success
      await admin.from('team_invitations').delete().eq('id', invitation.id);
      return NextResponse.json({ success: true, already_member: true });
    }

    // Insert membership
    const { error: memberErr } = await admin.from('team_members').insert({
      team_id: invitation.team_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.invited_by,
    });

    if (memberErr) throw memberErr;

    // Delete the used invitation
    await admin.from('team_invitations').delete().eq('id', invitation.id);

    const { data: team } = await admin.from('teams').select('id, name, slug').eq('id', invitation.team_id).single();

    // Log member joined activity
    const { data: actorProfile } = await admin.from('profiles').select('name, avatar_url').eq('id', user.id).single();
    await logTeamActivity({
      teamId: invitation.team_id,
      userId: user.id,
      type: 'member_joined',
      actorName: actorProfile?.name ?? null,
      actorAvatar: actorProfile?.avatar_url ?? null,
    });

    return NextResponse.json({ success: true, team });
  } catch (err) {
    console.error('POST /api/team-invitations/[token] error:', err);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
