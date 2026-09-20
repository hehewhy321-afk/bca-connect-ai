import { useEffect, useState } from "react";
import { motion, easeOut, useReducedMotion } from "framer-motion";
import {
  Users,
  Calendar,
  BookOpen,
  Bell,
  FileText,
  Plus,
  ChevronRight,
  CreditCard,
  Video,
  Mail,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  members: number;
  events: number;
  upcomingEvents: number;
  resources: number;
  courses: number;
  announcements: number;
  pendingPayments: number;
  pendingEnrollments: number;
  unreadMessages: number;
}

const emptyStats: Stats = {
  members: 0,
  events: 0,
  upcomingEvents: 0,
  resources: 0,
  courses: 0,
  announcements: 0,
  pendingPayments: 0,
  pendingEnrollments: 0,
  unreadMessages: 0,
};

function countOf(table: string) {
  return supabase.from(table as never).select("*", { count: "exact", head: true });
}

function StatCard({
  icon: Icon,
  title,
  description,
  value,
  unit,
  href,
  tint,
  loading,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  value: number;
  unit: string;
  href: string;
  tint: string;
  loading: boolean;
}) {
  return (
    <Link
      to={href}
      className={`group flex flex-col rounded-xl border border-border bg-gradient-to-br p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${tint}`}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm shadow-primary/20">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <ChevronRight
          className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>

      <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
      <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{description}</p>

      <div className="mt-5 flex items-baseline gap-2">
        {loading ? (
          <span className="h-7 w-10 rounded bg-muted" aria-hidden />
        ) : (
          <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {value}
          </span>
        )}
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {unit}
        </span>
      </div>
    </Link>
  );
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      try {
        const [
          members,
          events,
          upcoming,
          resources,
          courses,
          announcements,
          payments,
          enrollments,
          messages,
        ] = await Promise.all([
          countOf("profiles"),
          countOf("events"),
          countOf("events").eq("status", "upcoming"),
          countOf("resources"),
          countOf("courses"),
          countOf("announcements"),
          countOf("public_event_registrations").eq("payment_status", "pending"),
          countOf("course_enrollments").eq("status", "pending"),
          countOf("contact_submissions").eq("is_read", false),
        ]);

        if (!active) return;

        setStats({
          members: members.count || 0,
          events: events.count || 0,
          upcomingEvents: upcoming.count || 0,
          resources: resources.count || 0,
          courses: courses.count || 0,
          announcements: announcements.count || 0,
          pendingPayments: payments.count || 0,
          pendingEnrollments: enrollments.count || 0,
          unreadMessages: messages.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      active = false;
    };
  }, []);

  const queue = [
    {
      icon: CreditCard,
      label: "Payments to verify",
      value: stats.pendingPayments,
      href: "/admin/payment-verification",
    },
    {
      icon: GraduationCap,
      label: "Enrolment requests",
      value: stats.pendingEnrollments,
      href: "/admin/enrollments",
    },
    {
      icon: Mail,
      label: "Unread messages",
      value: stats.unreadMessages,
      href: "/admin/contacts",
    },
  ].filter((item) => item.value > 0);

  const openItems = queue.reduce((total, item) => total + item.value, 0);

  const cards = [
    {
      icon: Calendar,
      title: "Events",
      tint: "from-primary/5 via-card to-card dark:from-primary/20 dark:via-card/60 dark:to-card/40",
      description: "Schedule and publish what's coming up",
      value: stats.upcomingEvents,
      unit: "upcoming",
      href: "/admin/events",
    },
    {
      icon: Video,
      title: "Courses",
      tint: "from-accent/5 via-card to-card dark:from-accent/20 dark:via-card/60 dark:to-card/40",
      description: "Build lessons and approve enrolments",
      value: stats.courses,
      unit: "published",
      href: "/admin/courses",
    },
    {
      icon: BookOpen,
      title: "Library",
      tint: "from-primary/5 via-card to-card dark:from-primary/15 dark:via-card/60 dark:to-card/40",
      description: "Curate notes, papers and guides",
      value: stats.resources,
      unit: "resources",
      href: "/admin/resources",
    },
    {
      icon: Users,
      title: "Members",
      tint: "from-accent/5 via-card to-card dark:from-accent/15 dark:via-card/60 dark:to-card/40",
      description: "Manage accounts and roles",
      value: stats.members,
      unit: "members",
      href: "/admin/members",
    },
    {
      icon: Bell,
      title: "Announcements",
      tint: "from-primary/5 via-card to-card dark:from-primary/20 dark:via-card/60 dark:to-card/40",
      description: "Broadcast notices to everyone",
      value: stats.announcements,
      unit: "posted",
      href: "/admin/announcements",
    },
  ];

  const shortcuts = [
    { label: "New event", icon: Calendar, path: "/admin/events/new" },
    { label: "Add resource", icon: BookOpen, path: "/admin/resources/new" },
    { label: "Post announcement", icon: Bell, path: "/admin/announcements" },
    { label: "Post notice", icon: FileText, path: "/admin/notices" },
    { label: "Add member", icon: Users, path: "/admin/users" },
    { label: "Verify payments", icon: CreditCard, path: "/admin/payment-verification" },
  ];

  return (
    <AdminLayout>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="space-y-8"
      >
        {/* Header — the title, plus whatever is actually waiting on an admin */}
        <header className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 dark:from-primary/15 dark:via-card/60 dark:to-card/30 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Admin <span className="italic text-primary">overview</span>
              </h1>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Everything that runs the association site — events, courses, the study library,
                and the people using them.
              </p>
            </div>

            <div className="w-full rounded-lg border border-border bg-background/60 p-4 dark:border-primary/20 lg:w-80 lg:shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Waiting on you</h2>
                {!loading && openItems > 0 && (
                  <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold tabular-nums text-primary-foreground">
                    {openItems}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {loading ? (
                  <span className="block h-4 w-32 rounded bg-muted" aria-hidden />
                ) : queue.length > 0 ? (
                  queue.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="flex-1 text-muted-foreground">{item.label}</span>
                      <span className="font-bold tabular-nums text-foreground">{item.value}</span>
                    </Link>
                  ))
                ) : (
                  <p className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    Nothing to review
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Each section of the site, with the number that matters most for it */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} loading={loading} />
          ))}
        </div>

        {/* Shortcuts into the create forms */}
        <section className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-card p-6 dark:from-card/70 dark:to-card/30 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm shadow-primary/20">
              <Plus className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Create <span className="italic text-primary">something</span>
              </h2>
              <p className="text-sm text-muted-foreground">Jump straight into the form</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => navigate(shortcut.path)}
                className="flex flex-col items-start gap-3 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-4 text-left transition-colors hover:border-primary/40 hover:from-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:from-primary/10 dark:hover:from-primary/20"
              >
                <shortcut.icon className="h-5 w-5 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-foreground">{shortcut.label}</span>
              </button>
            ))}
          </div>
        </section>
      </motion.div>
    </AdminLayout>
  );
}
