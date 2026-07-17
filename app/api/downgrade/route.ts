import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// POST /api/downgrade
// Downgrades the current user to the free plan and cancels their Stripe
// subscription if one exists. Collections are unlimited in count for every
// plan (the only plan-gated distinction is public vs. private), so downgrading
// never deletes anything — private collections simply stop being creatable
// going forward; existing ones are untouched.

export async function POST() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, plan, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    if (profile.plan === 'free') return NextResponse.json({ error: 'Already on free plan' }, { status: 400 });

    // Cancel Stripe subscription via admin client if one exists
    if (profile.stripe_customer_id) {
      try {
        // Lazy-import Stripe to avoid cold-start cost when not needed
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });
        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 5,
        });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      } catch (stripeErr) {
        // Non-fatal: downgrade still proceeds even if Stripe cancel fails
        console.error('Stripe cancel error (non-fatal):', stripeErr);
      }
    }

    // Update profile to free plan
    await admin
      .from('profiles')
      .update({ plan: 'free', plan_billing_period: null })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Downgrade error:', err);
    return NextResponse.json({ error: 'Downgrade failed' }, { status: 500 });
  }
}
