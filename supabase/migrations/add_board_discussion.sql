-- Board-level discussion: messages scoped to a single board
-- Works for both team boards and personal shared boards

CREATE TABLE IF NOT EXISTS board_discussion (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id     uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  -- optional: reply to a team_activity event (board-scoped activity thread)
  activity_id  uuid REFERENCES team_activity(id) ON DELETE CASCADE,
  -- optional: reply to another board_discussion post
  parent_id    uuid REFERENCES board_discussion(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name   text,
  actor_avatar text,
  body         text NOT NULL CHECK (char_length(body) <= 2000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS board_discussion_board_id_idx    ON board_discussion(board_id);
CREATE INDEX IF NOT EXISTS board_discussion_activity_id_idx ON board_discussion(activity_id);
CREATE INDEX IF NOT EXISTS board_discussion_created_at_idx  ON board_discussion(created_at);

ALTER TABLE board_discussion ENABLE ROW LEVEL SECURITY;

-- Board owners can do everything
CREATE POLICY "Board owner full access to board discussion"
  ON board_discussion FOR ALL
  USING (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
  );

-- Board members (collaborators) can read and insert
CREATE POLICY "Board members can read board discussion"
  ON board_discussion FOR SELECT
  USING (
    board_id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Board members can insert board discussion"
  ON board_discussion FOR INSERT
  WITH CHECK (
    board_id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE board_discussion;
