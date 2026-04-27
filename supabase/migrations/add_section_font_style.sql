-- Allow 'section' as a valid font_style for Studio Board section labels.
-- The CHECK constraint only covered the original font styles; just drop it —
-- the application already controls which values are used.
ALTER TABLE text_blocks DROP CONSTRAINT IF EXISTS text_blocks_font_style_check;
