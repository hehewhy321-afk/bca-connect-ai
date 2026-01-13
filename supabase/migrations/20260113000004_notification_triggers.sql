-- =============================================
-- Automatic Notification Triggers
-- Sends notifications for:
-- - Forum replies
-- - New certificates
-- - Event updates
-- - Announcements
-- =============================================

-- Add notification preferences column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"forum_replies": true, "new_certificates": true, "event_updates": true, "announcements": true}'::jsonb,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false;

-- Function to send notification for forum replies
CREATE OR REPLACE FUNCTION notify_forum_reply()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
  replier_name TEXT;
  author_prefs JSONB;
BEGIN
  -- Get the post author and title
  SELECT user_id, title INTO post_author_id, post_title
  FROM forum_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if replying to own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get replier's name
  SELECT full_name INTO replier_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Check if user wants forum reply notifications
  SELECT notification_preferences INTO author_prefs
  FROM profiles
  WHERE user_id = post_author_id;
  
  IF author_prefs->>'forum_replies' = 'true' THEN
    -- Insert notification
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      post_author_id,
      'New Reply on Your Post',
      replier_name || ' replied to "' || post_title || '"',
      'forum',
      '/dashboard/forum/' || NEW.post_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification for new certificates
CREATE OR REPLACE FUNCTION notify_new_certificate()
RETURNS TRIGGER AS $$
DECLARE
  user_prefs JSONB;
BEGIN
  -- Check if user wants certificate notifications
  SELECT notification_preferences INTO user_prefs
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  IF user_prefs->>'new_certificates' = 'true' THEN
    -- Insert notification
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'New Certificate Issued',
      'You have received a new certificate: ' || NEW.title,
      'achievement',
      '/dashboard/certificates'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification for event registrations
CREATE OR REPLACE FUNCTION notify_event_registration()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  event_date TIMESTAMPTZ;
  user_prefs JSONB;
BEGIN
  -- Get event details
  SELECT title, start_date INTO event_title, event_date
  FROM events
  WHERE id = NEW.event_id;
  
  -- Check if user wants event notifications
  SELECT notification_preferences INTO user_prefs
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  IF user_prefs->>'event_updates' = 'true' THEN
    -- Insert notification
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Event Registration Confirmed',
      'You are registered for "' || event_title || '"',
      'event',
      '/dashboard/events/' || NEW.event_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification for new announcements
CREATE OR REPLACE FUNCTION notify_new_announcement()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Send to all users who want announcement notifications
  FOR user_record IN 
    SELECT user_id 
    FROM profiles 
    WHERE notification_preferences->>'announcements' = 'true'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      user_record.user_id,
      NEW.title,
      LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
      'info',
      '/dashboard'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_forum_reply ON forum_replies;
CREATE TRIGGER trigger_notify_forum_reply
  AFTER INSERT ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION notify_forum_reply();

DROP TRIGGER IF EXISTS trigger_notify_new_certificate ON certificates;
CREATE TRIGGER trigger_notify_new_certificate
  AFTER INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_certificate();

DROP TRIGGER IF EXISTS trigger_notify_event_registration ON event_registrations;
CREATE TRIGGER trigger_notify_event_registration
  AFTER INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_registration();

DROP TRIGGER IF EXISTS trigger_notify_new_announcement ON announcements;
CREATE TRIGGER trigger_notify_new_announcement
  AFTER INSERT ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_announcement();

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
ON notifications(user_id, is_read);

-- Function to auto-delete old notifications (older than 7 days)
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Auto-deletion will be handled by a Supabase Edge Function
-- The function above can be called manually or via Edge Function
