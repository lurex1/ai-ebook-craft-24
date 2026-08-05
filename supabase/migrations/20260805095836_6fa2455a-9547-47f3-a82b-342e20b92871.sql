DROP POLICY IF EXISTS "Users can read own materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own materials" ON storage.objects;

CREATE POLICY "Users can read own materials"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own materials"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own materials"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);