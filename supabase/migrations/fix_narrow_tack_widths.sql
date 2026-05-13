-- Fix tacks that ended up narrower than 300 canvas units because the old
-- size calculation used a height cap (400/nh) as the binding constraint for
-- portrait images, making them thinner than intended.
--
-- Reset width to 300 for any uploaded image tack narrower than 280 units.
-- Stickers (SVG/PNG from the stickers bucket) are excluded — they may
-- legitimately be narrow. Seeds are also excluded (their width is fine).
-- The rendered height is auto in CSS so fixing width restores correct proportions.
--
-- Run in Supabase dashboard → SQL Editor.

UPDATE tacks
SET width = 300
WHERE width < 280
  AND content_url LIKE '%/storage/v1/object/public/tacks/%'
  AND content_url NOT LIKE '%/storage/v1/object/public/stickers/%'
  AND content_url NOT LIKE '%/tacks/seeds/%';
