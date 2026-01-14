-- Create ai_generated_images table for storing AI-generated images
CREATE TABLE IF NOT EXISTS public.ai_generated_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  image_url text NOT NULL,
  model_used text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_generated_images_user_id ON public.ai_generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_images_created_at ON public.ai_generated_images(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own images
CREATE POLICY "Users can view their own generated images"
  ON public.ai_generated_images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own images
CREATE POLICY "Users can insert their own generated images"
  ON public.ai_generated_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete their own generated images"
  ON public.ai_generated_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all images
CREATE POLICY "Admins can view all generated images"
  ON public.ai_generated_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add ai_settings table entry for pollinations_model if not exists
INSERT INTO public.ai_settings (setting_key, setting_value)
VALUES ('pollinations_model', 'flux')
ON CONFLICT (setting_key) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.ai_generated_images TO authenticated;
GRANT ALL ON public.ai_generated_images TO service_role;
