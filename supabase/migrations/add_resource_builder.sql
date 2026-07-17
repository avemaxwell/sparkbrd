-- Native lesson-plan builder: structured resources created directly on
-- Sparkurio (not just uploaded files). Separate from the legacy `tacks`
-- table (single image + note, built for the old pin-board canvas) since a
-- lesson plan has real structure: standards, materials, learning targets,
-- step-by-step directions, photos, and attachments.

CREATE TABLE IF NOT EXISTS resources (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text NOT NULL CHECK (char_length(title) <= 200),
  subject          text NOT NULL,
  grade_band       text NOT NULL CHECK (grade_band IN ('K-5', '6-8', '9-12', 'College')),
  resource_type    text NOT NULL CHECK (resource_type IN ('Lesson', 'Worksheet', 'Activity', 'Project', 'Template', 'Assessment')),
  standards        text[] NOT NULL DEFAULT '{}',
  materials        text[] NOT NULL DEFAULT '{}',
  learning_targets text[] NOT NULL DEFAULT '{}',
  directions       text[] NOT NULL DEFAULT '{}',
  photos           text[] NOT NULL DEFAULT '{}',
  attachments      jsonb NOT NULL DEFAULT '[]',
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resources_owner_id_idx ON resources(owner_id);
CREATE INDEX IF NOT EXISTS resources_subject_idx ON resources(subject) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS resources_status_idx ON resources(status);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published resources are readable by anyone"
  ON resources FOR SELECT
  USING (status = 'published' OR auth.uid() = owner_id);

CREATE POLICY "Owners can create their own resources"
  ON resources FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own resources"
  ON resources FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own resources"
  ON resources FOR DELETE
  USING (auth.uid() = owner_id);

-- ── Storage buckets for photos and attachments ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-photos', 'resource-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-attachments', 'resource-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view resource photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resource-photos');

CREATE POLICY "Authenticated users can upload resource photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resource-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Owners can delete their own resource photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resource-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view resource attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resource-attachments');

CREATE POLICY "Authenticated users can upload resource attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resource-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Owners can delete their own resource attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resource-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
