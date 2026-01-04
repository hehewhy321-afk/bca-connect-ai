-- Create public event registrations table for non-authenticated visitors
CREATE TABLE public.public_event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_event_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to register for events (public form submission)
CREATE POLICY "Anyone can register for public events"
ON public.public_event_registrations
FOR INSERT
WITH CHECK (true);

-- Only admins can view registrations
CREATE POLICY "Admins can view public registrations"
ON public.public_event_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Admins can delete registrations
CREATE POLICY "Admins can delete public registrations"
ON public.public_event_registrations
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Create founding members table
CREATE TABLE public.founding_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  bio TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view active founding members
CREATE POLICY "Anyone can view active founding members"
ON public.founding_members
FOR SELECT
USING (is_active = true);

-- Admins can manage founding members
CREATE POLICY "Admins can manage founding members"
ON public.founding_members
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_founding_members_updated_at
BEFORE UPDATE ON public.founding_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();