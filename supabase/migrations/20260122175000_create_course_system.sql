-- Drop existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can do everything on courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view chapters of published courses" ON public.course_chapters;
DROP POLICY IF EXISTS "Admins can do everything on chapters" ON public.course_chapters;
DROP POLICY IF EXISTS "Public can view free preview lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Enrolled users can view lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Admins can do everything on lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can create their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can do everything on enrollments" ON public.course_enrollments;

-- Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.course_lessons CASCADE;
DROP TABLE IF EXISTS public.course_chapters CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- Drop existing enum type
DROP TYPE IF EXISTS public.course_enrollment_status CASCADE;

-- Add 'video' to resource_type enum (only if not already added)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video' AND enumtypid = 'public.resource_type'::regtype) THEN
    ALTER TYPE public.resource_type ADD VALUE 'video';
  END IF;
END $$;

-- Add new columns to resources table for free academic content
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS video_url text;

-- Create course_enrollment_status enum
CREATE TYPE public.course_enrollment_status AS ENUM ('pending', 'approved', 'rejected');

-- Create courses table
CREATE TABLE public.courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  price numeric DEFAULT 0,
  category text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course_chapters table
CREATE TABLE public.course_chapters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create course_lessons table
CREATE TABLE public.course_lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid REFERENCES public.course_chapters(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  video_url text,
  duration text,
  is_free_preview boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create course_enrollments table
CREATE TABLE public.course_enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status public.course_enrollment_status DEFAULT 'pending',
  payment_screenshot_url text,
  transaction_id text,
  enrolled_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Courses Policies
CREATE POLICY "Public can view published courses" ON public.courses
  FOR SELECT TO public USING (is_published = true);

CREATE POLICY "Admins can do everything on courses" ON public.courses
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Chapters Policies
CREATE POLICY "Public can view chapters of published courses" ON public.course_chapters
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 FROM public.courses WHERE id = course_chapters.course_id AND is_published = true
    )
  );

CREATE POLICY "Admins can do everything on chapters" ON public.course_chapters
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Lessons Policies
-- Anyone can view lessons of published courses (to see syllabus)
CREATE POLICY "Public can view lessons of published courses" ON public.course_lessons
  FOR SELECT TO public USING (
    EXISTS (
      SELECT 1 
      FROM public.course_chapters cc
      JOIN public.courses c ON c.id = cc.course_id
      WHERE cc.id = course_lessons.chapter_id
      AND c.is_published = true
    )
  );

-- Admins can do everything on lessons
CREATE POLICY "Admins can do everything on lessons" ON public.course_lessons
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Enrollments Policies
CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create their own enrollments" ON public.course_enrollments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can do everything on enrollments" ON public.course_enrollments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
