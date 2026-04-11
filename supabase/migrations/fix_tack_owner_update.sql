-- ============================================================
-- Fix: board owner can't update tack positions (drag doesn't persist)
-- ============================================================
-- The tack UPDATE/INSERT policies in add_board_members.sql only
-- cover board_members rows. The board owner is not in board_members,
-- so their drag-end UPDATE is silently blocked and positions revert
-- on refresh. Add owner-inclusive policies for INSERT and UPDATE.
-- ============================================================

-- INSERT: board owner can tack images
DROP POLICY IF EXISTS "board_owner_can_insert_tacks" ON tacks;
CREATE POLICY "board_owner_can_insert_tacks" ON tacks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tacks.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- UPDATE: board owner can move, resize, edit tacks (position persistence)
DROP POLICY IF EXISTS "board_owner_can_update_tacks" ON tacks;
CREATE POLICY "board_owner_can_update_tacks" ON tacks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tacks.board_id
        AND boards.owner_id = auth.uid()
    )
  );
