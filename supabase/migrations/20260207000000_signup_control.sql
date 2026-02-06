-- Add signup_enabled setting
INSERT INTO public.website_settings (setting_key, setting_value)
VALUES ('signup_enabled', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to check if signup is allowed
CREATE OR REPLACE FUNCTION public.check_signup_allowed()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.website_settings 
    WHERE setting_key = 'signup_enabled' AND setting_value = 'false'
  ) THEN
    RAISE EXCEPTION 'Signup is currently disabled by the administrator.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS tr_block_signup_if_disabled ON auth.users;
CREATE TRIGGER tr_block_signup_if_disabled
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_signup_allowed();
