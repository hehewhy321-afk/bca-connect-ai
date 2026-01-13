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
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
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
  content: string;
  upvotes: number;
  is_solution: boolean;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
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
        .order("is_solution", { ascending: false })
        .order("upvotes", { ascending: false })
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
      }));

      setReplies(repliesWithAuthors || []);
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
        await supabase
          .from("forum_votes")
          .delete()
          .eq("user_id", user.id)
          .eq(type === "post" ? "post_id" : "reply_id", targetId);

        setUserVotes((prev) => {
          const newVotes = { ...prev };
          delete newVotes[voteKey];
          return newVotes;
        });

        // Update upvotes count
        if (type === "post") {
          setPost((prev) =>
            prev ? { ...prev, upvotes: prev.upvotes - voteType } : prev
          );
        } else {
          setReplies((prev) =>
            prev.map((r) =>
              r.id === targetId ? { ...r, upvotes: r.upvotes - voteType } : r
            )
          );
        }
      } else {
        // Add or change vote
        const voteData: any = {
          user_id: user.id,
          vote_type: voteType,
        };
        if (type === "post") voteData.post_id = targetId;
        else voteData.reply_id = targetId;

        if (existingVote) {
          await supabase
            .from("forum_votes")
            .delete()
            .eq("user_id", user.id)
            .eq(type === "post" ? "post_id" : "reply_id", targetId);
        }

        await supabase.from("forum_votes").insert(voteData);

        setUserVotes((prev) => ({ ...prev, [voteKey]: voteType }));

        const diff = existingVote ? voteType - existingVote : voteType;
        if (type === "post") {
          setPost((prev) =>
            prev ? { ...prev, upvotes: prev.upvotes + diff } : prev
          );
        } else {
          setReplies((prev) =>
            prev.map((r) =>
              r.id === targetId ? { ...r, upvotes: r.upvotes + diff } : r
            )
          );
        }
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !replyContent.trim() || !id) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("forum_replies")
        .insert({
          post_id: id,
          user_id: user.id,
          content: replyContent.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch author info
      const { data: authorData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      setReplies((prev) => [...prev, { ...data, author: authorData }]);
      setReplyContent("");
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
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex gap-4">
            {/* Votes */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleVote("post", post.id, 1)}
                className={`p-1 rounded hover:bg-muted transition-colors ${
                  userVotes[`post_${post.id}`] === 1 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <ArrowUp className="w-6 h-6" />
              </button>
              <span className="font-bold text-lg text-foreground">
                {post.upvotes}
              </span>
              <button
                onClick={() => handleVote("post", post.id, -1)}
                className={`p-1 rounded hover:bg-muted transition-colors ${
                  userVotes[`post_${post.id}`] === -1 ? "text-secondary" : "text-muted-foreground"
                }`}
              >
                <ArrowDown className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start gap-2 mb-4">
                {post.is_pinned && <Pin className="w-5 h-5 text-primary" />}
                {post.is_locked && <Lock className="w-5 h-5 text-muted-foreground" />}
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {post.title}
                </h1>
              </div>

              <div className="prose prose-sm max-w-none text-foreground mb-6">
                <MarkdownRenderer content={post.content} />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
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

              {/* Meta */}
              <div className="flex items-center gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm">
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
                  <span>{post.author?.full_name || "Anonymous"}</span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.views} views
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {replies.length} Replies
          </h2>

          {replies.map((reply, index) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card rounded-2xl border p-5 ${
                reply.is_solution
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-border"
              }`}
            >
              <div className="flex gap-4">
                {/* Votes */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleVote("reply", reply.id, 1)}
                    className={`p-1 rounded hover:bg-muted transition-colors ${
                      userVotes[`reply_${reply.id}`] === 1
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <span className="font-medium text-foreground">
                    {reply.upvotes}
                  </span>
                  <button
                    onClick={() => handleVote("reply", reply.id, -1)}
                    className={`p-1 rounded hover:bg-muted transition-colors ${
                      userVotes[`reply_${reply.id}`] === -1
                        ? "text-secondary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1">
                  {reply.is_solution && (
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Accepted Solution
                      </span>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none text-foreground">
                    <MarkdownRenderer content={reply.content} />
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs">
                        {reply.author?.avatar_url ? (
                          <img
                            src={reply.author.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(reply.author?.full_name)
                        )}
                      </div>
                      <span>{reply.author?.full_name || "Anonymous"}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reply Form */}
        {!post.is_locked && user && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">
              Your Reply
            </h3>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply... (Markdown supported)"
              rows={5}
              className="mb-4"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Supports Markdown formatting
              </p>
              <Button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || submitting}
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
