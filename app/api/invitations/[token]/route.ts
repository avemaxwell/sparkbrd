import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// ─── GET /api/invitations/[token] ─────────────────────────────────────────────
// Returns public-safe invitation details for the accept page.
// Uses service role because the visitor may not be authenticated yet.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const admin = createAdminClient();

    const { data: invitation } = await admin
      .from('board_invitations')
      .select('id, board_id, email, role, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Fetch board name for the accept page.
    const { data: board } = await admin
      .from('boards')
      .select('id, name, owner_id')
      .eq('id', invitation.board_id)
      .single();

    // Fetch inviter's display name.
    const { data: inviterProfile } = board
      ? await admin
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', board.owner_id)
          .single()
      : { data: null };

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
      },
      board: board ? { id: board.id, name: board.name } : null,
      inviter: inviterProfile ?? null,
    });
  } catch (err) {
    console.error('GET /api/invitations/[token] error:', err);
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}

// ─── POST /api/invitations/[token] ────────────────────────────────────────────
// Accepts an invitation — must be authenticated.
// Creates the board_members row and marks the invitation as accepted.

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Look up the invitation via service role (bypasses RLS on board_invitations).
    const { data: invitation } = await admin
      .from('board_invitations')
      .select('id, board_id, email, role, expires_at, accepted_at, invited_by')
      .eq('token', token)
      .maybeSingle();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Check the user isn't already a member.
    const { data: existing } = await admin
      .from('board_members')
      .select('id')
      .eq('board_id', invitation.board_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Already a member — just redirect them to the board.
      return NextResponse.json({ board_id: invitation.board_id, already_member: true });
    }

    // Insert board_members row via service role to bypass RLS
    // (RLS only allows inserts by the board owner; accepting is done by the invitee).
    const { error: memberErr } = await admin
      .from('board_members')
      .insert({
        board_id: invitation.board_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
      });

    if (memberErr) throw memberErr;

    // Mark invitation as accepted.
    await admin
      .from('board_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return NextResponse.json({ board_id: invitation.board_id });
  } catch (err) {
    console.error('POST /api/invitations/[token] error:', err);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}

// ─── DELETE /api/invitations/[token] ──────────────────────────────────────────
// Revokes a pending invitation. Board owner only.

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: invitation } = await admin
      .from('board_invitations')
      .select('id, board_id')
      .eq('token', token)
      .maybeSingle();

    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    // Verify the caller owns the board.
    const { data: board } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', invitation.board_id)
      .single();

    if (!board || board.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await admin.from('board_invitations').delete().eq('id', invitation.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/invitations/[token] error:', err);
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
  }
}
