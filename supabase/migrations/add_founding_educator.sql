-- Founding Educator program: free Sparkurio Plus for 1 year, contingent on
-- publishing 5 resources every rolling 30-day period. See
-- app/(auth)/signup/page.tsx and app/api/cron/founding-educator/route.ts.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_founding_educator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_educator_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS founding_educator_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS founding_educator_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS founding_educator_reminder_sent_period timestamptz,
  ADD COLUMN IF NOT EXISTS founding_educator_terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS founding_educator_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS founding_educator_ended_reason text
    CHECK (founding_educator_ended_reason IN ('quota_missed', 'year_complete'));

CREATE INDEX IF NOT EXISTS profiles_founding_educator_active_idx
  ON profiles (is_founding_educator) WHERE is_founding_educator = true;
