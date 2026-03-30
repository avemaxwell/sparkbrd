import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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
        const userId = session.metadata?.user_id;

        if (userId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Determine plan based on price
          const priceId = subscription.items.data[0].price.id;
          let plan = 'free';
          if (priceId === 'price_1T6yOFFGrjyNBgsd4j26d5Ve') plan = 'pro';
          if (priceId === 'price_1T6yOoFGrjyNBgsdRbarGcc3') plan = 'team';

          // Update user's plan
          await supabase
            .from('profiles')
            .update({
              plan,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId);

          console.log(`Updated user ${userId} to ${plan} plan`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Determine plan based on price
        const priceId = subscription.items.data[0].price.id;
        let plan = 'free';
        if (priceId === 'price_1T6yOFFGrjyNBgsd4j26d5Ve') plan = 'pro';
        if (priceId === 'price_1T6yOoFGrjyNBgsdRbarGcc3') plan = 'team';

        // Update plan
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Updated subscription ${subscription.id} to ${plan} plan`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Downgrade to free
        await supabase
          .from('profiles')
          .update({ 
            plan: 'free',
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