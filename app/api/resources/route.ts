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
    // Default surfaces (explore/search/subjects) only ever show resources
    // that have earned Classroom Proven status — ?starter=true is the one
    // exception (used only by the Labs page), showing unproven content
    // instead. Not the same thing as is_starter (which just means
    // "Sparkurio wrote this with AI") — see add_resource_voting.sql.
    const starterOnly = searchParams.get('starter') === 'true';

    let query = supabase
      .from('resources')
      .select('id, owner_id, title, subject, grade_band, resource_type, standards, photos, duration, is_starter, classroom_proven, price_cents, created_at')
      .eq('status', 'published')
      .eq('classroom_proven', !starterOnly)
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

    // Vote data only matters in Labs (unproven content) — skip the extra
    // query on every normal Discover/subject-page fetch.
    let scoresByResource: Record<string, number> = {};
    let myVotesByResource: Record<string, 1 | -1> = {};
    if (starterOnly) {
      const { data: voteRows } = await supabase
        .from('resource_votes')
        .select('resource_id, vote, user_id')
        .in('resource_id', resourceIds);
      const { data: { user: viewer } } = await supabase.auth.getUser();
      for (const row of voteRows ?? []) {
        scoresByResource[row.resource_id] = (scoresByResource[row.resource_id] ?? 0) + row.vote;
        if (viewer && row.user_id === viewer.id) myVotesByResource[row.resource_id] = row.vote;
      }
    }

    return NextResponse.json({
      resources: list.map((r) => ({
        ...r,
        owner: ownerMap[r.owner_id] ?? null,
        save_count: saveCounts[r.id] ?? 0,
        vote_score: scoresByResource[r.id] ?? 0,
        my_vote: myVotesByResource[r.id] ?? null,
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

    const requestBody = await request.json();
    const {
      title, subject, grade_band, resource_type, state,
      standards, materials, learning_targets, directions, body: lessonBody,
      photos, attachments, section_order, status, price_cents, blocks,
    } = requestBody;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    if (!grade_band) return NextResponse.json({ error: 'Grade level is required' }, { status: 400 });
    if (!resource_type) return NextResponse.json({ error: 'Resource type is required' }, { status: 400 });

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('is_creator, stripe_connect_payouts_enabled, is_official')
      .eq('id', user.id)
      .single();

    // Never trust a client-sent price — only honor it if this seller has
    // actually completed Stripe Connect onboarding, otherwise silently drop
    // it to free rather than publishing an unsellable "paid" resource.
    let resolvedPriceCents: number | null = null;
    if (price_cents && price_cents > 0 && ownerProfile?.is_creator && ownerProfile.stripe_connect_payouts_enabled) {
      resolvedPriceCents = Math.round(price_cents);
    }

    // Official Sparkurio content is already vetted, so it skips the Labs
    // gate — everyone else's new resources start unproven regardless of
    // plan (Founding Educators included) and earn their way to Discover via
    // community upvotes. See app/api/resources/[id]/vote/route.ts.
    const isPublishing = status === 'published';
    const classroomProven = isPublishing && !!ownerProfile?.is_official;

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
        body: lessonBody || null,
        photos: photos ?? [],
        attachments: attachments ?? [],
        section_order: section_order ?? null,
        blocks: blocks ?? null,
        status: isPublishing ? 'published' : 'draft',
        price_cents: resolvedPriceCents,
        classroom_proven: classroomProven,
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
