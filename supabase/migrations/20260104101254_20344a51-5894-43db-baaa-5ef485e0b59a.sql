-- Add admin_notes column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add payment_receipt_url and payment_status to event_registrations
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_receipt_url text;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS check_in_code text;

-- Add payment_receipt_url and payment_status to public_event_registrations
ALTER TABLE public.public_event_registrations ADD COLUMN IF NOT EXISTS payment_receipt_url text;
ALTER TABLE public.public_event_registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.public_event_registrations ADD COLUMN IF NOT EXISTS check_in_code text;

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for payment receipts bucket
CREATE POLICY "Anyone can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Admins can view payment receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts' AND (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'moderator')
));

CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policy for admins to update payment status on public_event_registrations
CREATE POLICY "Admins can update public registrations"
ON public.public_event_registrations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create RLS policy for admins to update event_registrations
CREATE POLICY "Admins can update registrations"
ON public.event_registrations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));