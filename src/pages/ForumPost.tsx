import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Clock,
  Eye,
  Send,
  Pin,
  Lock,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { ThreadedReply } from "@/components/forum/ThreadedReply";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface Reply {
  id: string;
  user_id: string;
  parent_reply_id: string | null;
  content: string;
  upvotes: number;
  is_solution: boolean;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
  children?: Reply[];
}

export default function ForumPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id) {
      fetchPost();
      incrementViews();
      if (user) fetchUserVotes();
    }
  }, [id, user]);

  const fetchPost = async () => {
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (postError) throw postError;

      // Fetch author
      const { data: authorData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", postData.user_id)
        .single();

      setPost({ ...postData, author: authorData });

      // Fetch replies
      const { data: repliesData } = await supabase
        .from("forum_replies")
        .select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: true });

      // Fetch reply authors
      const replyUserIds = [...new Set(repliesData?.map((r) => r.user_id) || [])];
      const { data: replyAuthors } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", replyUserIds);

      const authorsMap: Record<string, any> = {};
      replyAuthors?.forEach((a) => {
        authorsMap[a.user_id] = a;
      });

      const repliesWithAuthors = repliesData?.map((r) => ({
        ...r,
        author: authorsMap[r.user_id],
        children: [],
      })) || [];

      // Build tree structure
      const repliesMap: Record<string, Reply> = {};
      const rootReplies: Reply[] = [];

      repliesWithAuthors.forEach((reply) => {
        repliesMap[reply.id] = reply;
      });

      repliesWithAuthors.forEach((reply) => {
        if (reply.parent_reply_id && repliesMap[reply.parent_reply_id]) {
          repliesMap[reply.parent_reply_id].children!.push(reply);
        } else {
          rootReplies.push(reply);
        }
      });

      setReplies(rootReplies);
    } catch (error) {
      console.error("Error fetching post:", error);
      navigate("/dashboard/forum");
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    // Update views directly
    if (post) {
      await supabase
        .from("forum_posts")
        .update({ views: post.views + 1 })
        .eq("id", id);
    }
  };

  const fetchUserVotes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("forum_votes")
      .select("post_id, reply_id, vote_type")
      .eq("user_id", user.id);

    const votes: Record<string, number> = {};
    data?.forEach((v) => {
      if (v.post_id) votes[`post_${v.post_id}`] = v.vote_type;
      if (v.reply_id) votes[`reply_${v.reply_id}`] = v.vote_type;
    });
    setUserVotes(votes);
  };

  const handleVote = async (type: "post" | "reply", targetId: string, voteType: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote.",
        variant: "destructive",
      });
      return;
    }

    const voteKey = `${type}_${targetId}`;
    const existingVote = userVotes[voteKey];

    try {
      if (existingVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from("forum_votes")
          .delete()
          .eq("user_id", user.id)
          .eq(type === "post" ? "post_id" : "reply_id", targetId);

        if (error) throw error;

        setUserVotes((prev) => {
          const newVotes = { ...prev };
          delete newVotes[voteKey];
          return newVotes;
        });
      } else {
        // Add or change vote
        const voteData: any = {
          user_id: user.id,
          vote_type: voteType,
        };
        if (type === "post") voteData.post_id = targetId;
        else voteData.reply_id = targetId;

        if (existingVote) {
          // Update existing vote
          const { error } = await supabase
            .from("forum_votes")
            .update({ vote_type: voteType })
            .eq("user_id", user.id)
            .eq(type === "post" ? "post_id" : "reply_id", targetId);

          if (error) throw error;
        } else {
          // Insert new vote
          const { error } = await supabase.from("forum_votes").insert(voteData);
          if (error) throw error;
        }

        setUserVotes((prev) => ({ ...prev, [voteKey]: voteType }));
      }

      // Refresh data to get updated counts from database
      await fetchPost();

      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully.",
      });
    } catch (error: any) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReply = async (parentReplyId: string | null = null, content?: string) => {
    if (!user || !id) return;
    
    const replyText = content || replyContent.trim();
    if (!replyText) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("forum_replies")
        .insert({
          post_id: id,
          user_id: user.id,
          parent_reply_id: parentReplyId,
          content: replyText,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh replies to rebuild tree
      await fetchPost();
      
      if (!parentReplyId) {
        setReplyContent("");
      }
      
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      });
    } catch (error) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post || post.user_id !== user.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone and will also delete all replies."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });

      navigate("/dashboard/forum");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this reply? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("forum_replies")
        .delete()
        .eq("id", replyId);

      if (error) throw error;

      toast({
        title: "Reply deleted",
        description: "Your reply has been deleted successfully.",
      });

      // Refresh to rebuild tree
      await fetchPost();
    } catch (error: any) {
      console.error("Error deleting reply:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-64 bg-card rounded-2xl border border-border" />
        </div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Post not found</h2>
          <Link to="/dashboard/forum">
            <Button className="mt-4">Back to Forum</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          to="/dashboard/forum"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </Link>

        {/* Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Votes - Horizontal on mobile, vertical on desktop */}
            <div className="flex sm:flex-col items-center gap-2 sm:gap-1 order-2 sm:order-1">
              <button
                onClick={() => handleVote("post", post.id, 1)}
                className={`p-1.5 sm:p-1 rounded hover:bg-muted transition-colors ${
                  userVotes[`post_${post.id}`] === 1 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <span className="font-bold text-base sm:text-lg text-foreground min-w-[2rem] text-center">
                {post.upvotes}
              </span>
              <button
                onClick={() => handleVote("post", post.id, -1)}
                className={`p-1.5 sm:p-1 rounded hover:bg-muted transition-colors ${
                  userVotes[`post_${post.id}`] === -1 ? "text-secondary" : "text-muted-foreground"
                }`}
              >
                <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              {/* Mobile stats inline with votes */}
              <div className="flex sm:hidden items-center gap-3 ml-auto text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 order-1 sm:order-2">
              <div className="flex items-start gap-2 mb-3 sm:mb-4">
                {post.is_pinned && <Pin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />}
                {post.is_locked && <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
                <h1 className="font-heading text-lg sm:text-2xl font-bold text-foreground leading-tight">
                  {post.title}
                </h1>
              </div>

              <div className="prose prose-sm max-w-none text-foreground mb-4 sm:mb-6 overflow-x-auto">
                <MarkdownRenderer content={post.content} />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                  {post.category}
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Meta - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs sm:text-sm flex-shrink-0">
                      {post.author?.avatar_url ? (
                        <img
                          src={post.author.avatar_url}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(post.author?.full_name)
                      )}
                    </div>
                    <span className="truncate max-w-[120px] sm:max-w-none">{post.author?.full_name || "Anonymous"}</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="sm:hidden">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: false,
                      })}
                    </span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.views} views
                  </span>
                </div>
                
                {/* Delete Button - Only show to post owner */}
                {user && post.user_id === user.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeletePost}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {(() => {
              // Count all replies including nested ones
              const countReplies = (replyList: Reply[]): number => {
                return replyList.reduce((count, reply) => {
                  return count + 1 + (reply.children ? countReplies(reply.children) : 0);
                }, 0);
              };
              const totalReplies = countReplies(replies);
              return `${totalReplies} ${totalReplies === 1 ? "Reply" : "Replies"}`;
            })()}
          </h2>

          <div className="space-y-3">
            {replies.map((reply) => (
              <ThreadedReply
                key={reply.id}
                reply={reply}
                depth={0}
                userVotes={userVotes}
                currentUserId={user?.id}
                onVote={(replyId, voteType) => handleVote("reply", replyId, voteType)}
                onReply={handleSubmitReply}
                onDelete={handleDeleteReply}
              />
            ))}
          </div>
        </div>

        {/* Reply Form */}
        {!post.is_locked && user && (
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
            <h3 className="font-heading font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
              Your Reply
            </h3>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply... (Markdown supported)"
              rows={4}
              className="mb-3 sm:mb-4 text-sm"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground order-2 sm:order-1">
                Supports Markdown formatting
              </p>
              <Button
                onClick={() => handleSubmitReply(null)}
                disabled={!replyContent.trim() || submitting}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </div>
        )}

        {post.is_locked && (
          <div className="bg-muted rounded-2xl p-6 text-center">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              This discussion has been locked.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
