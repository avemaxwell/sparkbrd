-- When a board is deleted, set board_id to NULL on its tacks rather than
-- cascade-deleting them. This preserves re-tacked images so other users
-- can still access content they saved from now-deleted boards.

-- 1. Allow board_id to be null
ALTER TABLE tacks ALTER COLUMN board_id DROP NOT NULL;

-- 2. Re-create the FK with SET NULL instead of CASCADE
ALTER TABLE tacks DROP CONSTRAINT IF EXISTS tacks_board_id_fkey;
ALTER TABLE tacks
  ADD CONSTRAINT tacks_board_id_fkey
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL;
