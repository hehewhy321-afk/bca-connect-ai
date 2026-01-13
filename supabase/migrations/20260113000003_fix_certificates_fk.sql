-- Add FK to allow joining certificates with profiles
ALTER TABLE public.certificates
DROP CONSTRAINT IF EXISTS certificates_user_id_fkey, -- Drop the old one to auth.users if it conflicts, or strictly speaking we can have multiple but for PostgREST styling distinct is better. Actually, keeping auth.users FK is good for integrity. We can ADD a second one or replace it.
-- Let's just ADD a distinct FK for profiles to enable the Join, PostgREST can use it.
ADD CONSTRAINT certificates_user_profile_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;
