
-- Create storage bucket for uploaded materials
INSERT INTO storage.buckets (id, name, public) VALUES ('ebook-materials', 'ebook-materials', false);

-- Allow authenticated users to upload
CREATE POLICY "Users can upload materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ebook-materials');

-- Allow users to read their own uploads
CREATE POLICY "Users can read own materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ebook-materials');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ebook-materials');
