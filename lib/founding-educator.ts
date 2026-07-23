import type { SupabaseClient } from '@supabase/supabase-js';

// Founding Educator: free Sparkurio Plus for 1 year, contingent on
// publishing 5 resources every rolling 30-day period (enforced by
// app/api/cron/founding-educator). Consent is captured at signup as
// user_metadata (options.data on supabase.auth.signUp) rather than a
// request body, so it survives the gap between signUp() and a session
// actually existing — email confirmation may delay that by any amount of
// time, but user_metadata is stored on auth.users immediately either way.

export async function enrollFoundingEducatorIfConsented(
  admin: SupabaseClient,
  user: { id: string; user_metadata?: Record<string, unknown> }
) {
  if (user.user_metadata?.founding_educator_consent !== true) return;

  const { data: profile } = await admin
    .from('profiles')
    .select('is_founding_educator')
    .eq('id', user.id)
    .single();

  if (!profile || profile.is_founding_educator) return;

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await admin
    .from('profiles')
    .update({
      plan: 'plus',
      plan_billing_period: null,
      is_founding_educator: true,
      founding_educator_started_at: now.toISOString(),
      founding_educator_period_start: now.toISOString(),
      founding_educator_expires_at: expiresAt.toISOString(),
      founding_educator_reminder_sent_period: null,
      founding_educator_terms_accepted_at: now.toISOString(),
      founding_educator_ended_at: null,
      founding_educator_ended_reason: null,
    })
    .eq('id', user.id);
}
