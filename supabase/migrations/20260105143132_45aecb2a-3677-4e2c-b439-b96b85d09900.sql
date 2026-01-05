-- Add alumni-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS graduation_year integer,
ADD COLUMN IF NOT EXISTS current_company text,
ADD COLUMN IF NOT EXISTS job_title text;