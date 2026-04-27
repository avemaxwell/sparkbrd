-- Allow 'section' as a valid font_style value for section labels (Studio Boards feature).
-- The original CHECK constraint only covered heading/body/quote/label/caveat/bebas/typewriter/mono.

ALTER TABLE text_blocks DROP CONSTRAINT IF EXISTS text_blocks_font_style_check;

ALTER TABLE text_blocks
  ADD CONSTRAINT text_blocks_font_style_check
  CHECK (font_style IN (
    'heading', 'body', 'quote', 'label',
    'caveat', 'bebas', 'typewriter', 'mono',
    'section'
  ));
