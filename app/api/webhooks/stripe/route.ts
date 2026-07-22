import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { planForPriceId } from '@/lib/stripe-plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use service role for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'payment') {
          // One-time resource purchase, not a subscription.
          const resourceId = session.metadata?.resource_id;
          const buyerId = session.metadata?.buyer_id;
          const feeCents = session.metadata?.platform_fee_cents;

          if (resourceId && buyerId) {
            await supabase
              .from('purchases')
              .upsert(
                {
                  resource_id: resourceId,
                  buyer_id: buyerId,
                  amount_cents: session.amount_total ?? 0,
                  platform_fee_cents: feeCents ? parseInt(feeCents, 10) : 0,
                  stripe_checkout_session_id: session.id,
                },
                { onConflict: 'resource_id,buyer_id', ignoreDuplicates: true }
              );

            console.log(`Recorded purchase of resource ${resourceId} by ${buyerId}`);
          }
          break;
        }

        const userId = session.metadata?.user_id;

        if (userId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Determine plan based on price
          const priceId = subscription.items.data[0].price.id;
          const resolved = planForPriceId(priceId);

          // Update user's plan
          await supabase
            .from('profiles')
            .update({
              plan: resolved?.plan ?? 'free',
              plan_billing_period: resolved?.billingPeriod ?? null,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId);

          console.log(`Updated user ${userId} to ${resolved?.plan ?? 'free'} plan`);
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const payoutsEnabled = !!account.charges_enabled && !!account.payouts_enabled;

        await supabase
          .from('profiles')
          .update({ stripe_connect_payouts_enabled: payoutsEnabled })
          .eq('stripe_connect_account_id', account.id);

        console.log(`Connect account ${account.id} payouts_enabled=${payoutsEnabled}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Determine plan based on price
        const priceId = subscription.items.data[0].price.id;
        const resolved = planForPriceId(priceId);

        // Update plan
        await supabase
          .from('profiles')
          .update({ plan: resolved?.plan ?? 'free', plan_billing_period: resolved?.billingPeriod ?? null })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Updated subscription ${subscription.id} to ${resolved?.plan ?? 'free'} plan`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Downgrade to free
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            plan_billing_period: null,
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Cancelled subscription ${subscription.id}, reverted to free`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}