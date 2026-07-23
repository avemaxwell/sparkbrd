import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  sendFoundingEducatorReminderEmail,
  sendFoundingEducatorDowngradedEmail,
  sendFoundingEducatorYearCompleteEmail,
} from '@/lib/email';

// GET /api/cron/founding-educator — runs daily (see vercel.json).
// Enforces the Founding Educator program: free Sparkurio Plus for 1 year,
// contingent on publishing 5 resources every rolling 30-day period.
// Idempotent — safe to re-run; each branch only fires once per period via
// founding_educator_reminder_sent_period / the period_start advance itself.

const PERIOD_DAYS = 30;
const QUOTA = 5;
const REMINDER_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

interface FoundingEducatorRow {
  id: string;
  email: string;
  name: string | null;
  founding_educator_period_start: string;
  founding_educator_expires_at: string;
  founding_educator_reminder_sent_period: string | null;
  stripe_customer_id: string | null;
}

async function cancelStripeSubIfAny(stripeCustomerId: string | null) {
  if (!stripeCustomerId) return;
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });
    const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active', limit: 5 });
    for (const sub of subs.data) await stripe.subscriptions.cancel(sub.id);
  } catch (err) {
    console.error('Founding educator cron: Stripe cancel error (non-fatal):', err);
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const results = { advanced: 0, downgradedQuota: 0, downgradedYearComplete: 0, reminded: 0, errors: 0 };

  try {
    const { data: founders, error } = await admin
      .from('profiles')
      .select('id, email, name, founding_educator_period_start, founding_educator_expires_at, founding_educator_reminder_sent_period, stripe_customer_id')
      .eq('is_founding_educator', true);

    if (error) throw error;

    for (const founder of (founders ?? []) as FoundingEducatorRow[]) {
      try {
        const periodStart = new Date(founder.founding_educator_period_start);
        const expiresAt = new Date(founder.founding_educator_expires_at);
        const periodEnd = new Date(periodStart.getTime() + PERIOD_DAYS * DAY_MS);

        const { count } = await admin
          .from('resources')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', founder.id)
          .eq('status', 'published')
          .gte('created_at', periodStart.toISOString())
          .lt('created_at', now.toISOString());

        const publishedCount = count ?? 0;

        if (now >= periodEnd) {
          if (now >= expiresAt) {
            await cancelStripeSubIfAny(founder.stripe_customer_id);
            await admin.from('profiles').update({
              plan: 'free',
              plan_billing_period: null,
              is_founding_educator: false,
              founding_educator_ended_at: now.toISOString(),
              founding_educator_ended_reason: 'year_complete',
            }).eq('id', founder.id);
            await sendFoundingEducatorYearCompleteEmail({ to: founder.email, name: founder.name });
            results.downgradedYearComplete++;
          } else if (publishedCount >= QUOTA) {
            await admin.from('profiles').update({
              founding_educator_period_start: periodEnd.toISOString(),
              founding_educator_reminder_sent_period: null,
            }).eq('id', founder.id);
            results.advanced++;
          } else {
            await cancelStripeSubIfAny(founder.stripe_customer_id);
            await admin.from('profiles').update({
              plan: 'free',
              plan_billing_period: null,
              is_founding_educator: false,
              founding_educator_ended_at: now.toISOString(),
              founding_educator_ended_reason: 'quota_missed',
            }).eq('id', founder.id);
            await sendFoundingEducatorDowngradedEmail({ to: founder.email, name: founder.name });
            results.downgradedQuota++;
          }
          continue;
        }

        const daysLeft = Math.ceil((periodEnd.getTime() - now.getTime()) / DAY_MS);
        const alreadyReminded = founder.founding_educator_reminder_sent_period === founder.founding_educator_period_start;

        if (daysLeft <= REMINDER_WINDOW_DAYS && publishedCount < QUOTA && !alreadyReminded) {
          await sendFoundingEducatorReminderEmail({ to: founder.email, name: founder.name, daysLeft, publishedCount });
          await admin.from('profiles').update({
            founding_educator_reminder_sent_period: founder.founding_educator_period_start,
          }).eq('id', founder.id);
          results.reminded++;
        }
      } catch (perFounderErr) {
        console.error(`Founding educator cron: error processing ${founder.id}:`, perFounderErr);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, processed: founders?.length ?? 0, ...results });
  } catch (err) {
    console.error('Founding educator cron error:', err);
    return NextResponse.json({ error: 'Cron run failed' }, { status: 500 });
  }
}
