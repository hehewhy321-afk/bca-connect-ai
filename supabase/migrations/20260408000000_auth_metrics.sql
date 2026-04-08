-- Function to safely fetch last_sign_in_at for admins
CREATE OR REPLACE FUNCTION public.get_auth_metrics()
RETURNS TABLE (user_id uuid, last_sign_in_at timestamptz)
SECURITY DEFINER
AS $$
BEGIN
  -- Simple check: ensure the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT id, auth.users.last_sign_in_at
  FROM auth.users;
END;
$$ LANGUAGE plpgsql;
