-- Add searchable tags column to tacks (populated async by AI after each tack is added)
ALTER TABLE tacks ADD COLUMN IF NOT EXISTS tags text;

-- Full-text search index across tags + title + source
CREATE INDEX IF NOT EXISTS idx_tacks_fts ON tacks
  USING gin(to_tsvector('english',
    coalesce(tags, '') || ' ' ||
    coalesce(title, '') || ' ' ||
    coalesce(source, '')
  ));
