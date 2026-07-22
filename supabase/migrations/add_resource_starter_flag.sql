-- Distinguishes AI-drafted "Sparkurio Starter Library" seed content (used to
-- populate Sparkurio Labs before real classroom-tested submissions exist)
-- from real, community-submitted resources. Starter resources have no
-- owner, no "Classroom Proven"/verified-educator badges, and are excluded
-- from normal discovery (explore/search/subjects) — they only surface in
-- Labs, where the entire premise is "not yet classroom-tested."
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_starter boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_resources_is_starter ON resources(is_starter) WHERE is_starter = true;
