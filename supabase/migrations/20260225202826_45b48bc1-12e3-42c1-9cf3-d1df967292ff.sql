
-- Create storage bucket for service media
INSERT INTO storage.buckets (id, name, public) VALUES ('service-media', 'service-media', true);

-- Create table to track service media files
CREATE TABLE public.service_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'photo',
  caption TEXT DEFAULT '',
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to service_media" ON public.service_media FOR ALL USING (true) WITH CHECK (true);

-- Storage policies for the bucket
CREATE POLICY "Allow public read service-media" ON storage.objects FOR SELECT USING (bucket_id = 'service-media');
CREATE POLICY "Allow authenticated upload service-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'service-media');
CREATE POLICY "Allow authenticated delete service-media" ON storage.objects FOR DELETE USING (bucket_id = 'service-media');
