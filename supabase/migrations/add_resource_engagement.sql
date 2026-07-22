-- Wires the real `resources` table (add_resource_builder.sql) into the
-- existing engagement systems (save-to-collection, comments, reactions)
-- instead of building parallel infrastructure for it.

-- Saving a resource reuses the existing tacks/boards rendering entirely
-- (MosaicBoard/BoardCanvas already know how to display a tack) instead of
-- inventing a parallel "resource tile" renderer. resource_id links a saved
-- tack back to its source resource for attribution + a real download count.
ALTER TABLE tacks ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES resources(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tacks_resource_id ON tacks(resource_id) WHERE resource_id IS NOT NULL;

-- Optional creator-set display field, shown on ResourceCard alongside real resources.
ALTER TABLE resources ADD COLUMN IF NOT EXISTS duration text;

-- Comments/reactions currently require board_id+tack_id. Relax to nullable and
-- add resource_id as an alternative target so feedback works on resources too.
ALTER TABLE comments ALTER COLUMN board_id DROP NOT NULL;
ALTER TABLE comments ALTER COLUMN tack_id DROP NOT NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES resources(id) ON DELETE CASCADE;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_one_target;
ALTER TABLE comments ADD CONSTRAINT comments_one_target CHECK (
  (tack_id IS NOT NULL AND board_id IS NOT NULL AND resource_id IS NULL) OR
  (tack_id IS NULL AND board_id IS NULL AND resource_id IS NOT NULL)
);

ALTER TABLE reactions ALTER COLUMN tack_id DROP NOT NULL;
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES resources(id) ON DELETE CASCADE;
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_one_target;
ALTER TABLE reactions ADD CONSTRAINT reactions_one_target CHECK (
  (tack_id IS NOT NULL AND resource_id IS NULL) OR (tack_id IS NULL AND resource_id IS NOT NULL)
);

-- New RLS policies for the resource_id path (published = readable by anyone,
-- same rule already used for resources themselves in add_resource_builder.sql).
DROP POLICY IF EXISTS "comments_resource_select" ON comments;
CREATE POLICY "comments_resource_select" ON comments FOR SELECT
  USING (resource_id IS NOT NULL AND EXISTS (SELECT 1 FROM resources WHERE resources.id = comments.resource_id AND (resources.status = 'published' OR resources.owner_id = auth.uid())));

DROP POLICY IF EXISTS "comments_resource_insert" ON comments;
CREATE POLICY "comments_resource_insert" ON comments FOR INSERT
  WITH CHECK (resource_id IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_resource_select" ON reactions;
CREATE POLICY "reactions_resource_select" ON reactions FOR SELECT
  USING (resource_id IS NOT NULL AND EXISTS (SELECT 1 FROM resources WHERE resources.id = reactions.resource_id AND (resources.status = 'published' OR resources.owner_id = auth.uid())));

DROP POLICY IF EXISTS "reactions_resource_insert" ON reactions;
CREATE POLICY "reactions_resource_insert" ON reactions FOR INSERT
  WITH CHECK (resource_id IS NOT NULL AND auth.uid() = user_id AND auth.uid() IS NOT NULL);
