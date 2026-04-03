-- ============================================================
-- Comments, Reactions, and Notifications
-- ============================================================

-- 1. Add origin_item_id to tacks (for reaction aggregation across re-tacked copies)
ALTER TABLE tacks ADD COLUMN IF NOT EXISTS origin_item_id uuid REFERENCES tacks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tacks_origin ON tacks(origin_item_id) WHERE origin_item_id IS NOT NULL;

-- 2. Reactions table
-- Reactions are stored against the canonical (origin) tack id so counts aggregate
-- across all boards that have re-tacked the same image.
CREATE TABLE IF NOT EXISTS reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tack_id       uuid NOT NULL REFERENCES tacks(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('❤️','🔥','✨','👀','😍')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tack_id, user_id, reaction_type)
);
CREATE INDEX IF NOT EXISTS idx_reactions_tack ON reactions(tack_id);
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Reactions RLS
DROP POLICY IF EXISTS "reactions_select" ON reactions;
CREATE POLICY "reactions_select" ON reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tacks t
      JOIN boards b ON b.id = t.board_id
      WHERE t.id = reactions.tack_id
        AND (b.is_public = true OR b.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "reactions_insert" ON reactions;
CREATE POLICY "reactions_insert" ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reactions_delete" ON reactions;
CREATE POLICY "reactions_delete" ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Comments table
-- Comments are scoped per board+tack — re-tacked copies get fresh threads.
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  tack_id     uuid NOT NULL REFERENCES tacks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES comments(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_tack ON comments(tack_id, board_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments RLS
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = comments.board_id
        AND (boards.is_public = true OR boards.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = comments.board_id
        AND (boards.is_public = true OR boards.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_update" ON comments;
CREATE POLICY "comments_update" ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = comments.board_id AND boards.owner_id = auth.uid()
    )
  );

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('comment_on_my_tack','reply_to_my_comment','reaction_on_my_tack')),
  board_id      uuid REFERENCES boards(id) ON DELETE CASCADE,
  tack_id       uuid REFERENCES tacks(id) ON DELETE CASCADE,
  comment_id    uuid REFERENCES comments(id) ON DELETE CASCADE,
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);
