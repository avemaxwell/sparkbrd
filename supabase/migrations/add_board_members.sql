-- ============================================================
-- Board Members & Invitations
-- ============================================================
-- Implements Option A board-level membership:
--   • board_members  — accepted collaborators with a role
--   • board_invitations — pending invites keyed by email + token
--
-- Strategy for existing RLS policies:
--   Rather than drop-and-replace policies whose names we don't
--   control, we ADD new named permissive policies for members.
--   Postgres ORs all permissive policies, so existing owner/
--   public access is preserved automatically.
-- ============================================================

-- ─── 1. board_members ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS board_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_members_board ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user  ON board_members(user_id);

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own membership rows.
-- Board owners access the full members list via the service-role API client,
-- which bypasses RLS — so no board → board_members → boards circular reference.
DROP POLICY IF EXISTS "board_members_select" ON board_members;
CREATE POLICY "board_members_select" ON board_members FOR SELECT
  USING (user_id = auth.uid());

-- Only the board owner can add members (API enforces this too).
DROP POLICY IF EXISTS "board_members_insert" ON board_members;
CREATE POLICY "board_members_insert" ON board_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- Board owner can remove anyone; members can remove themselves.
DROP POLICY IF EXISTS "board_members_delete" ON board_members;
CREATE POLICY "board_members_delete" ON board_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- ─── 2. board_invitations ────────────────────────────────────

CREATE TABLE IF NOT EXISTS board_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  email       text NOT NULL,
  token       uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  role        text NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, email)  -- one pending invite per email per board
);

CREATE INDEX IF NOT EXISTS idx_board_invitations_token ON board_invitations(token);
CREATE INDEX IF NOT EXISTS idx_board_invitations_board ON board_invitations(board_id);

ALTER TABLE board_invitations ENABLE ROW LEVEL SECURITY;

-- Board owner can see all invitations for their boards.
DROP POLICY IF EXISTS "board_invitations_select" ON board_invitations;
CREATE POLICY "board_invitations_select" ON board_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_invitations.board_id
        AND boards.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "board_invitations_insert" ON board_invitations;
CREATE POLICY "board_invitations_insert" ON board_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_invitations.board_id
        AND boards.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "board_invitations_delete" ON board_invitations;
CREATE POLICY "board_invitations_delete" ON board_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_invitations.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- Accepting is done server-side via service role — no UPDATE policy needed.

-- ─── 3. boards — add member SELECT access ────────────────────
-- Permissive policies are OR'd, so this extends existing access
-- without touching whatever policies already exist.

DROP POLICY IF EXISTS "board_members_can_view_boards" ON boards;
CREATE POLICY "board_members_can_view_boards" ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = boards.id
        AND bm.user_id = auth.uid()
    )
  );

-- ─── 4. tacks — member access ────────────────────────────────

-- SELECT: all members (editor + viewer) can see tacks
DROP POLICY IF EXISTS "board_members_can_view_tacks" ON tacks;
CREATE POLICY "board_members_can_view_tacks" ON tacks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = tacks.board_id
        AND bm.user_id = auth.uid()
    )
  );

-- INSERT: editor members can add tacks
DROP POLICY IF EXISTS "board_editors_can_insert_tacks" ON tacks;
CREATE POLICY "board_editors_can_insert_tacks" ON tacks FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = tacks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );

-- UPDATE: editor members can move/resize/edit tacks
DROP POLICY IF EXISTS "board_editors_can_update_tacks" ON tacks;
CREATE POLICY "board_editors_can_update_tacks" ON tacks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = tacks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );

-- DELETE: editor members can delete tacks
DROP POLICY IF EXISTS "board_editors_can_delete_tacks" ON tacks;
CREATE POLICY "board_editors_can_delete_tacks" ON tacks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = tacks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );

-- ─── 5. text_blocks — member access ──────────────────────────

DROP POLICY IF EXISTS "board_members_can_view_text_blocks" ON text_blocks;
CREATE POLICY "board_members_can_view_text_blocks" ON text_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = text_blocks.board_id
        AND bm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "board_editors_can_insert_text_blocks" ON text_blocks;
CREATE POLICY "board_editors_can_insert_text_blocks" ON text_blocks FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = text_blocks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "board_editors_can_update_text_blocks" ON text_blocks;
CREATE POLICY "board_editors_can_update_text_blocks" ON text_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = text_blocks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "board_editors_can_delete_text_blocks" ON text_blocks;
CREATE POLICY "board_editors_can_delete_text_blocks" ON text_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = text_blocks.board_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'editor'
    )
  );

-- ─── 6. comments & reactions — include board members ─────────
-- The existing policies gate access on board ownership. Recreate
-- them to also allow board members. Names match the original
-- migration so DROP IF EXISTS safely replaces them.

DROP POLICY IF EXISTS "reactions_select" ON reactions;
CREATE POLICY "reactions_select" ON reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tacks t
      JOIN boards b ON b.id = t.board_id
      WHERE t.id = reactions.tack_id
        AND (
          b.is_public = true
          OR b.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM board_members bm
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = comments.board_id
        AND (
          boards.is_public = true
          OR boards.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM board_members bm
            WHERE bm.board_id = boards.id AND bm.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = comments.board_id
        AND (
          boards.is_public = true
          OR boards.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM board_members bm
            WHERE bm.board_id = boards.id AND bm.user_id = auth.uid()
          )
        )
    )
  );
