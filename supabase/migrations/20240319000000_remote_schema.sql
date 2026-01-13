-- =============================================
-- BCA Association MMAMC - Consolidated Database Schema
-- Includes:
-- - Core Schema (Users, Events, Resources, etc.)
-- - Certificate System
-- - Missing Profile Columns (graduation_year, current_company, job_title)
-- - RLS Policies & Triggers
-- =============================================

-- 1. Create Types and Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_type AS ENUM ('study_material', 'past_paper', 'project', 'interview_prep', 'article');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Basic Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Create Tables

-- User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Profiles Table (Updated with new columns)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  phone text,
  bio text,
  batch text,
  semester integer,
  is_alumni boolean DEFAULT false,
  graduation_year integer, -- Added column
  current_company text,    -- Added column
  job_title text,          -- Added column
  skills text[],
  linkedin_url text,
  github_url text,
  xp_points integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  location text,
  image_url text,
  gallery_images text[] DEFAULT '{}'::text[],
  max_attendees integer,
  registration_fee numeric,
  team_type text DEFAULT 'solo',
  team_size_min integer DEFAULT 1,
  team_size_max integer DEFAULT 1,
  status event_status DEFAULT 'upcoming',
  visibility text DEFAULT 'public',
  is_featured boolean DEFAULT false,
  admin_notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_name text,
  team_members jsonb DEFAULT '[]'::jsonb,
  payment_status text DEFAULT 'pending',
  payment_receipt_url text,
  check_in_code text,
  attended boolean DEFAULT false,
  registered_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public Event Registrations Table
CREATE TABLE IF NOT EXISTS public.public_event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  team_name text,
  team_members jsonb DEFAULT '[]'::jsonb,
  payment_status text DEFAULT 'pending',
  payment_receipt_url text,
  check_in_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event Feedback Table
CREATE TABLE IF NOT EXISTS public.event_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event Reminders Table
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  type resource_type NOT NULL,
  category text,
  subject text,
  semester integer,
  file_url text,
  external_url text,
  uploaded_by uuid,
  views integer DEFAULT 0,
  downloads integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal',
  is_pinned boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Contact Submissions Table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Forum Posts Table
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}'::text[],
  views integer DEFAULT 0,
  upvotes integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Forum Replies Table
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  is_solution boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Forum Votes Table
CREATE TABLE IF NOT EXISTS public.forum_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  vote_type integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, reply_id)
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  category text,
  xp_reward integer DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- Founding Members Table
CREATE TABLE IF NOT EXISTS public.founding_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  role text NOT NULL,
  bio text,
  avatar_url text,
  email text,
  phone text,
  linkedin_url text,
  facebook_url text,
  twitter_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Website Settings Table
CREATE TABLE IF NOT EXISTS public.website_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- AI Settings Table
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- CERTIFICATE SYSTEM TABLES
-- =============================================

-- Certificate Categories Table
CREATE TABLE IF NOT EXISTS public.certificate_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate Signatures Table
CREATE TABLE IF NOT EXISTS public.certificate_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  signature_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate Templates Table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('sports', 'code')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.certificate_categories(id),
  template_id UUID REFERENCES public.certificate_templates(id),
  signature_id UUID REFERENCES public.certificate_signatures(id),
  event_date DATE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  verification_code TEXT UNIQUE NOT NULL,
  certificate_data JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Dependent Functions (Using Tables)

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

-- Function to promote user to admin by email
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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


