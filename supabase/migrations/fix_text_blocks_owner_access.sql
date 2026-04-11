-- ============================================================
-- Fix: board owner can't insert/update/delete text blocks
-- ============================================================
-- The text_blocks RLS policies added in add_board_members.sql
-- only cover board_members rows. The board owner is not in
-- board_members, so their INSERT/UPDATE/DELETE are blocked.
-- Add owner-inclusive policies for all four operations.
-- ============================================================

-- SELECT: owner can read their own board's text blocks
DROP POLICY IF EXISTS "board_owner_can_view_text_blocks" ON text_blocks;
CREATE POLICY "board_owner_can_view_text_blocks" ON text_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = text_blocks.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- INSERT: owner can add text blocks
DROP POLICY IF EXISTS "board_owner_can_insert_text_blocks" ON text_blocks;
CREATE POLICY "board_owner_can_insert_text_blocks" ON text_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = text_blocks.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- UPDATE: owner can edit text blocks
DROP POLICY IF EXISTS "board_owner_can_update_text_blocks" ON text_blocks;
CREATE POLICY "board_owner_can_update_text_blocks" ON text_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = text_blocks.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- DELETE: owner can delete text blocks
DROP POLICY IF EXISTS "board_owner_can_delete_text_blocks" ON text_blocks;
CREATE POLICY "board_owner_can_delete_text_blocks" ON text_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = text_blocks.board_id
        AND boards.owner_id = auth.uid()
    )
  );
