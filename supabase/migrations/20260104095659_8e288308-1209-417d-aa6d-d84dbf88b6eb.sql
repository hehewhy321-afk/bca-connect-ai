-- Add gallery_images and registration_fee columns to events table
ALTER TABLE public.events
ADD COLUMN gallery_images text[] DEFAULT '{}',
ADD COLUMN registration_fee decimal(10,2) DEFAULT NULL;

-- Create event_reminders table to track reminder subscriptions
CREATE TABLE public.event_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid,
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe to reminders
CREATE POLICY "Anyone can subscribe to event reminders"
ON public.event_reminders
FOR INSERT
WITH CHECK (true);

-- Users can view their own reminders
CREATE POLICY "Users can view their own reminders"
ON public.event_reminders
FOR SELECT
USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR user_id = auth.uid());

-- Admins can view all reminders
CREATE POLICY "Admins can view all reminders"
ON public.event_reminders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can update reminders (for marking as sent)
CREATE POLICY "System can update reminders"
ON public.event_reminders
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_event_reminders_event_id ON public.event_reminders(event_id);
CREATE INDEX idx_event_reminders_email ON public.event_reminders(email);