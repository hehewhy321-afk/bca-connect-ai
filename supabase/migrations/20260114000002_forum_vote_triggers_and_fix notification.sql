-- =============================================
-- APPLY ALL PENDING MIGRATIONS
-- Copy and paste this entire file into Supabase SQL Editor
-- =============================================

-- Migration 1: Fix Notification Deletion
-- 20260114000001_fix_notification_policies.sql

-- Add policy for admins to view all notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (
  (SELECT has_role(auth.uid(), 'admin')) OR 
  (SELECT has_role(auth.uid(), 'moderator'))
);

-- Add policy for admins to delete notifications
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (
  (SELECT has_role(auth.uid(), 'admin')) OR 
  (SELECT has_role(auth.uid(), 'moderator'))
);

-- Migration 2: Forum Vote Triggers
-- 20260114000002_forum_vote_triggers.sql

-- Function to update post upvotes
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
$$ LANGUAGE plpgsql;

-- Function to update reply upvotes
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
$$ LANGUAGE plpgsql;

-- Create triggers for post votes
DROP TRIGGER IF EXISTS trigger_update_post_upvotes ON forum_votes;
CREATE TRIGGER trigger_update_post_upvotes
  AFTER INSERT OR UPDATE OR DELETE ON forum_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_upvotes();

-- Create triggers for reply votes
DROP TRIGGER IF EXISTS trigger_update_reply_upvotes ON forum_votes;
CREATE TRIGGER trigger_update_reply_upvotes
  AFTER INSERT OR UPDATE OR DELETE ON forum_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_reply_upvotes();

-- =============================================
-- MIGRATIONS APPLIED SUCCESSFULLY
-- =============================================
