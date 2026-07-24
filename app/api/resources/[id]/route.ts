import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    let owner = null;
    if (resource.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url, is_official, is_founding_educator')
        .eq('id', resource.owner_id)
        .maybeSingle();
      owner = profile;
    }

    // Paid resources: only the owner or a verified buyer gets working
    // attachment links. Everyone else still sees file names (so they know
    // what's included) but the url is stripped server-side — the client
    // never receives anything usable to bypass the "Buy" gate with.
    let purchased = true;
    if (resource.price_cents && resource.price_cents > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      const isOwner = !!user && user.id === resource.owner_id;
      if (!isOwner) {
        purchased = false;
        if (user) {
          const { data: purchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('resource_id', id)
            .eq('buyer_id', user.id)
            .maybeSingle();
          purchased = !!purchase;
        }
      }
      if (!isOwner && !purchased) {
        resource.attachments = (resource.attachments ?? []).map((a: { name: string; url: string }) => ({ name: a.name, url: '' }));
      }
    }

    const { data: { user: viewer } } = await supabase.auth.getUser();
    const { data: votes } = await supabase
      .from('resource_votes')
      .select('vote, user_id')
      .eq('resource_id', id);
    const upvotes = (votes ?? []).filter((v) => v.vote === 1).length;
    const downvotes = (votes ?? []).filter((v) => v.vote === -1).length;
    const myVote = viewer ? (votes ?? []).find((v) => v.user_id === viewer.id)?.vote ?? null : null;

    return NextResponse.json({
      resource: { ...resource, owner, purchased, upvotes, downvotes, netScore: upvotes - downvotes, myVote },
    });
  } catch (err) {
    console.error('GET /api/resources/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowed = [
      'title', 'subject', 'grade_band', 'resource_type', 'state',
      'standards', 'materials', 'learning_targets', 'directions',
      'photos', 'attachments', 'section_order', 'status',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    // Same rule as POST: a price only sticks if the seller has completed
    // Stripe Connect onboarding; otherwise it's silently dropped to free.
    if ('price_cents' in body) {
      if (body.price_cents && body.price_cents > 0) {
        const { data: sellerProfile } = await supabase
          .from('profiles')
          .select('is_creator, stripe_connect_payouts_enabled')
          .eq('id', user.id)
          .single();
        update.price_cents = sellerProfile?.is_creator && sellerProfile.stripe_connect_payouts_enabled
          ? Math.round(body.price_cents)
          : null;
      } else {
        update.price_cents = null;
      }
    }

    update.updated_at = new Date().toISOString();

    const { data: resource, error } = await supabase
      .from('resources')
      .update(update)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (err) {
    console.error('PATCH /api/resources/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('resources').delete().eq('id', id).eq('owner_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/resources/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
