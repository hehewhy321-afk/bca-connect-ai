import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Search,
  ArrowUp,
  Eye,
  MessageCircle,
  Pin,
  Lock,
  Clock,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
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
  reply_count?: number;
}

const categories = [
  { value: "all", label: "All Topics" },
  { value: "general", label: "General Discussion" },
  { value: "programming", label: "Programming" },
  { value: "database", label: "Database" },
  { value: "networking", label: "Networking" },
  { value: "projects", label: "Projects" },
  { value: "career", label: "Career & Jobs" },
  { value: "exams", label: "Exams & Study" },
];

const categoryColors: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  programming: "bg-primary/10 text-primary",
  database: "bg-accent/10 text-accent",
  networking: "bg-secondary/10 text-secondary",
  projects: "bg-primary/10 text-primary",
  career: "bg-accent/10 text-accent",
  exams: "bg-secondary/10 text-secondary",
};

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch authors for posts
      const userIds = [...new Set(postsData?.map((p) => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      // Fetch reply counts
      const postIds = postsData?.map((p) => p.id) || [];
      const { data: replyCounts } = await supabase
        .from("forum_replies")
        .select("post_id")
        .in("post_id", postIds);

      const replyCountMap: Record<string, number> = {};
      replyCounts?.forEach((r) => {
        replyCountMap[r.post_id] = (replyCountMap[r.post_id] || 0) + 1;
      });

      const profilesMap: Record<string, any> = {};
      profiles?.forEach((p) => {
        profilesMap[p.user_id] = p;
      });

      const postsWithAuthors = postsData?.map((post) => ({
        ...post,
        author: profilesMap[post.user_id],
        reply_count: replyCountMap[post.id] || 0,
      }));

      setPosts(postsWithAuthors || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone and will also delete all replies."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });

      // Refresh posts
      await fetchPosts();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              Discussion Forum
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ask questions, share knowledge, and connect with peers.
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard/forum/new")} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Discussion
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-32 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-foreground mb-2">
              No discussions found
            </h3>
            <p className="text-muted-foreground mb-4">
              Be the first to start a discussion!
            </p>
            <Button onClick={() => navigate("/dashboard/forum/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Start Discussion
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Link to={`/dashboard/forum/${post.id}`}>
                  <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Votes - Hidden on mobile, shown on larger screens */}
                      <div className="hidden sm:flex flex-col items-center gap-1 text-center">
                        <ArrowUp className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {post.upvotes}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          {post.is_pinned && (
                            <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          )}
                          {post.is_locked && (
                            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <h3 className="font-heading font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1 text-sm sm:text-base">
                            {post.title}
                          </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.content.replace(/[#*`]/g, "").slice(0, 150)}...
                        </p>

                        {/* Tags and Stats - Stacked on mobile */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                categoryColors[post.category] || categoryColors.general
                              }`}
                            >
                              {post.category}
                            </span>

                            {post.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Stats - Inline on mobile with votes */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground sm:ml-auto">
                            {/* Mobile-only upvote display */}
                            <span className="flex sm:hidden items-center gap-1">
                              <ArrowUp className="w-3 h-3" />
                              {post.upvotes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {post.reply_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views}
                            </span>
                          </div>
                        </div>

                        {/* Author & Time - Responsive layout */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-[10px] sm:text-xs flex-shrink-0">
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
                          <span className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-none">
                            {post.author?.full_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
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
                          
                          {/* Delete Button - Only show to post owner */}
                          {user && post.user_id === user.id && (
                            <button
                              onClick={(e) => handleDeletePost(post.id, e)}
                              className="ml-auto text-destructive hover:text-destructive/80 transition-colors p-1 rounded hover:bg-destructive/10"
                              title="Delete post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
