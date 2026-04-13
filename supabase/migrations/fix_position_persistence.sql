-- ============================================================
-- Fix: tack and text_block positions don't persist after drag
-- ============================================================
-- The UPDATE policies on both tables only covered board_members
-- (editors). The board owner is not in board_members, so their
-- drag-end UPDATEs were silently blocked by RLS and positions
-- reverted to the previous value on next load.
--
-- Run AFTER: add_board_members.sql, fix_tack_owner_update.sql
-- ============================================================

-- ── tacks ────────────────────────────────────────────────────
-- Owner policy (idempotent — replaces the one in fix_tack_owner_update.sql)
DROP POLICY IF EXISTS "board_owner_can_update_tacks" ON tacks;
CREATE POLICY "board_owner_can_update_tacks" ON tacks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tacks.board_id
        AND boards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = tacks.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- Editor policy (idempotent)
DROP POLICY IF EXISTS "board_editors_can_update_tacks" ON tacks;
CREATE POLICY "board_editors_can_update_tacks" ON tacks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = tacks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = tacks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );

-- ── text_blocks ───────────────────────────────────────────────
-- Owner policy (was missing entirely — positions never persisted for owners)
DROP POLICY IF EXISTS "board_owner_can_update_text_blocks" ON text_blocks;
CREATE POLICY "board_owner_can_update_text_blocks" ON text_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = text_blocks.board_id
        AND boards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = text_blocks.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- Editor policy (idempotent)
DROP POLICY IF EXISTS "board_editors_can_update_text_blocks" ON text_blocks;
CREATE POLICY "board_editors_can_update_text_blocks" ON text_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = text_blocks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = text_blocks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );
