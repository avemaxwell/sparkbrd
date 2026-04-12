-- ============================================================
-- Team activity feed
-- ============================================================
-- Stores denormalized activity events for each team so the
-- feed query is a simple SELECT without joins.
-- ============================================================

CREATE TABLE IF NOT EXISTS team_activity (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type            text NOT NULL,
  -- denormalized context for fast reads
  actor_name      text,
  actor_avatar    text,
  board_id        uuid REFERENCES boards(id) ON DELETE SET NULL,
  board_name      text,
  tack_id         uuid REFERENCES tacks(id) ON DELETE SET NULL,
  tack_thumbnail  text,
  comment_body    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_activity_team_id ON team_activity(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_created_at ON team_activity(created_at DESC);

ALTER TABLE team_activity ENABLE ROW LEVEL SECURITY;

-- Team members can read their team's activity
DROP POLICY IF EXISTS "Team members can read activity" ON team_activity;
CREATE POLICY "Team members can read activity" ON team_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams WHERE teams.id = team_activity.team_id AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members WHERE team_members.team_id = team_activity.team_id AND team_members.user_id = auth.uid()
    )
  );
