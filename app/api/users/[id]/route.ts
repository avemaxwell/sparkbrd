import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// GET /api/users/[id] — public profile + their public boards
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const [profileRes, boardsRes] = await Promise.all([
      supabase.from('profiles').select('id, name, avatar_url, bio, created_at, is_verified_educator, verified_institution_name, display_school_publicly').eq('id', id).single(),
      supabase
        .from('boards')
        .select('id, name, description, background_color, vibe')
        .eq('owner_id', id)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
    ]);

    if (!profileRes.data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Never expose the institution name unless the user opted in to display it —
    // school email/domain are never selected here at all.
    const { display_school_publicly, verified_institution_name, ...rest } = profileRes.data;
    const profile = {
      ...rest,
      verified_institution_name: display_school_publicly ? verified_institution_name : null,
    };

    return NextResponse.json({ profile, boards: boardsRes.data ?? [] });
  } catch (err) {
    console.error('GET /api/users/[id] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
