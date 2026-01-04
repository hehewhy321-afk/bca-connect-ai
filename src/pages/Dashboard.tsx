import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Megaphone,
  Pin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  eventsCount: number;
  resourcesCount: number;
  xpPoints: number;
  level: number;
}

interface Event {
  id: string;
  title: string;
  start_date: string;
  category: string;
  location: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    eventsCount: 0,
    resourcesCount: 0,
    xpPoints: 0,
    level: 1,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp_points, level")
          .eq("user_id", user.id)
          .maybeSingle();

        // Fetch events count
        const { count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "upcoming");

        // Fetch resources count
        const { count: resourcesCount } = await supabase
          .from("resources")
          .select("*", { count: "exact", head: true });

        // Fetch upcoming events
        const { data: events } = await supabase
          .from("events")
          .select("id, title, start_date, category, location")
          .eq("status", "upcoming")
          .order("start_date", { ascending: true })
          .limit(3);

        // Fetch active announcements
        const { data: announcementsData } = await supabase
          .from("announcements")
          .select("id, title, content, priority, is_pinned, created_at")
          .or("expires_at.is.null,expires_at.gt.now()")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(3);

        setStats({
          eventsCount: eventsCount || 0,
          resourcesCount: resourcesCount || 0,
          xpPoints: profile?.xp_points || 0,
          level: profile?.level || 1,
        });

        setUpcomingEvents(events || []);
        setAnnouncements(announcementsData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const statCards = [
    {
      title: "Upcoming Events",
      value: stats.eventsCount,
      icon: Calendar,
      color: "from-primary to-primary/70",
      href: "/dashboard/events",
    },
    {
      title: "Resources",
      value: stats.resourcesCount,
      icon: BookOpen,
      color: "from-accent to-accent/70",
      href: "/dashboard/resources",
    },
    {
      title: "XP Points",
      value: stats.xpPoints,
      icon: TrendingUp,
      color: "from-secondary to-secondary/70",
      href: "/dashboard/achievements",
    },
    {
      title: "Level",
      value: stats.level,
      icon: Trophy,
      color: "from-primary to-accent",
      href: "/dashboard/achievements",
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-destructive bg-destructive/5";
      case "low":
        return "border-l-muted-foreground bg-muted/50";
      default:
        return "border-l-primary bg-primary/5";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 md:p-8 text-primary-foreground"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">
                Welcome back, {user?.user_metadata?.full_name || "Member"}! 👋
              </h1>
              <p className="text-primary-foreground/80">
                Ready to learn something new today? Check out your personalized
                dashboard.
              </p>
            </div>
            <Link to="/dashboard/ai-assistant">
              <Button variant="hero" size="lg" className="group">
                <Sparkles className="w-5 h-5" />
                Ask AI Assistant
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={stat.href}>
                <div className="bg-card rounded-2xl p-5 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="font-heading text-2xl font-bold text-foreground">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Upcoming Events
              </h2>
              <Link to="/dashboard/events">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No upcoming events at the moment.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            {formatDate(event.start_date)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {event.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto mt-2 sm:mt-0">
                      Register
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions & Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="font-heading text-lg font-semibold text-foreground mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link to="/dashboard/ai-assistant" className="block">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">
                      Get study help
                    </p>
                  </div>
                </div>
              </Link>
              <Link to="/dashboard/resources" className="block">
                <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Browse Resources</p>
                    <p className="text-xs text-muted-foreground">
                      Study materials
                    </p>
                  </div>
                </div>
              </Link>
              <Link to="/dashboard/community" className="block">
                <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Community</p>
                    <p className="text-xs text-muted-foreground">
                      Connect with peers
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Announcements
              </h2>
            </div>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-xl border-l-4 ${getPriorityColor(announcement.priority || "normal")}`}
                >
                  <div className="flex items-start gap-2">
                    {announcement.is_pinned && (
                      <Pin className="w-4 h-4 text-primary fill-primary flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(announcement.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
