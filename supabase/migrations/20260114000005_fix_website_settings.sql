-- Fix website settings by inserting default rows
-- Migration: 20260114000005

-- Insert default website settings if they don't exist
INSERT INTO public.website_settings (setting_key, setting_value)
VALUES
  ('site_name', 'BCA Association'),
  ('site_logo', ''),
  ('phone', ''),
  ('email_primary', ''),
  ('email_secondary', ''),
  ('facebook_url', ''),
  ('twitter_url', ''),
  ('instagram_url', ''),
  ('linkedin_url', ''),
  ('youtube_url', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Add updated_at trigger for website_settings
CREATE OR REPLACE FUNCTION update_website_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_website_settings_updated_at ON public.website_settings;
CREATE TRIGGER trigger_update_website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_website_settings_updated_at();
