-- Labs-first quality gate: new resources must earn "Classroom Proven" via
-- community voting before appearing in Discover/Search. See
-- app/api/resources/[id]/vote/route.ts for the promote/remove logic.
--
-- classroom_proven is deliberately separate from is_starter — is_starter
-- means "Sparkurio wrote this with AI" (an attribution fact, drives the
-- "Sparkurio Starter Library" name override), classroom_proven means "this
-- has been proven in a classroom" (a trust/gating fact). A real teacher's
-- brand-new Labs submission needs the second without the first.

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS classroom_proven boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS classroom_proven_at timestamptz,
  ADD COLUMN IF NOT EXISTS labs_removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS labs_removed_reason text CHECK (labs_removed_reason IN ('downvotes'));

-- Grandfather in everything already live — only new submissions go through
-- the gate going forward.
UPDATE resources SET classroom_proven = true WHERE status = 'published';

CREATE TABLE IF NOT EXISTS resource_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote        smallint NOT NULL CHECK (vote IN (1, -1)),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_votes_resource_id ON resource_votes(resource_id);

ALTER TABLE resource_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes on published resources are readable by anyone"
  ON resource_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM resources WHERE resources.id = resource_votes.resource_id
    AND (resources.status = 'published' OR resources.owner_id = auth.uid())
  ));

CREATE POLICY "Authenticated users can cast their own vote"
  ON resource_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their own vote"
  ON resource_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resources_classroom_proven ON resources(classroom_proven) WHERE status = 'published';
