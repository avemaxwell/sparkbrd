-- ============================================================
-- Studio Boards — Phase 1
-- Adds a status field to boards for creative brief workflows.
-- status: draft (default) | in_review | approved
-- ============================================================

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'in_review', 'approved'));
