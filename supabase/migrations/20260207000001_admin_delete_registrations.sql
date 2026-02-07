-- Add admin delete policy for event_registrations
-- This allows admins and moderators to delete member event registrations
-- Useful for handling accidental registrations or mistakes

CREATE POLICY "Admins can delete registrations" 
ON public.event_registrations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
