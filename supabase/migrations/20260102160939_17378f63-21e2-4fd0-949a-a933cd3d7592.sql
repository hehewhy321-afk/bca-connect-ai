-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- Create enum for event status
CREATE TYPE public.event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- Create enum for resource type
CREATE TYPE public.resource_type AS ENUM ('study_material', 'past_paper', 'project', 'interview_prep', 'article');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  batch TEXT,
  semester INTEGER,
  phone TEXT,
  bio TEXT,
  skills TEXT[],
  github_url TEXT,
  linkedin_url TEXT,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_alumni BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  image_url TEXT,
  max_attendees INTEGER,
  is_featured BOOLEAN DEFAULT false,
  status event_status DEFAULT 'upcoming',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attended BOOLEAN DEFAULT false,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (event_id, user_id)
);

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type resource_type NOT NULL,
  category TEXT,
  file_url TEXT,
  external_url TEXT,
  semester INTEGER,
  subject TEXT,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 10,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, achievement_id)
);

-- Create chat_messages table for AI assistant
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- RLS Policies for event_registrations
CREATE POLICY "Users can view own registrations"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own registrations"
  ON public.event_registrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for resources
CREATE POLICY "Resources are viewable by authenticated users"
  ON public.resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- RLS Policies for achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for announcements
CREATE POLICY "Announcements are viewable by everyone"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, category) VALUES
  ('Welcome', 'Created your account', '👋', 10, 'general'),
  ('Profile Complete', 'Filled out your complete profile', '✅', 25, 'general'),
  ('First Event', 'Attended your first event', '🎉', 20, 'events'),
  ('Event Enthusiast', 'Attended 5 events', '🌟', 50, 'events'),
  ('Resource Contributor', 'Uploaded your first resource', '📚', 30, 'resources'),
  ('AI Explorer', 'Used the AI assistant 10 times', '🤖', 25, 'ai'),
  ('Social Butterfly', 'Connected with 10 members', '🦋', 40, 'social'),
  ('Rising Star', 'Reached level 5', '⭐', 100, 'general');

-- Insert sample events
INSERT INTO public.events (title, description, category, start_date, location, image_url, max_attendees, is_featured, status) VALUES
  ('Web Development Workshop', 'Learn modern web development with React and Next.js. Hands-on workshop for beginners and intermediate developers.', 'Workshop', '2026-01-15 10:00:00+05:45', 'Computer Lab A', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop', 45, true, 'upcoming'),
  ('AI/ML Seminar Series', 'Introduction to Machine Learning concepts and practical applications. Industry experts will share their insights.', 'Seminar', '2026-01-20 14:00:00+05:45', 'Auditorium', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop', 120, false, 'upcoming'),
  ('Hackathon 2026', '48-hour coding marathon to build innovative solutions. Great prizes and networking opportunities!', 'Competition', '2026-02-01 09:00:00+05:45', 'Main Campus', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop', 200, true, 'upcoming'),
  ('Cloud Computing Basics', 'Introduction to AWS, Azure, and Google Cloud platforms. Perfect for beginners looking to learn cloud technologies.', 'Workshop', '2026-01-25 11:00:00+05:45', 'Computer Lab B', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop', 35, false, 'upcoming');

-- Insert sample resources
INSERT INTO public.resources (title, description, type, category, semester, subject, external_url) VALUES
  ('Data Structures Notes', 'Comprehensive notes covering arrays, linked lists, trees, and graphs', 'study_material', 'Programming', 3, 'Data Structures', 'https://example.com/ds-notes'),
  ('Database Management Past Papers 2025', 'Collection of past examination papers with solutions', 'past_paper', 'Database', 4, 'DBMS', 'https://example.com/dbms-papers'),
  ('React Project Starter', 'Boilerplate code for starting React projects with best practices', 'project', 'Web Development', 5, 'Web Technologies', 'https://github.com/example/react-starter'),
  ('Interview Preparation Guide', 'Complete guide for technical interviews at top tech companies', 'interview_prep', 'Career', null, 'Interview Skills', 'https://example.com/interview-guide');