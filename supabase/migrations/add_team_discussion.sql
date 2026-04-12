-- Team discussion posts: user-generated messages & replies within the activity feed
-- Also run add_team_activity.sql first if you haven't already

CREATE TABLE IF NOT EXISTS team_discussion (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  -- Optional: tie this post to a specific activity event (for inline replies)
  activity_id uuid REFERENCES team_activity(id) ON DELETE CASCADE,
  -- Optional: reply to another discussion post (one level deep)
  parent_id   uuid REFERENCES team_discussion(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name  text,
  actor_avatar text,
  body        text NOT NULL CHECK (char_length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_discussion_team_id_idx     ON team_discussion(team_id);
CREATE INDEX IF NOT EXISTS team_discussion_activity_id_idx ON team_discussion(activity_id);
CREATE INDEX IF NOT EXISTS team_discussion_created_at_idx  ON team_discussion(created_at);

ALTER TABLE team_discussion ENABLE ROW LEVEL SECURITY;

-- Team owners and members can read discussion posts
CREATE POLICY "Team members can read team discussion"
  ON team_discussion FOR SELECT
  USING (
    team_id IN (
      SELECT id    FROM teams        WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id  = auth.uid()
    )
  );

-- Team owners and members can insert discussion posts
CREATE POLICY "Team members can insert team discussion"
  ON team_discussion FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id    FROM teams        WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM team_members WHERE user_id  = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can delete their own posts
CREATE POLICY "Users can delete own discussion posts"
  ON team_discussion FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE team_discussion;
