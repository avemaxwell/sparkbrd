-- Add board_type to distinguish canvas boards (moodboard / studio) from mosaic grid boards.
-- Existing boards default to 'canvas' — no disruption.
-- Once set at creation time, board_type is intentionally not editable.

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS board_type text NOT NULL DEFAULT 'canvas'
  CHECK (board_type IN ('canvas', 'mosaic'));
