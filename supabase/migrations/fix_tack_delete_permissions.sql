-- ============================================================
-- Fix tack delete permissions
-- ============================================================
-- Tightens DELETE on tacks to: board owner OR the user who
-- added the tack (added_by / user_id). Previously any editor
-- board-member could delete any tack, and there was no explicit
-- guard preventing a public-board viewer from hitting the API
-- directly.
-- ============================================================

-- Drop any existing tack DELETE policies so we replace cleanly.
DROP POLICY IF EXISTS "Users can delete own tacks" ON tacks;
DROP POLICY IF EXISTS "board_editors_can_delete_tacks" ON tacks;
DROP POLICY IF EXISTS "Tack owners and board owners can delete tacks" ON tacks;

-- New policy: board owner OR the user who added the tack.
CREATE POLICY "Tack owners and board owners can delete tacks"
  ON tacks FOR DELETE
  USING (
    -- The user who originally added the tack
    auth.uid() = tacks.user_id
    OR
    -- The board owner
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tacks.board_id
        AND boards.owner_id = auth.uid()
    )
  );
