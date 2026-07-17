-- Educator Perks: lightweight school affiliation verification.
-- Personalization first (role, captured at onboarding for every user type,
-- including homeschool as a first-class option) — verification is a
-- separate, opt-in step that only unlocks classroom-educator perks.
-- Institutional email lives only in school_verifications, never on profiles
-- or anywhere publicly readable.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text CHECK (role IN (
    'public_school_educator', 'private_school_educator', 'college_educator',
    'preservice_educator', 'homeschool', 'tutor_other', 'just_browsing'
  )),
  ADD COLUMN IF NOT EXISTS is_verified_educator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_school_domain text,
  ADD COLUMN IF NOT EXISTS verified_institution_name text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS display_school_publicly boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS school_verifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_email      text NOT NULL,
  email_domain      text NOT NULL,
  institution_name  text,
  method            text NOT NULL CHECK (method IN ('email_link', 'google', 'microsoft')),
  token             text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at        timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  verified_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_verifications_user_id ON school_verifications(user_id);

ALTER TABLE school_verifications ENABLE ROW LEVEL SECURITY;

-- Owner-only access. No public-by-token policy (unlike team_invitations) —
-- both API routes use the service-role client, so this is a backstop, not
-- the access path, and it keeps the institutional email off any anon-key query.
CREATE POLICY "Users can view their own school verifications"
  ON school_verifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own school verifications"
  ON school_verifications FOR INSERT
  WITH CHECK (user_id = auth.uid());
