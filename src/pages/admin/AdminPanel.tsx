import { useEffect, useState } from "react";
import { motion, easeOut } from "framer-motion";
import {
  Shield,
  Users,
  Calendar,
  BookOpen,
  Bell,
  FileText,
  Plus,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Stats {
  totalMembers: number;
  totalEvents: number;
  totalResources: number;
  upcomingEvents: number;
  totalAnnouncements: number;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalEvents: 0,
    totalResources: 0,
    upcomingEvents: 0,
    totalAnnouncements: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [membersRes, eventsRes, resourcesRes, upcomingRes, announcementsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("resources").select("*", { count: "exact", head: true }),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "upcoming"),
        supabase.from("announcements").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalMembers: membersRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalResources: resourcesRes.count || 0,
        upcomingEvents: upcomingRes.count || 0,
        totalAnnouncements: announcementsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: "Event Hub",
      description: "Manage global and local events",
      icon: Calendar,
      href: "/admin/events",
      color: "from-primary to-accent",
      stat: stats.totalEvents,
      label: "Live Events",
    },
    {
      title: "Library",
      description: "Curate student study materials",
      icon: BookOpen,
      href: "/admin/resources",
      color: "from-orange-500 to-primary",
      stat: stats.totalResources,
      label: "Resources",
    },
    {
      title: "Registry",
      description: "Manage member base and roles",
      icon: Users,
      href: "/admin/members",
      color: "from-accent to-primary",
      stat: stats.totalMembers,
      label: "Members",
    },
    {
      title: "Broadcast",
      description: "Global site announcements",
      icon: Bell,
      href: "/admin/announcements",
      color: "from-primary to-primary",
      stat: stats.totalAnnouncements,
      label: "Notices",
    },
    {
      title: "Payments",
      description: "Verify pending transactions",
      icon: CreditCard,
      href: "/admin/payment-verification",
      color: "from-primary to-accent",
      stat: stats.upcomingEvents, // Reuse stats for visual
      label: "Pending",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Main Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="relative overflow-hidden glass rounded-[2.5rem] p-8 md:p-12 border border-border"
        >
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -ml-24 -mt-24" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Root Administrator</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">
                Command <span className="text-primary italic">Center</span>
              </h1>
              <p className="text-muted-foreground text-lg font-medium max-w-xl">
                Monitor platform growth, manage resources, and oversee member interactions from this unified interface.
              </p>
            </div>

            <div className="bg-muted/50 backdrop-blur-xl border border-border rounded-[2rem] p-6 text-center min-w-[200px]">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Server Health</p>
              <div className="text-3xl font-black text-primary mb-2 tracking-tighter">OPTIMAL</div>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-1 h-3 rounded-full bg-primary/40" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid - Premium Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {adminCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => navigate(card.href)}
              className="cursor-pointer group"
            >
              <div className="glass-card h-full rounded-3xl p-6 border border-border hover:border-primary/30 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-black text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  {card.description}
                </p>

                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-3xl font-black text-foreground tracking-tighter leading-none">
                      {loading ? "..." : card.stat}
                    </p>
                    <p className="text-[10px] font-black text-primary uppercase mt-1">
                      {card.label}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Hub */}
        <div className="glass-card rounded-[3rem] p-10 border border-border">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                Deployment Desk
              </h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Quick deployment of new content</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "New Event", icon: Calendar, path: "/admin/events/new" },
              { label: "Add Resource", icon: BookOpen, path: "/admin/resources/new" },
              { label: "Broadcast", icon: Bell, path: "/admin/announcements" },
              { label: "Post Notice", icon: FileText, path: "/admin/notices" },
              { label: "Add Member", icon: Users, path: "/admin/members" },
              { label: "Verify Payments", icon: CreditCard, path: "/admin/payment-verification" }
            ].map((btn, i) => (
              <Button
                key={i}
                onClick={() => navigate(btn.path)}
                variant="ghost"
                className="flex flex-col items-center justify-center h-32 rounded-3xl bg-muted/50 border border-border border-dashed hover:bg-primary/10 hover:border-primary/30 hover:border-solid transition-all p-4 group"
              >
                <btn.icon className="w-7 h-7 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-black uppercase tracking-tighter text-foreground text-center">
                  {btn.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
