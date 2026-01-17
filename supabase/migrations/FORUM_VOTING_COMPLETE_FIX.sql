-- =============================================
-- COMPLETE FORUM VOTING FIX - ALL IN ONE
-- Run this ONCE in Supabase SQL Editor
-- This fixes all voting issues in one go
-- =============================================

-- STEP 1: Fix RLS Policy (Main Issue)
-- Problem: Users can't update upvotes on posts they don't own
-- Solution: Create secure RPC functions that bypass RLS

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can update own posts" ON public.forum_posts;

-- Create new policy for content updates (users can only update their own posts)
CREATE POLICY "Users can update own posts content"
ON public.forum_posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- STEP 2: Create Secure RPC Functions for Upvotes
-- These run with elevated permissions to bypass RLS

CREATE OR REPLACE FUNCTION increment_post_upvotes_secure(post_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's permissions
SET search_path = public
AS $$
BEGIN
  UPDATE forum_posts
  SET upvotes = upvotes + 1
  WHERE id = post_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_upvotes_secure(post_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's permissions
SET search_path = public
AS $$
BEGIN
  UPDATE forum_posts
  SET upvotes = GREATEST(upvotes - 1, 0)  -- Don't go below 0
  WHERE id = post_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_post_upvotes_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_upvotes_secure(uuid) TO authenticated;

-- STEP 3: Create Database Triggers (Backup/Alternative Method)
-- These automatically update upvotes when votes are added/removed
-- Works as a backup if RPC calls fail

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_post_upvotes ON forum_votes;
DROP TRIGGER IF EXISTS trigger_update_reply_upvotes ON forum_votes;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_post_upvotes();
DROP FUNCTION IF EXISTS update_reply_upvotes();

-- Function to update post upvotes via trigger
CREATE OR REPLACE FUNCTION update_post_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    -- Add vote
    UPDATE forum_posts
    SET upvotes = upvotes + NEW.vote_type
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.post_id IS NOT NULL THEN
    -- Change vote
    UPDATE forum_posts
    SET upvotes = upvotes + (NEW.vote_type - OLD.vote_type)
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    -- Remove vote
    UPDATE forum_posts
    SET upvotes = upvotes - OLD.vote_type
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- Run with elevated permissions

-- Function to update reply upvotes via trigger
CREATE OR REPLACE FUNCTION update_reply_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reply_id IS NOT NULL THEN
    -- Add vote
    UPDATE forum_replies
    SET upvotes = upvotes + NEW.vote_type
    WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.reply_id IS NOT NULL THEN
    -- Change vote
    UPDATE forum_replies
    SET upvotes = upvotes + (NEW.vote_type - OLD.vote_type)
    WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reply_id IS NOT NULL THEN
    -- Remove vote
    UPDATE forum_replies
    SET upvotes = upvotes - OLD.vote_type
    WHERE id = OLD.reply_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- Run with elevated permissions

-- Create triggers
CREATE TRIGGER trigger_update_post_upvotes
  AFTER INSERT OR UPDATE OR DELETE ON forum_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_upvotes();

CREATE TRIGGER trigger_update_reply_upvotes
  AFTER INSERT OR UPDATE OR DELETE ON forum_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_reply_upvotes();

-- STEP 4: Verification Queries
-- Check that everything was created successfully

-- Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'forum_posts' AND cmd = 'UPDATE';

-- Check RPC functions
SELECT 
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_name LIKE '%upvotes_secure%';

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%upvote%';

-- =============================================
-- MIGRATION COMPLETE! ✅
-- 
-- What was fixed:
-- 1. RLS policy now allows upvote updates via secure RPC functions
-- 2. Database triggers as backup method
-- 3. Both post and reply voting supported
--
-- Next steps:
-- 1. Restart your Flutter app
-- 2. Test upvoting - should work now!
-- 3. Check logs for "Vote added via RPC"
-- =============================================
