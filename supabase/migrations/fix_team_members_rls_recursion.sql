-- ============================================================
-- Fix: infinite RLS recursion on team_members
-- ============================================================
-- The "Team members can read members" policy on team_members
-- references team_members within itself. When Postgres evaluates
-- the boards policy "Team members can view team boards" it
-- queries team_members → which triggers its own RLS → which
-- queries team_members again → infinite recursion → every boards
-- SELECT errors silently, returning no rows.
--
-- Fix: simplify team_members SELECT policy to only check the
-- current user's own row, exactly as we did for board_members.
-- All broader member list reads use the admin/service-role
-- client in API routes, which bypasses RLS entirely.
-- ============================================================

DROP POLICY IF EXISTS "Team members can read members" ON team_members;
CREATE POLICY "Team members can read members" ON team_members FOR SELECT
  USING (user_id = auth.uid());
