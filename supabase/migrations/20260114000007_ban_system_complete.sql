-- =====================================================
-- BAN SYSTEM - Complete Implementation
-- =====================================================
-- This migration adds a complete ban system with:
-- - Time-limited and permanent bans
-- - Auto-unban for expired bans
-- - Client-side ban checking (safe, no login blocking)
-- =====================================================

-- Clean up any existing ban-related objects
DROP TRIGGER IF EXISTS check_ban_on_signin ON auth.users;
DROP FUNCTION IF EXISTS check_user_ban_status(UUID);
DROP FUNCTION IF EXISTS check_user_ban_status();
DROP FUNCTION IF EXISTS auto_unban_expired_users();

-- Add ban columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Create indexes for efficient ban queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_ban_expires_at ON public.profiles(ban_expires_at);

-- =====================================================
-- Function: Auto-unban expired users
-- =====================================================
CREATE OR REPLACE FUNCTION auto_unban_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET is_banned = false,
      ban_expires_at = NULL,
      ban_reason = NULL
  WHERE is_banned = true
    AND ban_expires_at IS NOT NULL
    AND ban_expires_at <= NOW();
END;
$$;

-- =====================================================
-- Function: Check user ban status
-- =====================================================
-- This function is called from client-side to check if a user is banned
-- Returns ban status information for display to the user
CREATE OR REPLACE FUNCTION check_user_ban_status(user_id_param UUID)
RETURNS TABLE(
  is_banned BOOLEAN, 
  ban_expires_at TIMESTAMP WITH TIME ZONE, 
  ban_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, auto-unban any expired users
  PERFORM auto_unban_expired_users();
  
  -- Return the ban status for the specified user
  RETURN QUERY
  SELECT 
    p.is_banned, 
    p.ban_expires_at, 
    p.ban_reason
  FROM public.profiles p
  WHERE p.user_id = user_id_param;
END;
$$;

-- =====================================================
-- Permissions
-- =====================================================
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_unban_expired_users() TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_ban_status(UUID) TO authenticated;

-- =====================================================
-- RLS Policies
-- =====================================================
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can update ban status" ON public.profiles;

-- Only admins can update ban-related fields
CREATE POLICY "Admins can update ban status" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- Documentation
-- =====================================================
COMMENT ON COLUMN public.profiles.is_banned IS 'Whether the user is currently banned from accessing the platform';
COMMENT ON COLUMN public.profiles.ban_expires_at IS 'When the ban expires (NULL for permanent ban)';
COMMENT ON COLUMN public.profiles.ban_reason IS 'Admin-provided reason for the ban';
COMMENT ON FUNCTION auto_unban_expired_users() IS 'Automatically unbans users whose ban period has expired';
COMMENT ON FUNCTION check_user_ban_status(UUID) IS 'Returns ban status for a user - called from client-side after authentication';

-- =====================================================
-- Verification
-- =====================================================
-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Ban system installed successfully!';
  RAISE NOTICE 'Functions created: auto_unban_expired_users, check_user_ban_status';
  RAISE NOTICE 'Columns added: is_banned, ban_expires_at, ban_reason';
  RAISE NOTICE 'Ban checks are performed client-side for safety';
END $$;
