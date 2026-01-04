-- Create a storage bucket for website assets like logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-assets', 'website-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view website assets (public bucket)
CREATE POLICY "Website assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-assets');

-- Allow admins to upload website assets
CREATE POLICY "Admins can upload website assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'website-assets' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update website assets
CREATE POLICY "Admins can update website assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'website-assets' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete website assets
CREATE POLICY "Admins can delete website assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'website-assets' 
  AND public.has_role(auth.uid(), 'admin')
);