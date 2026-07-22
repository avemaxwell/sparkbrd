import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { planForPriceId } from '@/lib/stripe-plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
   apiVersion: '2026-03-25.dahlia',
});

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json();
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Creator Pro is the only plan where selling becomes available, so land
    // that upgrade directly on the Settings tab that shows the new payout
    // card instead of the generic Profile tab every other plan lands on.
    const isCreatorPro = planForPriceId(priceId)?.plan === 'creator_pro';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sparkurio.com';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: isCreatorPro
        ? `${siteUrl}/settings?upgrade=success&tab=account`
        : `${siteUrl}/settings?upgrade=success`,
      cancel_url: `${siteUrl}/settings/billing?upgrade=cancelled`,
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}