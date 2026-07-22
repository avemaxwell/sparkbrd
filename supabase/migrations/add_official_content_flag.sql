-- Distinguishes real, first-party Sparkurio-produced resources (finished,
-- ready-to-use worksheets from the internal generator pipeline, or other
-- Sparkurio-authored content) from community submissions and from Starter
-- Library AI drafts. Unlike is_starter, official content is fully
-- discoverable (Discover/search/subjects) — it's finished material, not
-- something awaiting classroom validation.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;
