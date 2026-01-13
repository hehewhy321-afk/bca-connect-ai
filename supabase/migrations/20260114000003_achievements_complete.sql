-- Achievements System - Complete Implementation
-- Run this in Supabase SQL Editor

-- 1. Add unique constraint on achievement name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'achievements_name_key'
  ) THEN
    ALTER TABLE achievements ADD CONSTRAINT achievements_name_key UNIQUE (name);
  END IF;
END $$;

-- 2. Create resource downloads tracking table
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  downloaded_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (resource_id, user_id)
);

ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads" ON public.resource_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track downloads" ON public.resource_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all downloads" ON public.resource_downloads FOR SELECT USING (
  (SELECT has_role(auth.uid(), 'admin')) OR (SELECT has_role(auth.uid(), 'moderator'))
);

-- 3. Insert default achievements
INSERT INTO achievements (name, description, icon, category, xp_reward) VALUES
  ('First Steps', 'Complete your profile', '👤', 'profile', 10),
  ('Event Enthusiast', 'Register for your first event', '🎉', 'events', 15),
  ('Event Regular', 'Attend 5 events', '🎪', 'events', 50),
  ('Event Master', 'Attend 10 events', '🏆', 'events', 100),
  ('Knowledge Seeker', 'Download your first resource', '📚', 'learning', 10),
  ('Bookworm', 'Download 10 resources', '📖', 'learning', 50),
  ('Scholar', 'Download 25 resources', '🎓', 'learning', 100),
  ('Forum Newbie', 'Create your first forum post', '💬', 'forum', 15),
  ('Discussion Starter', 'Create 5 forum posts', '🗣️', 'forum', 50),
  ('Forum Expert', 'Create 10 forum posts', '🎯', 'forum', 100),
  ('Helpful Member', 'Reply to 10 forum posts', '🤝', 'forum', 50),
  ('Community Hero', 'Reply to 25 forum posts', '⭐', 'forum', 100),
  ('Upvote Giver', 'Give 10 upvotes', '👍', 'engagement', 25),
  ('Popular Post', 'Get 10 upvotes on a post', '🔥', 'engagement', 50),
  ('Viral Content', 'Get 25 upvotes on a post', '💫', 'engagement', 100),
  ('Certified', 'Earn your first certificate', '📜', 'achievements', 50),
  ('Certificate Collector', 'Earn 3 certificates', '🏅', 'achievements', 100),
  ('Achievement Hunter', 'Unlock 5 achievements', '🎖️', 'meta', 50),
  ('Completionist', 'Unlock 10 achievements', '👑', 'meta', 150)
ON CONFLICT (name) DO NOTHING;

-- 4. Function to award achievement and XP
CREATE OR REPLACE FUNCTION award_achievement(p_user_id UUID, p_achievement_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement_id UUID;
  v_xp_reward INTEGER;
  v_already_earned BOOLEAN;
BEGIN
  SELECT id, xp_reward INTO v_achievement_id, v_xp_reward
  FROM achievements WHERE name = p_achievement_name;

  IF v_achievement_id IS NULL THEN RETURN FALSE; END IF;

  SELECT EXISTS(SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = v_achievement_id) INTO v_already_earned;
  IF v_already_earned THEN RETURN FALSE; END IF;

  INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, v_achievement_id);
  UPDATE profiles SET xp_points = xp_points + v_xp_reward, level = FLOOR((xp_points + v_xp_reward) / 100) + 1 WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Event registration achievement
CREATE OR REPLACE FUNCTION check_event_registration_achievement()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM award_achievement(NEW.user_id, 'Event Enthusiast');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Event attendance achievements
CREATE OR REPLACE FUNCTION check_event_achievements()
RETURNS TRIGGER AS $$
DECLARE v_event_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_event_count FROM event_registrations WHERE user_id = NEW.user_id AND attended = true;
  IF v_event_count = 5 THEN PERFORM award_achievement(NEW.user_id, 'Event Regular');
  ELSIF v_event_count = 10 THEN PERFORM award_achievement(NEW.user_id, 'Event Master');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Download achievements
CREATE OR REPLACE FUNCTION check_download_achievements()
RETURNS TRIGGER AS $$
DECLARE v_download_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT resource_id) INTO v_download_count FROM resource_downloads WHERE user_id = NEW.user_id;
  IF v_download_count = 1 THEN PERFORM award_achievement(NEW.user_id, 'Knowledge Seeker');
  ELSIF v_download_count = 10 THEN PERFORM award_achievement(NEW.user_id, 'Bookworm');
  ELSIF v_download_count = 25 THEN PERFORM award_achievement(NEW.user_id, 'Scholar');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Forum post achievements
CREATE OR REPLACE FUNCTION check_forum_post_achievements()
RETURNS TRIGGER AS $$
DECLARE v_post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_post_count FROM forum_posts WHERE user_id = NEW.user_id;
  IF v_post_count = 1 THEN PERFORM award_achievement(NEW.user_id, 'Forum Newbie');
  ELSIF v_post_count = 5 THEN PERFORM award_achievement(NEW.user_id, 'Discussion Starter');
  ELSIF v_post_count = 10 THEN PERFORM award_achievement(NEW.user_id, 'Forum Expert');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Forum reply achievements
