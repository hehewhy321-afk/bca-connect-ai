-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('certificates', 'certificates', true),
  ('avatars', 'avatars', true),
  ('resources', 'resources', true),
  ('events', 'events', true),
  ('website-assets', 'website-assets', true),
  ('payment-receipts', 'payment-receipts', false) -- Private bucket for sensitive data
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- PROFILES for policy checks (helper)
-- We rely on the existing 'profiles' table checks in the policies below.

-- ===========================
-- 1. CERTIFICATES BUCKET
-- ===========================
CREATE POLICY "Certificates Public Read" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'certificates' );

CREATE POLICY "Certificates Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'certificates' );

CREATE POLICY "Certificates Admin Delete" ON storage.objects FOR DELETE TO authenticated USING ( 
  bucket_id = 'certificates' AND 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);

-- ===========================
-- 2. AVATARS BUCKET
-- ===========================
CREATE POLICY "Avatars Public Read" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'avatars' );

CREATE POLICY "Avatars Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Avatars Auth Update" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'avatars' );

CREATE POLICY "Avatars Auth Delete" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'avatars' AND owner = auth.uid() );

-- ===========================
-- 3. RESOURCES BUCKET
-- ===========================
CREATE POLICY "Resources Public Read" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'resources' );

CREATE POLICY "Resources Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'resources' );

CREATE POLICY "Resources Auth Delete (Own)" ON storage.objects FOR DELETE TO authenticated USING ( 
  bucket_id = 'resources' AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role)) 
);

-- ===========================
-- 4. EVENTS BUCKET
-- ===========================
CREATE POLICY "Events Public Read" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'events' );

CREATE POLICY "Events Admin Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( 
  bucket_id = 'events' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);

CREATE POLICY "Events Admin Update" ON storage.objects FOR UPDATE TO authenticated USING ( 
  bucket_id = 'events' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);

CREATE POLICY "Events Admin Delete" ON storage.objects FOR DELETE TO authenticated USING ( 
  bucket_id = 'events' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);

-- ===========================
-- 5. WEBSITE-ASSETS BUCKET
-- ===========================
CREATE POLICY "Website Assets Public Read" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'website-assets' );

CREATE POLICY "Website Assets Admin Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( 
  bucket_id = 'website-assets' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);

CREATE POLICY "Website Assets Admin Update" ON storage.objects FOR UPDATE TO authenticated USING ( 
  bucket_id = 'website-assets' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);

CREATE POLICY "Website Assets Admin Delete" ON storage.objects FOR DELETE TO authenticated USING ( 
  bucket_id = 'website-assets' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);

-- ===========================
-- 6. PAYMENT-RECEIPTS BUCKET (Private)
-- ===========================
-- Users can see their own receipts (owner = auth.uid()) OR Admins can see all
CREATE POLICY "Receipts Read (Own or Admin)" ON storage.objects FOR SELECT TO authenticated USING ( 
  bucket_id = 'payment-receipts' AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role)) 
);

-- Users can upload their own receipts
CREATE POLICY "Receipts Upload (Own)" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'payment-receipts' );

-- Admins can delete
CREATE POLICY "Receipts Admin Delete" ON storage.objects FOR DELETE TO authenticated USING ( 
  bucket_id = 'payment-receipts' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) 
);
