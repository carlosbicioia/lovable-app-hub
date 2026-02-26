
-- Create storage bucket for delivery notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-notes', 'delivery-notes', true);

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to delivery-notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-notes');

-- Allow public reads
CREATE POLICY "Allow public reads on delivery-notes"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-notes');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Allow authenticated updates on delivery-notes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'delivery-notes');

CREATE POLICY "Allow authenticated deletes on delivery-notes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'delivery-notes');
