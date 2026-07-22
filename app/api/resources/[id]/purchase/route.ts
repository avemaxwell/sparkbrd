import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sparkurio.com';
// Default 20% platform fee; Creator Pro's pricing page already advertises a
// discounted 7% marketplace commission as a plan perk, so honor that here
// rather than letting the billing copy and actual checkout behavior diverge.
const DEFAULT_PLATFORM_FEE_RATE = 0.20;
const CREATOR_PRO_PLATFORM_FEE_RATE = 0.07;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: resource } = await supabase
      .from('resources')
      .select('id, title, owner_id, price_cents, status')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    if (!resource.price_cents || resource.price_cents <= 0) {
      return NextResponse.json({ error: 'This resource is not for sale' }, { status: 400 });
    }
    if (resource.owner_id === user.id) {
      return NextResponse.json({ error: "You can't buy your own resource" }, { status: 400 });
    }

    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('resource_id', id)
      .eq('buyer_id', user.id)
      .maybeSingle();
    if (existingPurchase) {
      return NextResponse.json({ error: 'You already own this resource' }, { status: 400 });
    }

    const { data: owner } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled, plan')
      .eq('id', resource.owner_id)
      .single();

    if (!owner?.stripe_connect_account_id || !owner.stripe_connect_payouts_enabled) {
      return NextResponse.json({ error: 'This creator is not set up to receive payments yet' }, { status: 400 });
    }

    const feeRate = owner.plan === 'creator_pro' ? CREATOR_PRO_PLATFORM_FEE_RATE : DEFAULT_PLATFORM_FEE_RATE;
    const feeCents = Math.round(resource.price_cents * feeRate);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: resource.price_cents,
            product_data: { name: resource.title },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: owner.stripe_connect_account_id },
      },
      success_url: `${SITE_URL}/resources/${id}?purchase=success`,
      cancel_url: `${SITE_URL}/resources/${id}?purchase=cancelled`,
      metadata: {
        resource_id: id,
        buyer_id: user.id,
        platform_fee_cents: String(feeCents),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Resource purchase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
