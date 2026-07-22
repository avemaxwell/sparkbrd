import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/account/export — compiles the signed-in user's own data (profile,
// collections + their saved resources, published resources, purchases) into
// a downloadable JSON file. Scoped entirely to the caller via their own
// session, not an admin client — RLS enforces the same ownership rules as
// the rest of the app.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, plan, created_at, is_verified_educator, verified_institution_name, is_creator')
      .eq('id', user.id)
      .single();

    const { data: boards } = await supabase
      .from('boards')
      .select('id, name, description, board_type, is_public, created_at')
      .eq('owner_id', user.id);

    const boardIds = (boards ?? []).map((b) => b.id);
    const { data: tacks } = boardIds.length > 0
      ? await supabase
          .from('tacks')
          .select('id, board_id, title, note, resource_id, created_at')
          .in('board_id', boardIds)
      : { data: [] };

    const { data: resources } = await supabase
      .from('resources')
      .select('id, title, subject, grade_band, resource_type, status, price_cents, created_at')
      .eq('owner_id', user.id);

    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, resource_id, amount_cents, created_at')
      .eq('buyer_id', user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profile ?? null,
      collections: (boards ?? []).map((b) => ({
        ...b,
        items: (tacks ?? []).filter((t) => t.board_id === b.id),
      })),
      published_resources: resources ?? [],
      purchases: purchases ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sparkurio-data-export-${user.id}.json"`,
      },
    });
  } catch (err) {
    console.error('GET /api/account/export error:', err);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
