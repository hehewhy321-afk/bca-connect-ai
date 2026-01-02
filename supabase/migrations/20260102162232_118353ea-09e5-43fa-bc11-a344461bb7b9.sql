-- Create forum_posts table
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_replies table
CREATE TABLE public.forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_votes table (for upvoting)
CREATE TABLE public.forum_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id),
  CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Forum posts policies
CREATE POLICY "Forum posts are viewable by authenticated users" ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Forum replies policies
CREATE POLICY "Forum replies are viewable by authenticated users" ON public.forum_replies
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum replies" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies" ON public.forum_replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies" ON public.forum_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Forum votes policies
CREATE POLICY "Votes are viewable by authenticated users" ON public.forum_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON public.forum_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.forum_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policy for notifications (to create notifications for users)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for resources (admin/moderator only)
CREATE POLICY "Resources are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

CREATE POLICY "Admins can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resources' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')));

CREATE POLICY "Admins can update resources" ON storage.objects
  FOR UPDATE USING (bucket_id = 'resources' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')));

CREATE POLICY "Admins can delete resources" ON storage.objects
  FOR DELETE USING (bucket_id = 'resources' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')));

-- Storage policies for events (admin/moderator only)
CREATE POLICY "Event images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "Admins can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'events' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')));

CREATE POLICY "Admins can update event images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'events' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')));

CREATE POLICY "Admins can delete event images" ON storage.objects
  FOR DELETE USING (bucket_id = 'events' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')));

-- Create indexes for performance
CREATE INDEX idx_forum_posts_user_id ON public.forum_posts(user_id);
CREATE INDEX idx_forum_posts_category ON public.forum_posts(category);
CREATE INDEX idx_forum_replies_post_id ON public.forum_replies(post_id);
CREATE INDEX idx_forum_votes_post_id ON public.forum_votes(post_id);
CREATE INDEX idx_forum_votes_reply_id ON public.forum_votes(reply_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;