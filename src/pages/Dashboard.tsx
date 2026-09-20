import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  ChevronLeft,
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

const EVENTS_PER_PAGE = 3;
const EVENT_POOL_SIZE = 12;

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
  const [eventPage, setEventPage] = useState(0);
  const reduceMotion = useReducedMotion();
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
        const nowIso = new Date().toISOString();
        const [{ data: futureEvents }, { data: pastEvents }] = await Promise.all([
          supabase
            .from("events")
            .select("id, title, start_date, category, location")
            .gte("start_date", nowIso)
            .order("start_date", { ascending: true })
            .limit(EVENT_POOL_SIZE),
          supabase
            .from("events")
            .select("id, title, start_date, category, location")
            .lt("start_date", nowIso)
            .order("start_date", { ascending: false })
            .limit(EVENT_POOL_SIZE),
        ]);
        // Whatever is still to come leads; finished events trail behind it.
        const events = [...(futureEvents || []), ...(pastEvents || [])].slice(
          0,
          EVENT_POOL_SIZE
        );
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
        setUpcomingEvents(events);
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

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Member";

  const eventPageCount = Math.max(1, Math.ceil(upcomingEvents.length / EVENTS_PER_PAGE));
  const visibleEvents = upcomingEvents.slice(
    eventPage * EVENTS_PER_PAGE,
    eventPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE
  );

  const desktopStats = [
    {
      title: "Events",
      value: stats.eventsCount,
      unit: "upcoming",
      icon: Calendar,
      href: "/dashboard/events",
      tint: "from-primary/5 via-card to-card dark:from-primary/20 dark:via-card/60 dark:to-card/40",
    },
    {
      title: "Study library",
      value: stats.resourcesCount,
      unit: "resources",
      icon: BookOpen,
      href: "/dashboard/resources",
      tint: "from-accent/5 via-card to-card dark:from-accent/20 dark:via-card/60 dark:to-card/40",
    },
    {
      title: "Experience",
      value: stats.xpPoints,
      unit: "XP",
      icon: TrendingUp,
      href: "/dashboard/achievements",
      tint: "from-primary/5 via-card to-card dark:from-primary/15 dark:via-card/60 dark:to-card/40",
    },
    {
      title: "Level",
      value: stats.level,
      unit: "reached",
      icon: Trophy,
      href: "/dashboard/achievements",
      tint: "from-accent/5 via-card to-card dark:from-accent/15 dark:via-card/60 dark:to-card/40",
    },
  ];

  const shortcuts = [
    { title: "Study library", sub: "Notes, papers and guides", icon: BookOpen, href: "/dashboard/resources" },
    { title: "Community", sub: "Meet other students", icon: Users, href: "/dashboard/community" },
    { title: "Forum", sub: "Ask and answer questions", icon: MessageSquare, href: "/dashboard/forum" },
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
      <div className="hidden sm:block space-y-8">
        {/* Greeting, progress, and the two things most people come here to do */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 dark:from-primary/15 dark:via-card/60 dark:to-card/30 md:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Welcome back,{" "}
                <span className="italic text-primary">{firstName}</span>
              </h1>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {stats.xpPoints > 0
                  ? `You're on ${stats.xpPoints} XP at level ${stats.level}.`
                  : "Join an event or open a resource to start earning XP."}
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link to="/dashboard/ai-assistant">
                <Button className="h-12 w-full rounded-lg bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90 sm:w-auto">
                  <Bot className="mr-2 h-5 w-5" aria-hidden />
                  Ask the AI assistant
                </Button>
              </Link>
              <a href={appDownloadUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-lg border-border bg-background/40 px-6 font-bold hover:border-primary/40 sm:w-auto"
                >
                  <Download className="mr-2 h-5 w-5" aria-hidden />
                  Get the app
                </Button>
              </a>
            </div>
          </div>
        </motion.header>

        {/* What's available to you right now */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {desktopStats.map((stat) => (
            <Link
              key={stat.title}
              to={stat.href}
              className={`group flex flex-col rounded-xl border border-border bg-gradient-to-br p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${stat.tint}`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm shadow-primary/20">
                  <stat.icon className="h-5 w-5" aria-hidden />
                </span>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </div>
              <h2 className="mt-4 text-base font-bold text-foreground">{stat.title}</h2>
              <div className="mt-3 flex items-baseline gap-2">
                {loading ? (
                  <span className="h-7 w-10 rounded bg-muted" aria-hidden />
                ) : (
                  <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                    {stat.value}
                  </span>
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.unit}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Events */}
          <section className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30 lg:col-span-2">
            <div className="flex h-9 items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  <Calendar className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <h2 className="text-base font-bold text-foreground">Events</h2>
              </div>
              <Link
                to="/dashboard/events"
                className="rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                See all
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted" />)
              ) : upcomingEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background/40 py-10 text-center">
                  <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    No events scheduled yet. Check back soon.
                  </p>
                </div>
              ) : (
                visibleEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-3 transition-colors hover:border-primary/40 hover:from-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:from-primary/10 dark:hover:from-primary/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-background/60 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                        {new Date(event.start_date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold leading-none text-foreground">
                        {new Date(event.start_date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <span className="truncate">{event.title}</span>
                        {new Date(event.start_date) < new Date() && (
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Past
                          </span>
                        )}
                      </h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" aria-hidden />
                          {formatDate(event.start_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Pin className="h-3 w-3" aria-hidden />
                          {event.location || "Online"}
                        </span>
                      </p>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                ))
              )}
            </div>

            {!loading && upcomingEvents.length > EVENTS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Page {eventPage + 1} of {eventPageCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={eventPage === 0}
                    onClick={() => setEventPage((page) => Math.max(0, page - 1))}
                    className="h-7 rounded-md border-border px-2.5 text-xs"
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Newer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={eventPage >= eventPageCount - 1}
                    onClick={() =>
                      setEventPage((page) => Math.min(eventPageCount - 1, page + 1))
                    }
                    className="h-7 rounded-md border-border px-2.5 text-xs"
                  >
                    Older
                    <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            )}
          </section>

          <div className="flex h-full flex-col gap-6">
            {/* Shortcuts */}
            <section className="flex flex-1 flex-col rounded-xl border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30">
              <div className="flex h-9 items-center">
                <h2 className="text-base font-bold text-foreground">
                  Jump <span className="italic text-primary">back in</span>
                </h2>
              </div>
              <div className="mt-4 space-y-2">
                {shortcuts.map((shortcut) => (
                  <Link
                    key={shortcut.title}
                    to={shortcut.href}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-3 transition-colors hover:border-primary/40 hover:from-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:from-primary/10 dark:hover:from-primary/20"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <shortcut.icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{shortcut.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{shortcut.sub}</p>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </section>

            {/* Notices */}
            {announcements.length > 0 && (
              <section className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-card p-5 dark:from-card/70 dark:to-card/30">
                <div className="flex h-9 items-center justify-between gap-4">
                  <h2 className="text-base font-bold text-foreground">Notices</h2>
                  <Link
                    to="/notice"
                    className="rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    See all
                  </Link>
                </div>
                <div className="mt-4 space-y-2">
                  {announcements.map((ann) => (
                    <article
                      key={ann.id}
                      className={`rounded-lg border-l-4 p-3.5 ${getPriorityStyles(ann.priority)}`}
                    >
                      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        {ann.is_pinned && (
                          <Pin className="h-3 w-3 shrink-0 fill-primary text-primary" aria-hidden />
                        )}
                        <span className="truncate">{ann.title}</span>
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {ann.content}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground/70">
                        {formatDate(ann.created_at)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
