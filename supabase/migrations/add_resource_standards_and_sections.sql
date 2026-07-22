-- Lesson Plan Builder v2: a "state" field for context alongside standards
-- alignment, and an optional/reorderable section list. Both nullable —
-- existing resources are unaffected and keep rendering exactly as before
-- (NULL section_order means "all sections, default order").

ALTER TABLE resources ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS section_order text[];
