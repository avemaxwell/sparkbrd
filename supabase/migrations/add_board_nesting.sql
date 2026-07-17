-- Nested collections: a board can live inside another board (Class > Unit >
-- Lesson, or any depth/naming a teacher wants — freeform, not enforced).
-- parent_id is SET NULL (not CASCADE) on delete, matching the existing
-- philosophy of never silently destroying user content (see
-- preserve_tacks_on_board_delete.sql) — deleting a parent un-parents its
-- children back to the top-level grid instead of deleting them.
-- kind is a purely cosmetic freeform label ("Class"/"Unit"/"Lesson"/
-- "Project"/anything), not an enforced taxonomy.

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES boards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kind text;

CREATE INDEX IF NOT EXISTS idx_boards_parent_id ON boards(parent_id);
