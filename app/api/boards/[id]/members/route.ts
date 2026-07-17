import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendInviteEmail } from '@/lib/email';

// ─── GET /api/boards/[id]/members ────────────────────────────────────────────
// Returns current members and pending (unaccepted) invitations.
// Board owner only.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify caller is board owner.
    const { data: board } = await supabase
      .from('boards')
      .select('id, owner_id')
      .eq('id', boardId)
      .single();

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    if (board.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch members joined with their profile.
    const { data: members, error: membersErr } = await supabase
      .from('board_members')
      .select('id, user_id, role, created_at')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (membersErr) throw membersErr;

    // Attach profiles to members.
    const memberUserIds = (members ?? []).map(m => m.user_id);
    const { data: profiles } = memberUserIds.length
      ? await supabase
          .from('profiles')
          .select('id, name, avatar_url, email')
          .in('id', memberUserIds)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const enrichedMembers = (members ?? []).map(m => ({
      ...m,
      profile: profileMap[m.user_id] ?? { id: m.user_id, name: null, avatar_url: null, email: null },
    }));

    // Fetch pending (unaccepted) invitations.
    const { data: invitations, error: invErr } = await supabase
      .from('board_invitations')
      .select('id, email, role, expires_at, created_at, token')
      .eq('board_id', boardId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (invErr) throw invErr;

    return NextResponse.json({ members: enrichedMembers, invitations: invitations ?? [] });
  } catch (err) {
    console.error('GET /api/boards/[id]/members error:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// ─── POST /api/boards/[id]/members ───────────────────────────────────────────
// Creates an invitation for an email address and returns the invite URL.
// Board owner only.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify caller is the board owner.
    const { data: board } = await supabase
      .from('boards')
      .select('id, name, owner_id')
      .eq('id', boardId)
      .single();

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    if (board.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('plan, name')
      .eq('id', user.id)
      .single();

    const body = await req.json();
    const { email, role = 'editor' } = body as { email: string; role?: string };

    if (!email?.trim()) return NextResponse.json({ error: 'email is required' }, { status: 400 });
    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'role must be editor or viewer' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Don't invite the owner themselves.
    const { data: { user: ownerUser } } = await supabase.auth.getUser();
    if (ownerUser?.email?.toLowerCase() === normalizedEmail) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    // Check if this user already has a Sparkurio account.
    const { data: existingUser } = await admin
      .from('profiles')
      .select('id, plan')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      const { data: existingMember } = await admin
        .from('board_members')
        .select('id')
        .eq('board_id', boardId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json({ error: 'This person is already a member of the board' }, { status: 409 });
      }
    }

    // Collaboration is available to everyone now, so invites never need an upgrade prompt.
    const needsUpgrade = false;

    // Upsert invitation — if one exists for this email+board, replace it
    // (reset token and expiry so the owner can re-invite).
    const { data: invitation, error: invErr } = await admin
      .from('board_invitations')
      .upsert(
        {
          board_id: boardId,
          email: normalizedEmail,
          role,
          invited_by: user.id,
          // Reset token and expiry on re-invite by letting DB generate new defaults.
          // Supabase upsert on conflict(board_id, email) will update these fields:
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
        },
        { onConflict: 'board_id,email', ignoreDuplicates: false }
      )
      .select('id, email, token, role, expires_at')
      .single();

    if (invErr) throw invErr;

    const origin = new URL(req.url).origin;
    const inviteUrl = `${origin}/invite/${invitation.token}`;

    // ── Send invite email ─────────────────────────────────────────────────────
    try {
      await sendInviteEmail({
        to: normalizedEmail,
        inviterName: ownerProfile?.name ?? 'Someone',
        boardName: board.name,
        inviteUrl,
        role: role as 'editor' | 'viewer',
        needsUpgrade,
      });
    } catch (emailErr) {
      // Non-fatal — the invite is saved and the URL is returned to the owner.
      console.error('[invite] Failed to send email:', emailErr);
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ invitation, invite_url: inviteUrl });
  } catch (err) {
    console.error('POST /api/boards/[id]/members error:', err);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
