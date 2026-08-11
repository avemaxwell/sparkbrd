-- Free-text lesson plan content for resources created via "Upload an existing
-- lesson plan" instead of the structured builder. See
-- components/resources/LessonPlanUpload.tsx and
-- app/api/resources/extract-text/route.ts. Deliberately not split into
-- materials/learning_targets/directions — those stay reserved for
-- builder-authored resources so an uploaded document's own wording isn't
-- force-fit into a structure it was never written for.
ALTER TABLE resources ADD COLUMN IF NOT EXISTS body text;
