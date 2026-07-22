-- Per-resource paid purchases: a creator can price an individual resource,
-- buyers pay once via Stripe Connect (destination charge, 20% platform fee),
-- and the resource's real attachment files are gated behind ownership/purchase.
--
-- Free resources (price_cents null/0) are completely unaffected — they keep
-- using the existing public `resource-attachments` bucket and plain URLs.
-- Paid resources' attachments go into a new PRIVATE bucket instead: no public
-- SELECT policy exists on it, so files are only reachable through a
-- server-issued short-lived signed URL (see /api/resources/[id]/download),
-- not by guessing/replaying a stored public URL.

ALTER TABLE resources ADD COLUMN IF NOT EXISTS price_cents integer CHECK (price_cents IS NULL OR price_cents > 0);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS purchases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id       uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  buyer_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents      integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  stripe_checkout_session_id text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS purchases_buyer_id_idx ON purchases(buyer_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can read their own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = buyer_id);

-- No INSERT/UPDATE/DELETE policy for regular users — purchases are only ever
-- written by the Stripe webhook handler using the service-role key, which
-- bypasses RLS entirely (mirrors the pattern already used for subscription
-- webhook writes to `profiles`).

-- ── Private bucket for paid-resource attachments ────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-attachments-paid', 'resource-attachments-paid', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload paid resource attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resource-attachments-paid' AND auth.role() = 'authenticated');

CREATE POLICY "Owners can delete their own paid resource attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resource-attachments-paid' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Deliberately no SELECT policy on this bucket for `anon`/`authenticated` —
-- reads only happen server-side via the service-role key when issuing a
-- signed URL after verifying purchase/ownership.
