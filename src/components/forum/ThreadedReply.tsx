import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { formatDistanceToNow } from "date-fns";

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

interface ThreadedReplyProps {
  reply: Reply;
  depth: number;
  userVotes: Record<string, number>;
  currentUserId?: string;
  onVote: (replyId: string, voteType: number) => void;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete?: (replyId: string) => Promise<void>;
}

export function ThreadedReply({
  reply,
  depth,
  userVotes,
  currentUserId,
  onVote,
  onReply,
  onDelete,
}: ThreadedReplyProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const hasChildren = reply.children && reply.children.length > 0;
  const maxDepth = 6; // Maximum nesting level

  // Get preview of parent content (first 100 chars)
  const getContentPreview = (content: string) => {
    const plainText = content.replace(/[#*`_~\[\]()]/g, '').trim();
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
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

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await onReply(reply.id, replyContent.trim());
      setReplyContent("");
      setShowReplyForm(false);
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate left border color based on depth
  const borderColors = [
    "border-l-blue-500",
    "border-l-green-500",
    "border-l-yellow-500",
    "border-l-purple-500",
    "border-l-pink-500",
    "border-l-orange-500",
  ];
  const borderColor = borderColors[depth % borderColors.length];

  return (
    <div className={`${depth > 0 ? "ml-3 sm:ml-8 mt-2 sm:mt-3" : ""}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`bg-card rounded-xl border ${
          reply.is_solution
            ? "border-green-500/50 bg-green-500/5"
            : "border-border"
        } p-3 sm:p-4 ${depth > 0 ? `border-l-4 ${borderColor}` : ""}`}
      >
        <div className="flex gap-2 sm:gap-3">
          {/* Votes */}
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => onVote(reply.id, 1)}
              className={`p-0.5 sm:p-1 rounded hover:bg-muted transition-colors ${
                userVotes[`reply_${reply.id}`] === 1
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <span className="font-medium text-xs sm:text-sm text-foreground">
              {reply.upvotes}
            </span>
            <button
              onClick={() => onVote(reply.id, -1)}
              className={`p-0.5 sm:p-1 rounded hover:bg-muted transition-colors ${
                userVotes[`reply_${reply.id}`] === -1
                  ? "text-secondary"
                  : "text-muted-foreground"
              }`}
            >
              <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header - Wrap on mobile */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-[10px] sm:text-xs flex-shrink-0">
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
              <span className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[80px] sm:max-w-none">
                {reply.author?.full_name || "Anonymous"}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(reply.created_at), {
                  addSuffix: false,
                })}
              </span>
              {reply.is_solution && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Solution</span>
                </div>
              )}
              {hasChildren && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                  title={collapsed ? "Expand replies" : "Collapse replies"}
                >
                  {collapsed ? (
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Content - Always visible */}
            <div className="prose prose-sm max-w-none text-foreground mb-2 sm:mb-3 text-xs sm:text-sm overflow-x-auto">
              <MarkdownRenderer content={reply.content} />
            </div>

            {/* Actions - Always visible */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {currentUserId && depth < maxDepth && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  Reply
                </button>
              )}
              {hasChildren && (
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {(() => {
                    // Count all nested replies
                    const countNested = (children: Reply[]): number => {
                      return children.reduce((count, child) => {
                        return count + 1 + (child.children ? countNested(child.children) : 0);
                      }, 0);
                    };
                    const total = countNested(reply.children!);
                    return `${total} ${total === 1 ? "reply" : "replies"}`;
                  })()}
                </span>
              )}
              {currentUserId && reply.user_id === currentUserId && onDelete && (
                <button
                  onClick={() => onDelete(reply.id)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-destructive hover:text-destructive/80 transition-colors ml-auto"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>

            {/* Reply Form - Always visible when active */}
            <AnimatePresence>
              {showReplyForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {/* Reply Preview */}
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs flex-shrink-0">
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
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          Replying to {reply.author?.full_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {getContentPreview(reply.content)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || submitting}
                      size="sm"
                    >
                      {submitting ? "Posting..." : "Post"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Nested Replies */}
      {!collapsed && hasChildren && (
        <div className="space-y-0">
          {reply.children!.map((childReply) => (
            <ThreadedReply
              key={childReply.id}
              reply={childReply}
              depth={depth + 1}
              userVotes={userVotes}
              currentUserId={currentUserId}
              onVote={onVote}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
