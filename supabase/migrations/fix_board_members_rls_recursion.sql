-- ============================================================
-- Fix: circular RLS recursion between boards ↔ board_members
-- ============================================================
-- The original board_members_select policy queried the boards
-- table, and board_members_can_view_boards (on boards) queried
-- board_members — creating an infinite recursion that caused
-- Postgres to error on any boards SELECT, making all boards
-- silently disappear.
--
-- Fix: simplify board_members_select so it only looks at the
-- current user's own rows. Board owners access the full
-- membership list through the service-role API client (which
-- bypasses RLS), so they don't need a policy for it.
-- ============================================================

DROP POLICY IF EXISTS "board_members_select" ON board_members;
CREATE POLICY "board_members_select" ON board_members FOR SELECT
  USING (user_id = auth.uid());
