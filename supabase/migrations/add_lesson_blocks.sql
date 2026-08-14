-- Structured data for the block-canvas Lesson Plan Builder (replaces the
-- step-by-step wizard at /resources/new/build). Shape:
-- { periodMinutes: number, items: [{ id, type, title, content, minutes, linkedResourceId }] }
-- Nullable and purely additive — existing resources are unaffected, and the
-- resource page falls back to the classic section-based rendering whenever
-- this is null or empty. See components/resources/LessonBlockCanvas.tsx.
ALTER TABLE resources ADD COLUMN IF NOT EXISTS blocks jsonb;
