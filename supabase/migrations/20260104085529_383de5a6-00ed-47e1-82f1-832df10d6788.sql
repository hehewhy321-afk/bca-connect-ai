-- Create website_settings table
CREATE TABLE public.website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Website settings are viewable by everyone"
ON public.website_settings FOR SELECT USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage website settings"
ON public.website_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.website_settings (setting_key, setting_value) VALUES
  ('site_name', 'BCA Association'),
  ('site_logo', null),
  ('phone', '+977-XXXXXXXXXX'),
  ('email_primary', 'info@bcaassociation.edu.np'),
  ('email_secondary', 'support@bcaassociation.edu.np'),
  ('facebook_url', 'https://facebook.com/bcaassociation'),
  ('twitter_url', 'https://twitter.com/bcaassociation'),
  ('instagram_url', 'https://instagram.com/bcaassociation'),
  ('linkedin_url', 'https://linkedin.com/company/bcaassociation'),
  ('youtube_url', null);

-- Create FAQs table
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active FAQs
CREATE POLICY "Active FAQs are viewable by everyone"
ON public.faqs FOR SELECT USING (is_active = true);

-- Admins can manage all FAQs
CREATE POLICY "Admins can manage FAQs"
ON public.faqs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert sample FAQs
INSERT INTO public.faqs (question, answer, category, display_order) VALUES
  ('What is BCA Association?', 'BCA Association is a student-led organization at MMAMC that connects BCA students, organizes events, and provides resources for academic and career growth.', 'General', 1),
  ('How can I join the association?', 'Any BCA student can join by signing up on our website and participating in our events and activities.', 'Membership', 2),
  ('Are events free for members?', 'Most events are free for registered members. Some special workshops may have a nominal fee.', 'Events', 3),
  ('How can I contact the association?', 'You can reach us through our contact page, email, or social media channels.', 'General', 4);

-- Add trigger for updated_at
CREATE TRIGGER update_website_settings_updated_at
BEFORE UPDATE ON public.website_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();