-- Timestamped record of a Creator explicitly agreeing to the Marketplace
-- terms (Terms of Service, Section 16) before Stripe Connect payouts are
-- enabled. An unread terms page is weak evidence of agreement — this column
-- is what actually makes Section 16 enforceable, since /api/creator/connect
-- refuses to proceed without it being set.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_terms_accepted_at timestamptz;
