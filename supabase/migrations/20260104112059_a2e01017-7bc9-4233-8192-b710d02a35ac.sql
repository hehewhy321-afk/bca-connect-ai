-- Drop the insecure upload policy
DROP POLICY IF EXISTS "Anyone can upload payment receipts" ON storage.objects;

-- Create secure upload policy requiring authentication
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-receipts' 
  AND auth.uid() IS NOT NULL
);

-- Add policy to allow users to view their own uploaded receipts
CREATE POLICY "Users can view payment receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

-- Allow admins/moderators to manage all receipts
CREATE POLICY "Admins can manage payment receipts"
ON storage.objects FOR ALL
USING (
  bucket_id = 'payment-receipts' 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);