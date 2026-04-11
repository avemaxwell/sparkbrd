import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PLAN_LIMITS } from '@/lib/plan-limits';

// POST /api/downgrade
// Downgrades the current user to the free plan.
// Deletes excess boards (oldest activity first) to enforce free limits,
// then cancels the Stripe subscription if one exists.

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

    const freeLimit = PLAN_LIMITS.free.max_boards; // 5

    // Fetch all boards owned by this user, oldest updated_at first
    const { data: boards } = await supabase
      .from('boards')
      .select('id, name, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: true }); // oldest activity first

    const boardList = boards ?? [];
    const excess = boardList.length - freeLimit;
    const deletedBoards: { id: string; name: string }[] = [];

    if (excess > 0) {
      const toDelete = boardList.slice(0, excess);
      for (const b of toDelete) {
        await supabase.from('boards').delete().eq('id', b.id);
        deletedBoards.push({ id: b.id, name: b.name });
      }
    }

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

    // Update profile to free plan with correct limits
    await admin
      .from('profiles')
      .update({
        plan: 'free',
        plan_limits: {
          max_boards: PLAN_LIMITS.free.max_boards,
          max_tacks_per_board: PLAN_LIMITS.free.max_tacks_per_board,
        },
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      deleted_boards: deletedBoards,
    });
  } catch (err) {
    console.error('Downgrade error:', err);
    return NextResponse.json({ error: 'Downgrade failed' }, { status: 500 });
  }
}
