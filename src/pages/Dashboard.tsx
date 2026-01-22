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
  ChevronRight,
  Zap,
  Download,
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
  const [appDownloadUrl, setAppDownloadUrl] = useState(
    "https://github.com/hehewhy321-afk/bca-connect-ai-app/releases/download/v1.2.0/BCA-Association-v1.2.0.apk"
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp_points, level")
          .eq("user_id", user.id)
          .maybeSingle();

        // Fetch app download link
        const { data: settingsData } = await supabase
          .from("website_settings")
          .select("setting_value")
          .eq("setting_key", "app_download_link")
          .maybeSingle();

        if (settingsData?.setting_value) {
          const url = settingsData.setting_value;
          setAppDownloadUrl(url.startsWith("http") ? url : `https://${url}`);
        }

        const { count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "upcoming");
        const { count: resourcesCount } = await supabase
          .from("resources")
          .select("*", { count: "exact", head: true });
        const { data: events } = await supabase
          .from("events")
          .select("id, title, start_date, category, location")
          .eq("status", "upcoming")
          .order("start_date", { ascending: true })
          .limit(3);
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
        if (import.meta.env.DEV) {
          console.error("Error fetching dashboard data:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const statCards = [
    { title: "Events", value: stats.eventsCount, icon: Calendar, color: "from-primary to-accent", href: "/dashboard/events" },
    { title: "Resources", value: stats.resourcesCount, icon: BookOpen, color: "from-orange-500 to-primary", href: "/dashboard/resources" },
    { title: "XP Points", value: stats.xpPoints, icon: TrendingUp, color: "from-accent to-primary", href: "/dashboard/achievements" },
    { title: "Level", value: stats.level, icon: Trophy, color: "from-primary to-primary", href: "/dashboard/achievements" },
  ];

  const quickActions = [
    { title: "Resources", icon: BookOpen, color: "bg-blue-500", href: "/dashboard/resources" },
    { title: "Community", icon: Users, color: "bg-green-500", href: "/dashboard/community" },
    { title: "Forum", icon: MessageSquare, color: "bg-purple-500", href: "/dashboard/forum" },
    { title: "Events", icon: Calendar, color: "bg-orange-500", href: "/dashboard/events" },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-primary bg-primary/10";
      case "low": return "border-l-muted-foreground bg-muted/20";
      default: return "border-l-accent bg-accent/10";
    }
  };

  return (
    <DashboardLayout>
      {/* MOBILE LAYOUT */}
      <div className="sm:hidden space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent rounded-2xl p-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <p className="text-primary-foreground/80 text-xs font-medium">Welcome back</p>
            <h1 className="text-xl font-black text-primary-foreground mt-0.5">{user?.user_metadata?.full_name?.split(" ")[0] || "Member"} 👋</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                <Zap className="w-3 h-3 text-yellow-300" />
                <span className="text-xs font-bold text-primary-foreground">{stats.xpPoints} XP</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                <Trophy className="w-3 h-3 text-yellow-300" />
                <span className="text-xs font-bold text-primary-foreground">Level {stats.level}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <Link to="/dashboard/ai-assistant">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">AI Assistant</p>
                <p className="text-[10px] text-muted-foreground">Ask anything</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-4 gap-2">
          {quickActions.map((action, i) => (
            <Link key={i} to={action.href}>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-card border border-border rounded-xl active:scale-95 transition-transform">
                <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-foreground">{action.title}</span>
              </div>
            </Link>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.href} className="flex-shrink-0">
              <div className="w-[100px] p-3 bg-card border border-border rounded-xl">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                  <stat.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-lg font-black text-foreground">{loading ? "-" : stat.value}</p>
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide line-clamp-1">{stat.title}</p>
              </div>
            </Link>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground text-sm">Upcoming</h2>
            </div>
            <Link to="/dashboard/events" className="text-[10px] font-semibold text-primary">See all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 2).map((event) => (
                <Link key={event.id} to="/dashboard/events">
                  <div className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg active:bg-muted transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><span className="text-base">📅</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-xs line-clamp-1">{event.title}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" />{formatDateShort(event.start_date)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {announcements.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm">Notices</h2>
              </div>
              <Link to="../notice" className="text-[10px] font-semibold text-primary">See all</Link>
            </div>
            <div className="space-y-2">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className={`p-2.5 rounded-lg border-l-3 ${getPriorityStyles(ann.priority)}`}>
                  <div className="flex items-start gap-1.5">
                    {ann.is_pinned && <Pin className="w-2.5 h-2.5 text-primary fill-primary flex-shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs line-clamp-1">{ann.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{ann.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:block space-y-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="relative overflow-hidden glass rounded-[2.5rem] p-8 md:p-12 border border-border">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -ml-24 -mb-24" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-primary uppercase tracking-widest">Personalized AI Dashboard</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">
                Welcome back, <br />
                <span className="text-gradient">{user?.user_metadata?.full_name?.split(" ")[0] || "Member"}!</span>
              </h1>
              <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                You've earned <span className="text-primary font-bold">{stats.xpPoints} XP</span> this week. Keep pushing to reach level {stats.level + 1}!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={appDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="h-16 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 font-black text-lg shadow-2xl shadow-orange-500/20 transition-all active:scale-95 group border-0">
                  <Download className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  Get App
                </Button>
              </a>
              <Link to="/dashboard/ai-assistant">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg shadow-2xl shadow-primary/30 transition-all active:scale-95 group">
                  <Bot className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Talk to AI
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Upcoming Events", value: stats.eventsCount, icon: Calendar, color: "from-primary to-accent", href: "/dashboard/events" },
            { title: "Study Resources", value: stats.resourcesCount, icon: BookOpen, color: "from-orange-500 to-primary", href: "/dashboard/resources" },
            { title: "Performance XP", value: stats.xpPoints, icon: TrendingUp, color: "from-accent to-primary", href: "/dashboard/achievements" },
            { title: "Current Level", value: stats.level, icon: Trophy, color: "from-primary to-primary", href: "/dashboard/achievements" },
          ].map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Link to={stat.href}>
                <div className="glass-card h-full rounded-3xl p-6 border border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{stat.title}</p>
                    <p className="text-4xl font-black text-foreground tracking-tighter">{loading ? <span className="inline-block w-8 h-8 bg-muted animate-pulse rounded" /> : stat.value}</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><stat.icon size={100} strokeWidth={1} /></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="lg:col-span-2 glass-card rounded-[2.5rem] border border-border p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20"><Calendar className="w-5 h-5 text-primary" /></div>
                <h2 className="text-xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">Upcoming Events</h2>
              </div>
              <Link to="/dashboard/events"><Button variant="ghost" className="rounded-xl hover:bg-muted font-bold">View Schedule</Button></Link>
            </div>
            <div className="space-y-4">
              {loading ? [1, 2, 3].map((i) => <div key={i} className="h-24 glass rounded-3xl animate-pulse" />) : upcomingEvents.length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-dashed border-white/10">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Clear schedule for now</p>
                </div>
              ) : upcomingEvents.map((event) => (
                <motion.div key={event.id} whileHover={{ x: 8 }} className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-3xl bg-muted/50 border border-border hover:bg-muted transition-all group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors"><span className="text-2xl">📅</span></div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-lg"><Clock className="w-4 h-4" />{formatDate(event.start_date)}</span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary"><Pin className="w-3 h-3" />{event.location || "Online"}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl h-12 px-6 border-border hover:border-primary active:scale-95 transition-all">Details</Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="glass-card rounded-[2.5rem] border border-border p-8">
              <h2 className="text-xl font-black text-foreground tracking-tight underline elevation-1 decoration-accent/30 decoration-4 underline-offset-8 mb-8">Quick Hub</h2>
              <div className="grid gap-4">
                {[
                  { title: "Smart Resources", sub: "Explore curriculum", icon: BookOpen, color: "bg-primary", href: "/dashboard/resources" },
                  { title: "Student Connect", sub: "Peer networking", icon: Users, color: "bg-accent", href: "/dashboard/community" },
                  { title: "Forum Discussions", sub: "Join the talk", icon: MessageSquare, color: "bg-muted", href: "/dashboard/forum" }
                ].map((action, i) => (
                  <Link key={i} to={action.href} className="group">
                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/50 border border-border hover:bg-primary/10 hover:border-primary/20 transition-all duration-300">
                      <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><action.icon className="w-6 h-6 text-white" /></div>
                      <div><p className="font-bold text-foreground">{action.title}</p><p className="text-xs text-muted-foreground font-medium">{action.sub}</p></div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {announcements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="glass-card rounded-[2.5rem] border border-border p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-primary" /><h2 className="text-lg font-black text-foreground tracking-tight uppercase tracking-wider">Notices</h2></div>
                  <Link to="../notice"><Button variant="ghost" size="sm" className="rounded-xl hover:bg-muted font-bold text-xs">View All</Button></Link>
                </div>
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div key={ann.id} className={`p-4 rounded-2xl border-l-[6px] ${getPriorityStyles(ann.priority)} transition-colors hover:shadow-md`}>
                      <h3 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">{ann.is_pinned && <Pin className="w-3 h-3 text-primary fill-primary" />}{ann.title}</h3>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2">{ann.content}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">{formatDate(ann.created_at)}</p>
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
