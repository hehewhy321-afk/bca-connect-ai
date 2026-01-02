import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, ArrowLeft, Pin, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function Notice() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-destructive/50 bg-destructive/5";
      case "medium":
        return "border-accent/50 bg-accent/5";
      default:
        return "border-border bg-card";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "medium":
        return <Info className="w-5 h-5 text-accent" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Notices & Announcements
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay updated with the latest news, announcements, and important notices from BCA Association MMAMC.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Notices List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                No Notices Available
              </h3>
              <p className="text-muted-foreground">
                There are no notices or announcements at this time.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {notices.map((notice, index) => (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${getPriorityStyles(
                    notice.priority
                  )}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getPriorityIcon(notice.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}
                        {notice.priority === "high" && (
                          <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                            Important
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                        {notice.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(notice.created_at), "MMMM d, yyyy")}
                        </span>
                        {notice.expires_at && (
                          <span className="text-accent">
                            Expires: {format(new Date(notice.expires_at), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
