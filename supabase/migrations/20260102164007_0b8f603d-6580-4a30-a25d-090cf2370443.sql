-- Note: The admin user needs to be created by signing up with admin@mmamc.com / admin@123
-- This migration ensures any user with that email gets admin role
-- After signup, run this to make them admin:

-- First, let's create a function that can be used to promote a user to admin by email
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id from profiles by email
  SELECT user_id INTO target_user_id
  FROM public.profiles
  WHERE email = user_email
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RETURN 'User not found. Please sign up first with email: ' || user_email;
  END IF;
  
  -- Update or insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin';
  
  RETURN 'User ' || user_email || ' promoted to admin successfully';
END;
$$;