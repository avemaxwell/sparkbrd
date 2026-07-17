-- Sparkurio Community: a lean, site-wide forum.
-- Mirrors the existing board_discussion / team_discussion pattern (flat posts,
-- one level of replies, denormalized actor name/avatar, RLS, realtime) but
-- scoped to fixed public categories instead of a board or team.

CREATE TABLE IF NOT EXISTS community_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  icon        text NOT NULL DEFAULT 'chat',
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_threads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  uuid NOT NULL REFERENCES community_categories(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name   text,
  actor_avatar text,
  title        text NOT NULL CHECK (char_length(title) <= 200),
  body         text NOT NULL CHECK (char_length(body) <= 5000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_threads_category_id_idx ON community_threads(category_id);
CREATE INDEX IF NOT EXISTS community_threads_created_at_idx  ON community_threads(created_at);

CREATE TABLE IF NOT EXISTS community_replies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    uuid NOT NULL REFERENCES community_threads(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name   text,
  actor_avatar text,
  body         text NOT NULL CHECK (char_length(body) <= 2000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_replies_thread_id_idx  ON community_replies(thread_id);
CREATE INDEX IF NOT EXISTS community_replies_created_at_idx ON community_replies(created_at);

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Community is public/discoverable: anyone (including signed-out visitors)
-- can read. Posting requires an account.

ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are readable by anyone"
  ON community_categories FOR SELECT
  USING (true);

ALTER TABLE community_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threads are readable by anyone"
  ON community_threads FOR SELECT
  USING (true);
CREATE POLICY "Signed-in users can start threads"
  ON community_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own threads"
  ON community_threads FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies are readable by anyone"
  ON community_replies FOR SELECT
  USING (true);
CREATE POLICY "Signed-in users can reply"
  ON community_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own replies"
  ON community_replies FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE community_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE community_replies;

-- ── Seed a starter taxonomy ──────────────────────────────────────────────
INSERT INTO community_categories (slug, name, description, icon, sort_order) VALUES
  ('ask',         'Ask the Community',        'Questions for other educators — big or small.',            'chat',   0),
  ('classroom',   'Classroom Management',     'Routines, behavior strategies, and day-to-day logistics.', 'shield', 1),
  ('curriculum',  'Curriculum & Lesson Ideas','Share and swap approaches to teaching specific topics.',   'book',   2),
  ('tech',        'Tech Tools',               'Apps, AI, and tech that actually work in a classroom.',    'laptop', 3),
  ('wins',        'Wins & Reflections',       'Celebrate what worked, and be honest about what didn''t.', 'star',   4)
ON CONFLICT (slug) DO NOTHING;
