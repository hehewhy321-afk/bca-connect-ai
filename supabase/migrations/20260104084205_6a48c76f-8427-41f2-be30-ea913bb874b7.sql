-- Add visibility and team options to events table
ALTER TABLE public.events 
ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
ADD COLUMN team_type TEXT DEFAULT 'solo' CHECK (team_type IN ('solo', 'duo', 'squad', 'any')),
ADD COLUMN team_size_min INTEGER DEFAULT 1,
ADD COLUMN team_size_max INTEGER DEFAULT 1;

-- Add team info to public_event_registrations
ALTER TABLE public.public_event_registrations
ADD COLUMN team_name TEXT,
ADD COLUMN team_members JSONB DEFAULT '[]';

-- Add team info to event_registrations (internal members)
ALTER TABLE public.event_registrations
ADD COLUMN team_name TEXT,
ADD COLUMN team_members JSONB DEFAULT '[]';

-- Allow admins to view all internal registrations
CREATE POLICY "Admins can view all registrations"
ON public.event_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Enable realtime for event_registrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_event_registrations;