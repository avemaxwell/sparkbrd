-- Lets the Sparkurio admin account moderate (delete) any comment — resource
-- feedback or board/tack comments alike — on top of the existing "author or
-- board owner" rule. RLS enforces this at the database level regardless of
-- what the API route checks, so the policy itself must allow it, not just
-- app code.
DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = comments.board_id AND boards.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.email = 'admin@sparkurio.com'
    )
  );