-- Function to generate unique verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'CERT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
    SELECT EXISTS(SELECT 1 FROM certificates WHERE verification_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate verification code
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Indexes

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_category_id ON public.certificates(category_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_event_date ON public.certificates(event_date);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON public.certificates(created_at);

-- 6. Triggers

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Certificate Triggers
DROP TRIGGER IF EXISTS trigger_set_verification_code ON public.certificates;
CREATE TRIGGER trigger_set_verification_code
  BEFORE INSERT ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_code();

-- Update Timestamps Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_founding_members_updated_at BEFORE UPDATE ON public.founding_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_website_settings_updated_at BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_signatures_updated_at BEFORE UPDATE ON public.certificate_signatures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies

-- USER ROLES POLICIES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- EVENTS POLICIES
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- EVENT REGISTRATIONS POLICIES
CREATE POLICY "Users can view own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all registrations" ON public.event_registrations FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own registrations" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update registrations" ON public.event_registrations FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- PUBLIC EVENT REGISTRATIONS POLICIES
CREATE POLICY "Anyone can register for public events" ON public.public_event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view public registrations" ON public.public_event_registrations FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins can update public registrations" ON public.public_event_registrations FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins can delete public registrations" ON public.public_event_registrations FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- EVENT FEEDBACK POLICIES
CREATE POLICY "Users can view own feedback" ON public.event_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.event_feedback FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Users can submit feedback" ON public.event_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON public.event_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback" ON public.event_feedback FOR DELETE USING (auth.uid() = user_id);

-- EVENT REMINDERS POLICIES
CREATE POLICY "Anyone can subscribe to event reminders" ON public.event_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own reminders" ON public.event_reminders FOR SELECT USING ((email = ((current_setting('request.jwt.claims', true))::json ->> 'email')) OR (user_id = auth.uid()));
CREATE POLICY "Admins can view all reminders" ON public.event_reminders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can update reminders" ON public.event_reminders FOR UPDATE USING (true);

-- RESOURCES POLICIES
CREATE POLICY "Resources are viewable by authenticated users" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins can manage resources" ON public.resources FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'admin'));

-- FAQS POLICIES
CREATE POLICY "Active FAQs are viewable by everyone" ON public.faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage FAQs" ON public.faqs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- CONTACT SUBMISSIONS POLICIES
CREATE POLICY "Anyone can submit contact forms" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contact submissions" ON public.contact_submissions FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- FORUM POSTS POLICIES
CREATE POLICY "Forum posts are viewable by authenticated users" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can create forum posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = user_id);

-- FORUM REPLIES POLICIES
CREATE POLICY "Forum replies are viewable by authenticated users" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Users can create forum replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.forum_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.forum_replies FOR DELETE USING (auth.uid() = user_id);

-- FORUM VOTES POLICIES
CREATE POLICY "Forum votes are viewable by authenticated users" ON public.forum_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.forum_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update vote" ON public.forum_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.forum_votes FOR DELETE USING (auth.uid() = user_id);

-- ACHIEVEMENTS POLICIES
CREATE POLICY "Achievements are viewable by authenticated users" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(), 'admin'));

-- USER ACHIEVEMENTS POLICIES
CREATE POLICY "User achievements are viewable by authenticated users" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System can award achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- FOUNDING MEMBERS POLICIES
CREATE POLICY "Founding members are viewable by everyone" ON public.founding_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage founding members" ON public.founding_members FOR ALL USING (has_role(auth.uid(), 'admin'));

-- WEBSITE SETTINGS POLICIES
CREATE POLICY "Settings are viewable by everyone" ON public.website_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.website_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- AI SETTINGS POLICIES
CREATE POLICY "AI Settings are viewable by everyone" ON public.ai_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage AI settings" ON public.ai_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- CHAT MESSAGES POLICIES
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CERTIFICATE CATEGORIES POLICIES
CREATE POLICY "Anyone can view certificate categories" ON certificate_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage certificate categories" ON certificate_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- CERTIFICATE SIGNATURES POLICIES
CREATE POLICY "Anyone can view certificate signatures" ON certificate_signatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage certificate signatures" ON certificate_signatures FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- CERTIFICATE TEMPLATES POLICIES
CREATE POLICY "Anyone can view active certificate templates" ON certificate_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Only admins can manage certificate templates" ON certificate_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- CERTIFICATES POLICIES
CREATE POLICY "Users can view their own certificates" ON certificates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all certificates" ON certificates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can create certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update certificates" ON certificates FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete certificates" ON certificates FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 9. Seed Default Data

-- Insert default certificate categories
INSERT INTO certificate_categories (name, description, icon) VALUES
  ('Sports', 'Athletic and sports achievements', 'Trophy'),
  ('Workshop', 'Technical workshops and training', 'Wrench'),
  ('Hackathon', 'Coding competitions and hackathons', 'Code'),
  ('Seminar', 'Educational seminars and talks', 'BookOpen'),
  ('Competition', 'Academic and technical competitions', 'Award'),
  ('Volunteer', 'Community service and volunteering', 'Heart')
ON CONFLICT (name) DO NOTHING;

-- Insert default certificate templates
INSERT INTO certificate_templates (name, type, description) VALUES
  ('Sports Achievement', 'sports', 'Certificate for sports and athletic achievements'),
  ('Code Workshop', 'code', 'Certificate for coding workshops and hackathons')
ON CONFLICT (name) DO NOTHING;
