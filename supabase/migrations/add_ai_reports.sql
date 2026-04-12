-- AI report flags: community-sourced flagging of suspected AI-generated tacks
-- Multiple reports from different users trigger auto-review

CREATE TABLE IF NOT EXISTS ai_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tack_id     uuid NOT NULL REFERENCES tacks(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  reason      text,           -- optional note from reporter
  reviewed    boolean NOT NULL DEFAULT false,
  confirmed   boolean,        -- null = not yet reviewed, true = confirmed AI, false = cleared
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tack_id, reporter_id) -- one report per user per tack
);

CREATE INDEX IF NOT EXISTS ai_reports_tack_id_idx ON ai_reports(tack_id);
CREATE INDEX IF NOT EXISTS ai_reports_reviewed_idx ON ai_reports(reviewed) WHERE reviewed = false;

ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports (rate limiting done in API)
CREATE POLICY "Users can report tacks"
  ON ai_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Users can see if they already reported a tack
CREATE POLICY "Users can read own reports"
  ON ai_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Board owners can see reports on their boards
CREATE POLICY "Board owners can see reports on their boards"
  ON ai_reports FOR SELECT
  TO authenticated
  USING (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
  );

-- Add hidden_as_ai column to tacks for soft-hiding without deletion
ALTER TABLE tacks ADD COLUMN IF NOT EXISTS hidden_as_ai boolean NOT NULL DEFAULT false;
ALTER TABLE tacks ADD COLUMN IF NOT EXISTS ai_report_count int NOT NULL DEFAULT 0;
