-- Add is_public column to boards
ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Index for fast public board lookups
CREATE INDEX IF NOT EXISTS idx_boards_is_public ON boards(is_public) WHERE is_public = true;

-- Allow anyone (including anon) to read tacks from public boards
CREATE POLICY IF NOT EXISTS "Public tacks are readable by anyone"
  ON tacks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tacks.board_id
        AND boards.is_public = true
    )
  );

-- Allow anyone to read public boards themselves
CREATE POLICY IF NOT EXISTS "Public boards are readable by anyone"
  ON boards FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);