CREATE OR REPLACE FUNCTION check_forum_reply_achievements()
RETURNS TRIGGER AS $$
DECLARE v_reply_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_reply_count FROM forum_replies WHERE user_id = NEW.user_id;
  IF v_reply_count = 10 THEN PERFORM award_achievement(NEW.user_id, 'Helpful Member');
  ELSIF v_reply_count = 25 THEN PERFORM award_achievement(NEW.user_id, 'Community Hero');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Upvote achievements
CREATE OR REPLACE FUNCTION check_upvote_achievements()
RETURNS TRIGGER AS $$
DECLARE v_upvote_count INTEGER; v_post_upvotes INTEGER; v_post_user_id UUID;
BEGIN
  IF NEW.vote_type = 1 THEN
    SELECT COUNT(*) INTO v_upvote_count FROM forum_votes WHERE user_id = NEW.user_id AND vote_type = 1;
    IF v_upvote_count = 10 THEN PERFORM award_achievement(NEW.user_id, 'Upvote Giver'); END IF;

    IF NEW.post_id IS NOT NULL THEN
      SELECT upvotes, user_id INTO v_post_upvotes, v_post_user_id FROM forum_posts WHERE id = NEW.post_id;
      IF v_post_upvotes = 10 THEN PERFORM award_achievement(v_post_user_id, 'Popular Post');
      ELSIF v_post_upvotes = 25 THEN PERFORM award_achievement(v_post_user_id, 'Viral Content');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Certificate achievements
CREATE OR REPLACE FUNCTION check_certificate_achievements()
RETURNS TRIGGER AS $$
DECLARE v_cert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cert_count FROM certificates WHERE user_id = NEW.user_id;
  IF v_cert_count = 1 THEN PERFORM award_achievement(NEW.user_id, 'Certified');
  ELSIF v_cert_count = 3 THEN PERFORM award_achievement(NEW.user_id, 'Certificate Collector');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Meta achievements
CREATE OR REPLACE FUNCTION check_meta_achievements()
RETURNS TRIGGER AS $$
DECLARE v_achievement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_achievement_count FROM user_achievements WHERE user_id = NEW.user_id;
  IF v_achievement_count = 5 THEN PERFORM award_achievement(NEW.user_id, 'Achievement Hunter');
  ELSIF v_achievement_count = 10 THEN PERFORM award_achievement(NEW.user_id, 'Completionist');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Profile completion achievement
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND
     (NEW.bio IS NOT NULL AND NEW.bio != '' OR NEW.batch IS NOT NULL AND NEW.batch != '' OR NEW.semester IS NOT NULL) THEN
    PERFORM award_achievement(NEW.user_id, 'First Steps');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create all triggers
DROP TRIGGER IF EXISTS trigger_event_registration_achievement ON event_registrations;
CREATE TRIGGER trigger_event_registration_achievement AFTER INSERT ON event_registrations FOR EACH ROW EXECUTE FUNCTION check_event_registration_achievement();

DROP TRIGGER IF EXISTS trigger_event_achievements ON event_registrations;
CREATE TRIGGER trigger_event_achievements AFTER UPDATE OF attended ON event_registrations FOR EACH ROW WHEN (NEW.attended = true AND (OLD.attended = false OR OLD.attended IS NULL)) EXECUTE FUNCTION check_event_achievements();

DROP TRIGGER IF EXISTS trigger_download_achievements ON resource_downloads;
CREATE TRIGGER trigger_download_achievements AFTER INSERT ON resource_downloads FOR EACH ROW EXECUTE FUNCTION check_download_achievements();

DROP TRIGGER IF EXISTS trigger_forum_post_achievements ON forum_posts;
CREATE TRIGGER trigger_forum_post_achievements AFTER INSERT ON forum_posts FOR EACH ROW EXECUTE FUNCTION check_forum_post_achievements();

DROP TRIGGER IF EXISTS trigger_forum_reply_achievements ON forum_replies;
CREATE TRIGGER trigger_forum_reply_achievements AFTER INSERT ON forum_replies FOR EACH ROW EXECUTE FUNCTION check_forum_reply_achievements();

DROP TRIGGER IF EXISTS trigger_upvote_achievements ON forum_votes;
CREATE TRIGGER trigger_upvote_achievements AFTER INSERT ON forum_votes FOR EACH ROW EXECUTE FUNCTION check_upvote_achievements();

DROP TRIGGER IF EXISTS trigger_certificate_achievements ON certificates;
CREATE TRIGGER trigger_certificate_achievements AFTER INSERT ON certificates FOR EACH ROW EXECUTE FUNCTION check_certificate_achievements();

DROP TRIGGER IF EXISTS trigger_meta_achievements ON user_achievements;
CREATE TRIGGER trigger_meta_achievements AFTER INSERT ON user_achievements FOR EACH ROW EXECUTE FUNCTION check_meta_achievements();

DROP TRIGGER IF EXISTS trigger_profile_completion ON profiles;
CREATE TRIGGER trigger_profile_completion AFTER UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION check_profile_completion();
