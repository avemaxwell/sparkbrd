-- Returns the storage paths (relative to the 'tacks' bucket) for content_url
-- values that belong EXCLUSIVELY to the given board — i.e. not referenced by
-- any tack on a different board.  Safe to remove from storage after the board
-- is deleted.  Any URL shared with a retack on another board is intentionally
-- excluded so the retacker's copy keeps working.
CREATE OR REPLACE FUNCTION exclusive_board_storage_paths(p_board_id uuid)
RETURNS TABLE(storage_path text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    -- Extract the path component after /public/tacks/ and strip query strings
    -- e.g. https://…/storage/v1/object/public/tacks/uid/file.jpg → uid/file.jpg
    regexp_replace(
      substring(t.content_url FROM '/storage/v1/object/public/tacks/(.+)'),
      '\?.*$', ''
    ) AS storage_path
  FROM tacks t
  WHERE t.board_id = p_board_id
    AND t.content_url LIKE '%/storage/v1/object/public/tacks/%'
    -- Only include URLs not referenced by any tack on a different board
    AND NOT EXISTS (
      SELECT 1
      FROM tacks other
      WHERE other.content_url = t.content_url
        AND other.board_id != p_board_id
    )
    AND regexp_replace(
      substring(t.content_url FROM '/storage/v1/object/public/tacks/(.+)'),
      '\?.*$', ''
    ) IS NOT NULL
  GROUP BY t.content_url; -- deduplicate within the board
$$;
