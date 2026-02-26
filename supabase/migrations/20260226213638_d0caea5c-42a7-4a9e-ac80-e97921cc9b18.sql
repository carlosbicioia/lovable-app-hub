
-- RLS policies for purchase-docs bucket to allow authenticated users to upload, read, and delete
CREATE POLICY "Allow authenticated uploads to purchase-docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'purchase-docs');

CREATE POLICY "Allow authenticated reads from purchase-docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'purchase-docs');

CREATE POLICY "Allow authenticated updates on purchase-docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'purchase-docs')
WITH CHECK (bucket_id = 'purchase-docs');

CREATE POLICY "Allow authenticated deletes from purchase-docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'purchase-docs');
