-- Storage policy for team-avatars bucket
-- Run this after creating the 'team-avatars' bucket in the Supabase dashboard (set to public)

-- Allow team owners and admins to upload/update/delete their team's logo
CREATE POLICY "Team owners can upload team avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'team-avatars'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM teams WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update team avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'team-avatars'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM teams WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete team avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'team-avatars'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM teams WHERE owner_id = auth.uid()
    )
  );

-- Allow anyone to read team avatars (public bucket)
CREATE POLICY "Team avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-avatars');
