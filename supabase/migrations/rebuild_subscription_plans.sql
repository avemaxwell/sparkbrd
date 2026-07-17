-- Rebuild the subscription model around Sparkurio's new tiers:
-- free, plus, creator_pro, district (marketplace is a seller flag, not a plan).
-- Replaces the old Pinterest-era free/pro/team/enterprise canvas-tool tiers.

-- Drop the old constraint before normalizing, since the new plan values
-- (e.g. 'plus') aren't allowed under the old free/pro/team/enterprise check.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Normalize existing rows into the new plan values before adding the constraint.
UPDATE profiles SET plan = 'plus' WHERE plan IN ('pro', 'team');
UPDATE profiles SET plan = 'district' WHERE plan = 'enterprise';
UPDATE profiles SET plan = 'free' WHERE plan IS NULL OR plan NOT IN ('free', 'plus', 'creator_pro', 'district');

ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'plus', 'creator_pro', 'district'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_billing_period text CHECK (plan_billing_period IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS is_creator boolean NOT NULL DEFAULT false;
