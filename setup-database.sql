-- =============================================
-- BCA Association MMAMC - Complete Database Setup
-- =============================================
-- Run this SQL in Supabase SQL Editor to set up the entire database
-- Make sure to run this on a fresh Supabase project
-- =============================================

-- =============================================
-- STEP 1: CREATE ENUMS
-- =============================================

-- App role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- Event status enum
CREATE TYPE public.event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- Resource type enum
CREATE TYPE public.resource_type AS ENUM ('study_material', 'past_paper', 'project', 'interview_prep', 'article');

-- =============================================
-- STEP 2: CREATE FUNCTIONS
-- =============================================

-- Function to check if user has a specific role (prevents RLS recursion)
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

-- Function to update updated_at timestamp
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

-- Function to handle new user registration (creates profile and assigns role)
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

-- =============================================
-- STEP 3: CREATE TABLES
-- =============================================

-- User Roles Table
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Profiles Table
CREATE TABLE public.profiles (
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
  skills text[],
  linkedin_url text,
  github_url text,
  xp_points integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Events Table
CREATE TABLE public.events (
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

-- Event Registrations Table (for logged-in users)
CREATE TABLE public.event_registrations (
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

-- Public Event Registrations Table (for non-logged-in users)
CREATE TABLE public.public_event_registrations (
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
CREATE TABLE public.event_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event Reminders Table
CREATE TABLE public.event_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Resources Table
CREATE TABLE public.resources (
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
CREATE TABLE public.announcements (
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
CREATE TABLE public.faqs (
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
CREATE TABLE public.contact_submissions (
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
CREATE TABLE public.notifications (
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
CREATE TABLE public.forum_posts (
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
CREATE TABLE public.forum_replies (
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
CREATE TABLE public.forum_votes (
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
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  category text,
  xp_reward integer DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Achievements Table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- Founding Members Table
CREATE TABLE public.founding_members (
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
CREATE TABLE public.website_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- AI Settings Table
CREATE TABLE public.ai_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- STEP 4: CREATE TRIGGERS
-- =============================================

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at
  BEFORE UPDATE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_founding_members_updated_at
  BEFORE UPDATE ON public.founding_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =============================================

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

-- =============================================
-- STEP 6: CREATE RLS POLICIES
-- =============================================

-- USER ROLES POLICIES
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- EVENTS POLICIES
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- EVENT REGISTRATIONS POLICIES
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations" ON public.event_registrations
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own registrations" ON public.event_registrations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update registrations" ON public.event_registrations
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- PUBLIC EVENT REGISTRATIONS POLICIES
CREATE POLICY "Anyone can register for public events" ON public.public_event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view public registrations" ON public.public_event_registrations
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can update public registrations" ON public.public_event_registrations
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete public registrations" ON public.public_event_registrations
  FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- EVENT FEEDBACK POLICIES
CREATE POLICY "Users can view own feedback" ON public.event_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.event_feedback
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can submit feedback" ON public.event_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.event_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON public.event_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- EVENT REMINDERS POLICIES
CREATE POLICY "Anyone can subscribe to event reminders" ON public.event_reminders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own reminders" ON public.event_reminders
  FOR SELECT USING (
    (email = ((current_setting('request.jwt.claims', true))::json ->> 'email')) 
    OR (user_id = auth.uid())
  );

CREATE POLICY "Admins can view all reminders" ON public.event_reminders
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update reminders" ON public.event_reminders
  FOR UPDATE USING (true);

-- RESOURCES POLICIES
CREATE POLICY "Resources are viewable by authenticated users" ON public.resources
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- FAQS POLICIES
CREATE POLICY "Active FAQs are viewable by everyone" ON public.faqs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQs" ON public.faqs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- CONTACT SUBMISSIONS POLICIES
CREATE POLICY "Anyone can submit contact forms" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact submissions" ON public.contact_submissions
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- FORUM POSTS POLICIES
CREATE POLICY "Forum posts are viewable by authenticated users" ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- FORUM REPLIES POLICIES
CREATE POLICY "Forum replies are viewable by authenticated users" ON public.forum_replies
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum replies" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies" ON public.forum_replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies" ON public.forum_replies
  FOR DELETE USING (auth.uid() = user_id);

-- FORUM VOTES POLICIES
CREATE POLICY "Votes are viewable by authenticated users" ON public.forum_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON public.forum_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.forum_votes
  FOR DELETE USING (auth.uid() = user_id);

-- ACHIEVEMENTS POLICIES
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements
  FOR SELECT USING (true);

-- USER ACHIEVEMENTS POLICIES
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- FOUNDING MEMBERS POLICIES
CREATE POLICY "Anyone can view active founding members" ON public.founding_members
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage founding members" ON public.founding_members
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- WEBSITE SETTINGS POLICIES
CREATE POLICY "Website settings are viewable by everyone" ON public.website_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage website settings" ON public.website_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- AI SETTINGS POLICIES
CREATE POLICY "Admins can manage AI settings" ON public.ai_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- CHAT MESSAGES POLICIES
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STEP 7: CREATE STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('website-assets', 'website-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', true);

-- =============================================
-- STEP 8: CREATE STORAGE POLICIES
-- =============================================

-- Avatars bucket policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Resources bucket policies
CREATE POLICY "Resources are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Admins can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resources' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  ));

CREATE POLICY "Admins can update resources" ON storage.objects
  FOR UPDATE USING (bucket_id = 'resources' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  ));

CREATE POLICY "Admins can delete resources" ON storage.objects
  FOR DELETE USING (bucket_id = 'resources' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  ));

-- Events bucket policies
CREATE POLICY "Event images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "Admins can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'events' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  ));

CREATE POLICY "Admins can update event images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'events' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  ));

CREATE POLICY "Admins can delete event images" ON storage.objects
  FOR DELETE USING (bucket_id = 'events' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  ));

-- Website assets bucket policies
CREATE POLICY "Website assets are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'website-assets');

CREATE POLICY "Admins can upload website assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'website-assets' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  ));

CREATE POLICY "Admins can update website assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'website-assets' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  ));

CREATE POLICY "Admins can delete website assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'website-assets' AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  ));

-- Payment receipts bucket policies
CREATE POLICY "Payment receipts are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-receipts');

CREATE POLICY "Users can upload payment receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can upload payment receipts (public events)" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-receipts');

-- =============================================
-- STEP 9: INSERT DEFAULT DATA
-- =============================================

-- Default website settings
INSERT INTO public.website_settings (setting_key, setting_value) VALUES
  ('site_name', 'BCA Association'),
  ('site_tagline', 'MMAMC Biratnagar'),
  ('contact_email', 'bca@mmamc.edu.np'),
  ('contact_phone', '+977-XXX-XXXXXXX'),
  ('contact_address', 'MMAMC, Biratnagar, Nepal'),
  ('facebook_url', 'https://facebook.com/bcammamc'),
  ('instagram_url', 'https://instagram.com/bcammamc'),
  ('linkedin_url', 'https://linkedin.com/company/bcammamc'),
  ('twitter_url', 'https://twitter.com/bcammamc');

-- Default AI settings
INSERT INTO public.ai_settings (setting_key, setting_value) VALUES
  ('ai_provider', 'lovable'),
  ('openrouter_model', 'meta-llama/llama-3.2-3b-instruct:free');

-- Default achievements
INSERT INTO public.achievements (name, description, icon, category, xp_reward) VALUES
  ('First Steps', 'Complete your profile', 'User', 'onboarding', 50),
  ('Event Enthusiast', 'Attend your first event', 'Calendar', 'events', 100),
  ('Knowledge Seeker', 'Download 5 resources', 'BookOpen', 'resources', 75),
  ('Community Member', 'Create your first forum post', 'MessageSquare', 'community', 50),
  ('Helpful Hand', 'Reply to 10 forum posts', 'HandHeart', 'community', 100),
  ('AI Explorer', 'Use the AI assistant 10 times', 'Bot', 'ai', 75),
  ('Rising Star', 'Reach Level 5', 'Star', 'progress', 200),
  ('Tech Master', 'Reach Level 10', 'Crown', 'progress', 500);

-- Default FAQs
INSERT INTO public.faqs (question, answer, category, display_order, is_active) VALUES
  ('What is BCA Association?', 'BCA Association is a student organization at MMAMC Biratnagar dedicated to fostering learning, collaboration, and professional development among BCA students.', 'General', 1, true),
  ('How can I become a member?', 'All BCA students at MMAMC are automatically eligible for membership. Simply sign up on our platform to access all features and benefits.', 'Membership', 2, true),
  ('What events do you organize?', 'We organize various events including workshops, hackathons, tech talks, coding competitions, and social gatherings throughout the academic year.', 'Events', 3, true),
  ('How can I access study resources?', 'After signing in, navigate to the Resources section in your dashboard to browse and download study materials, past papers, and other educational content.', 'Resources', 4, true),
  ('How does the AI Assistant work?', 'Our AI Assistant is powered by advanced language models and can help you with BCA curriculum questions, code debugging, study tips, and more.', 'AI Assistant', 5, true);

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- After running this script:
-- 1. Sign up your first user
-- 2. Promote them to admin using: SELECT promote_to_admin('your-email@example.com');
-- 3. Enable email auto-confirm in Authentication settings for testing
-- =============================================
