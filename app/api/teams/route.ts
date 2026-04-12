import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

// GET /api/teams — list teams the current user belongs to (as owner or member)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // Teams owned by user
    const { data: ownedTeams } = await admin
      .from('teams')
      .select('id, name, slug, avatar_color, owner_id, created_at')
      .eq('owner_id', user.id);

    // Teams user is a member of (not owner)
    const { data: memberships } = await admin
      .from('team_members')
      .select('role, teams(id, name, slug, avatar_color, owner_id, created_at)')
      .eq('user_id', user.id);

    const memberTeams = (memberships ?? []).map((m: any) => ({
      ...m.teams,
      _member_role: m.role,
    }));

    const teams = [
      ...(ownedTeams ?? []).map(t => ({ ...t, _member_role: 'owner' })),
      ...memberTeams.filter(t => t && !(ownedTeams ?? []).find((o: any) => o.id === t.id)),
    ];

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('GET /api/teams error:', err);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

// POST /api/teams — create a new team (team plan only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Enforce team plan for the creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profile?.plan !== 'team') {
      return NextResponse.json({ error: 'Creating a team workspace requires a Team plan. Upgrade in settings.' }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const baseSlug = slugify(name.trim());

    // Ensure slug uniqueness
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const { data: existing } = await admin
        .from('teams')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const { data: team, error } = await admin
      .from('teams')
      .insert({ name: name.trim(), slug, owner_id: user.id })
      .select('id, name, slug, avatar_color, owner_id, created_at')
      .single();

    if (error || !team) throw error;

    return NextResponse.json({ team });
  } catch (err) {
    console.error('POST /api/teams error:', err);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
