
-- Create the ebook-materials storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-materials', 'ebook-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload ebook materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ebook-materials');

-- Allow public read access
CREATE POLICY "Public read access for ebook materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'ebook-materials');

-- Allow users to update their own files
CREATE POLICY "Users can update own ebook materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ebook-materials');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own ebook materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ebook-materials');
