-- Add new fields to courses table for pricing, language, and resources
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS offer_price numeric,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS resources_url text;

-- Add resources_url to course_chapters table
ALTER TABLE public.course_chapters
ADD COLUMN IF NOT EXISTS resources_url text;

-- Migrate existing price to original_price
UPDATE public.courses
SET original_price = price
WHERE original_price IS NULL AND price IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.courses.original_price IS 'Original/regular price of the course';
COMMENT ON COLUMN public.courses.offer_price IS 'Discounted/offer price (if applicable)';
COMMENT ON COLUMN public.courses.language IS 'Course language (e.g., English, Nepali, Hindi)';
COMMENT ON COLUMN public.courses.resources_url IS 'URL to downloadable course resources (zip, Google Drive, etc.)';
COMMENT ON COLUMN public.course_chapters.resources_url IS 'URL to downloadable chapter-specific resources';
