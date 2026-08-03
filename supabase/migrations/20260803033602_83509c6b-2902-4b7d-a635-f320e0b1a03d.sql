
-- ebook-materials
DROP POLICY IF EXISTS "Authenticated users can upload ebook materials" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for ebook materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own ebook materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own ebook materials" ON storage.objects;

CREATE POLICY "Users read own ebook materials"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own ebook materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own ebook materials"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own ebook materials"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ebook-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ebook-covers
DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Public view covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete covers" ON storage.objects;

CREATE POLICY "Users read own covers"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ebook-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ebook-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ebook-covers' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'ebook-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ebook-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
