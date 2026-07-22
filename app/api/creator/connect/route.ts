import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sparkurio.com';

// Creates (if needed) a Stripe Connect Express account for the signed-in user
// and returns an onboarding link. Stripe hosts the entire KYC/bank-details
// flow, so there's no custom onboarding UI to build here.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const agreedToTerms = body?.agreedToTerms === true;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, email, creator_terms_accepted_at, plan')
      .eq('id', user.id)
      .single();

    // Selling requires a Creator Pro subscription — checked here, not just
    // by hiding the UI, so a direct API call can't bypass it either.
    if (profile?.plan !== 'creator_pro') {
      return NextResponse.json({ error: 'Creator Pro is required to sell resources.' }, { status: 400 });
    }

    // Explicit, timestamped consent to the Marketplace Terms (Terms of
    // Service, Section 16) is required before we ever create a Stripe
    // account for this user — checked here, not just hidden behind a
    // disabled button in the UI, since that's what actually makes it hold
    // up as evidence of agreement.
    const alreadyAgreed = !!profile?.creator_terms_accepted_at;
    if (!alreadyAgreed && !agreedToTerms) {
      return NextResponse.json({ error: 'You must agree to the Creator Terms before enabling payouts.' }, { status: 400 });
    }

    const profileUpdate: Record<string, unknown> = { is_creator: true };
    if (!alreadyAgreed) profileUpdate.creator_terms_accepted_at = new Date().toISOString();

    let accountId = profile?.stripe_connect_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile?.email || user.email,
        metadata: { supabase_user_id: user.id },
        // Destination charges (used in /api/resources/[id]/purchase) require
        // the connected account to actually hold the transfers capability —
        // without requesting it here, Express onboarding may not collect
        // what's needed for `transfer_data.destination` payouts to work.
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      profileUpdate.stripe_connect_account_id = accountId;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${SITE_URL}/settings?tab=account&connect=refresh`,
      return_url: `${SITE_URL}/settings?tab=account&connect=return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Connect onboarding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Returns a login link into the Express dashboard for a creator who has
// already completed onboarding (for managing payouts/bank details).
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_connect_account_id || !profile.stripe_connect_payouts_enabled) {
      return NextResponse.json({ error: 'Payouts are not enabled yet' }, { status: 400 });
    }

    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_connect_account_id);
    return NextResponse.json({ url: loginLink.url });
  } catch (error: any) {
    console.error('Connect login link error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
