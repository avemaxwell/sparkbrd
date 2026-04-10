-- ============================================================
-- Tack attribution
-- ============================================================
-- Adds an `added_by` column to tacks so collaborator-added
-- tacks can display a small avatar indicating who added them.
-- ============================================================

ALTER TABLE tacks
  ADD COLUMN IF NOT EXISTS added_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
