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
  Bot,
  MessageSquare,
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

        // Fetch active announcements (notices)
        const { data: announcementsData } = await supabase
          .from("announcements")
          .select("id, title, content, priority, is_pinned, created_at")
          .or("expires_at.is.null,expires_at.gt.now()")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5);

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
      color: "from-primary to-accent",
      href: "/dashboard/events",
    },
    {
      title: "Study Resources",
      value: stats.resourcesCount,
      icon: BookOpen,
      color: "from-orange-500 to-primary",
      href: "/dashboard/resources",
    },
    {
      title: "Performance XP",
      value: stats.xpPoints,
      icon: TrendingUp,
      color: "from-accent to-primary",
      href: "/dashboard/achievements",
    },
    {
      title: "Current Level",
      value: stats.level,
      icon: Trophy,
      color: "from-primary to-primary",
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

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-primary bg-primary/10";
      case "low":
        return "border-l-muted-foreground bg-muted/20";
      default:
        return "border-l-accent bg-accent/10";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Modern Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden glass rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 border border-border"
        >
          <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 rounded-full blur-[100px] -mr-16 sm:-mr-32 -mt-16 sm:-mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-accent/20 rounded-full blur-[80px] -ml-12 sm:-ml-24 -mb-12 sm:-mb-24" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-8">
            <div className="space-y-3 sm:space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest">AI Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">
                Welcome back, <br className="hidden sm:block" />
                <span className="text-gradient">{user?.user_metadata?.full_name?.split(" ")[0] || "Member"}!</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg font-medium leading-relaxed">
                You've earned <span className="text-primary font-bold">{stats.xpPoints} XP</span> this week.
                <span className="hidden sm:inline"> Keep pushing to reach level {stats.level + 1}!</span>
              </p>
            </div>

            <Link to="/dashboard/ai-assistant" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-10 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-sm sm:text-lg shadow-2xl shadow-primary/30 transition-all active:scale-95 group">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:rotate-12 transition-transform" />
                Talk to AI
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={stat.href}>
                <div className="glass-card h-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group relative overflow-hidden">
                  {/* Subtle Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 sm:mb-6 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors line-clamp-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl sm:text-4xl font-black text-foreground tracking-tighter">
                      {loading ? (
                        <span className="inline-block w-6 h-6 sm:w-8 sm:h-8 bg-muted animate-pulse rounded" />
                      ) : stat.value}
                    </p>
                  </div>

                  {/* Icon Mini Decor */}
                  <div className="absolute -right-2 sm:-right-4 -bottom-2 sm:-bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <stat.icon size={60} strokeWidth={1} className="sm:w-[100px] sm:h-[100px]" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Main Interface Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Upcoming Events - Focused UI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 glass-card rounded-2xl sm:rounded-[2.5rem] border border-border p-5 sm:p-8"
          >
            <div className="flex items-center justify-between mb-5 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <h2 className="text-base sm:text-xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-2 sm:decoration-4 underline-offset-4 sm:underline-offset-8">
                  Upcoming Events
                </h2>
              </div>
              <Link to="/dashboard/events">
                <Button variant="ghost" size="sm" className="rounded-lg sm:rounded-xl hover:bg-muted font-bold text-xs sm:text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">View Schedule</span>
                  <span className="sm:hidden">View</span>
                </Button>
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-20 sm:h-24 glass rounded-2xl sm:rounded-3xl animate-pulse" />
                ))
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8 sm:py-12 glass rounded-2xl sm:rounded-3xl border border-dashed border-white/10">
                  <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground font-medium text-sm sm:text-base">Clear schedule for now</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    whileHover={{ x: 8 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-muted/50 border border-border hover:bg-muted transition-all group"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <span className="text-xl sm:text-2xl">📅</span>
                    </div>

                    <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1 sm:gap-1.5 bg-background/50 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {formatDate(event.start_date)}
                        </span>
                        <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-primary/10 text-primary">
                          <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="truncate max-w-[80px] sm:max-w-none">{event.location || "Online"}</span>
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="rounded-lg sm:rounded-xl h-9 sm:h-12 px-4 sm:px-6 border-border hover:border-primary active:scale-95 transition-all w-full sm:w-auto">
                      Details
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Actions & Announcements */}
          <div className="space-y-5 sm:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="glass-card rounded-2xl sm:rounded-[2.5rem] border border-border p-5 sm:p-8"
            >
              <h2 className="text-base sm:text-xl font-black text-foreground tracking-tight underline elevation-1 decoration-accent/30 decoration-2 sm:decoration-4 underline-offset-4 sm:underline-offset-8 mb-5 sm:mb-8">
                Quick Hub
              </h2>

              <div className="grid gap-3 sm:gap-4">
                {[
                  { title: "Smart Resources", sub: "Explore curriculum", icon: BookOpen, color: "bg-primary", href: "/dashboard/resources" },
                  { title: "Student Connect", sub: "Peer networking", icon: Users, color: "bg-accent", href: "/dashboard/community" },
                  { title: "Forum Discussions", sub: "Join the talk", icon: MessageSquare, color: "bg-muted", href: "/dashboard/forum" }
                ].map((action, i) => (
                  <Link key={i} to={action.href} className="group">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-muted/50 border border-border hover:bg-primary/10 hover:border-primary/20 transition-all duration-300">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm sm:text-base truncate">{action.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{action.sub}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Notices Widget */}
            {announcements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="glass-card rounded-2xl sm:rounded-[2.5rem] border border-border p-5 sm:p-8"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h2 className="text-sm sm:text-lg font-black text-foreground tracking-tight uppercase tracking-wider">Notices</h2>
                  </div>
                  <Link to="../notice">
                    <Button variant="ghost" size="sm" className="rounded-lg sm:rounded-xl hover:bg-muted font-bold text-[10px] sm:text-xs px-2 sm:px-3">
                      View All
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {announcements.slice(0, 3).map((ann) => (
                    <div
                      key={ann.id}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-l-4 sm:border-l-[6px] ${getPriorityStyles(ann.priority)} transition-colors hover:shadow-md`}
                    >
                      <h3 className="font-bold text-xs sm:text-sm text-foreground mb-1 flex items-center gap-1.5 sm:gap-2">
                        {ann.is_pinned && <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary fill-primary flex-shrink-0" />}
                        <span className="line-clamp-1">{ann.title}</span>
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium line-clamp-2">
                        {ann.content}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-1.5 sm:mt-2">
                        {formatDate(ann.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
