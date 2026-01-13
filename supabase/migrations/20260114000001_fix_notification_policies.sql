-- Fix notification deletion for admins
-- Migration: 20260114000001

-- Add policy for admins to view all notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (
  (SELECT has_role(auth.uid(), 'admin')) OR 
  (SELECT has_role(auth.uid(), 'moderator'))
);

-- Add policy for admins to delete notifications
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (
  (SELECT has_role(auth.uid(), 'admin')) OR 
  (SELECT has_role(auth.uid(), 'moderator'))
);
