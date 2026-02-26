-- Create company-assets bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read company-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Allow authenticated users to upload
CREATE POLICY "Auth upload company-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets');

-- Allow authenticated users to update
CREATE POLICY "Auth update company-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-assets');

-- Allow authenticated users to delete
CREATE POLICY "Auth delete company-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-assets');