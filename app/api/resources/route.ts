import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/resources — list published resources for discovery surfaces
// (explore, subject pages, search). Owner info is included so the client can
// compute a "Verified Educator" badge without a second round trip, and a
// save-count (from tacks.resource_id) stands in for a real "downloads" stat.
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const gradeBand = searchParams.get('grade_band');
    const resourceType = searchParams.get('resource_type');
    const standard = searchParams.get('standard');
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '60'), 100);
    // Default surfaces (explore/search/subjects) never show starter content —
    // ?starter=true is the one exception, used only by the Labs page.
    const starterOnly = searchParams.get('starter') === 'true';

    let query = supabase
      .from('resources')
      .select('id, owner_id, title, subject, grade_band, resource_type, standards, photos, duration, is_starter, price_cents, created_at')
      .eq('status', 'published')
      .eq('is_starter', starterOnly)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (subject) query = query.eq('subject', subject);
    if (gradeBand) query = query.eq('grade_band', gradeBand);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (standard) query = query.contains('standards', [standard]);
    if (q) query = query.ilike('title', `%${q.replace(/[%_]/g, '\\$&')}%`);

    const { data: resources, error } = await query;
    if (error) throw error;

    const list = resources ?? [];
    if (list.length === 0) return NextResponse.json({ resources: [] });

    const ownerIds = [...new Set(list.map((r) => r.owner_id).filter(Boolean))];
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, is_verified_educator, is_official, is_founding_educator')
      .in('id', ownerIds);
    const ownerMap = Object.fromEntries((owners ?? []).map((o) => [o.id, o]));

    const resourceIds = list.map((r) => r.id);
    const { data: saveRows } = await supabase
      .from('tacks')
      .select('resource_id')
      .in('resource_id', resourceIds);
    const saveCounts: Record<string, number> = {};
    for (const row of saveRows ?? []) {
      if (row.resource_id) saveCounts[row.resource_id] = (saveCounts[row.resource_id] ?? 0) + 1;
    }

    return NextResponse.json({
      resources: list.map((r) => ({
        ...r,
        owner: ownerMap[r.owner_id] ?? null,
        save_count: saveCounts[r.id] ?? 0,
      })),
    });
  } catch (err) {
    console.error('GET /api/resources error:', err);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      title, subject, grade_band, resource_type, state,
      standards, materials, learning_targets, directions,
      photos, attachments, section_order, status, price_cents,
    } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    if (!grade_band) return NextResponse.json({ error: 'Grade level is required' }, { status: 400 });
    if (!resource_type) return NextResponse.json({ error: 'Resource type is required' }, { status: 400 });

    // Never trust a client-sent price — only honor it if this seller has
    // actually completed Stripe Connect onboarding, otherwise silently drop
    // it to free rather than publishing an unsellable "paid" resource.
    let resolvedPriceCents: number | null = null;
    if (price_cents && price_cents > 0) {
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('is_creator, stripe_connect_payouts_enabled')
        .eq('id', user.id)
        .single();
      if (sellerProfile?.is_creator && sellerProfile.stripe_connect_payouts_enabled) {
        resolvedPriceCents = Math.round(price_cents);
      }
    }

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        subject,
        grade_band,
        resource_type,
        state: state || null,
        standards: standards ?? [],
        materials: materials ?? [],
        learning_targets: learning_targets ?? [],
        directions: directions ?? [],
        photos: photos ?? [],
        attachments: attachments ?? [],
        section_order: section_order ?? null,
        status: status === 'published' ? 'published' : 'draft',
        price_cents: resolvedPriceCents,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (err) {
    console.error('POST /api/resources error:', err);
    return NextResponse.json({ error: 'Failed to save resource' }, { status: 500 });
  }
}
