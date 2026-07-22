-- "collection" is the new default board_type: a clean resource-grid view
-- (ResourceCollectionView) for organizing saved lesson plans/worksheets,
-- replacing the old canvas/mosaic moodboard UI as what new boards use.
-- Existing 'canvas'/'mosaic' boards are untouched and keep rendering via
-- their existing components — this only changes what NEW boards default to
-- and allows the new value.

ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_board_type_check;
ALTER TABLE boards
  ALTER COLUMN board_type SET DEFAULT 'collection',
  ADD CONSTRAINT boards_board_type_check CHECK (board_type IN ('canvas', 'mosaic', 'collection'));
