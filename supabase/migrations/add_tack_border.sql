-- Per-tack frame / border controls.
-- NULL means "use the app default" (8px white), so existing tacks
-- continue to look the same without a backfill.
ALTER TABLE tacks
  ADD COLUMN IF NOT EXISTS border_width integer,
  ADD COLUMN IF NOT EXISTS border_color text;
