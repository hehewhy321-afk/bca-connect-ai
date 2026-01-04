import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Calendar,
  BookOpen,
  Bell,
  FileText,
  Plus,
  ChevronRight,
  IndianRupee,
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
      title: "Manage Events",
      description: "Create, edit, and delete events",
      icon: Calendar,
      href: "/admin/events",
      color: "from-primary to-primary/70",
      stat: stats.totalEvents,
      statLabel: "Total Events",
    },
    {
      title: "Manage Resources",
      description: "Upload and organize study materials",
      icon: BookOpen,
      href: "/admin/resources",
      color: "from-accent to-accent/70",
      stat: stats.totalResources,
      statLabel: "Total Resources",
    },
    {
      title: "Manage Members",
      description: "View and manage user accounts",
      icon: Users,
      href: "/admin/members",
      color: "from-secondary to-secondary/70",
      stat: stats.totalMembers,
      statLabel: "Total Members",
    },
    {
      title: "Announcements",
      description: "Dashboard announcements",
      icon: Bell,
      href: "/admin/announcements",
      color: "from-primary to-accent",
      stat: stats.totalAnnouncements,
      statLabel: "Total Announcements",
    },
    {
      title: "Public Notices",
      description: "Manage public notices",
      icon: FileText,
      href: "/admin/notices",
      color: "from-accent to-primary",
      stat: stats.upcomingEvents,
      statLabel: "Upcoming Events",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Manage events, resources, members, and announcements
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {adminCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => navigate(card.href)}
              className="cursor-pointer"
            >
              <div className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group h-full">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <card.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {card.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-2xl font-bold text-foreground">
                      {loading ? "..." : card.stat}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.statLabel}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Button
              onClick={() => navigate("/admin/events/new")}
              className="justify-start gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
            <Button
              onClick={() => navigate("/admin/resources/new")}
              variant="outline"
              className="justify-start gap-2"
            >
              <Plus className="w-4 h-4" />
              Upload Resource
            </Button>
            <Button
              onClick={() => navigate("/admin/announcements")}
              variant="outline"
              className="justify-start gap-2"
            >
              <Bell className="w-4 h-4" />
              Announcements
            </Button>
            <Button
              onClick={() => navigate("/admin/notices")}
              variant="outline"
              className="justify-start gap-2"
            >
              <FileText className="w-4 h-4" />
              Notices
            </Button>
            <Button
              onClick={() => navigate("/admin/members")}
              variant="outline"
              className="justify-start gap-2"
            >
              <Users className="w-4 h-4" />
              View Members
            </Button>
            <Button
              onClick={() => navigate("/admin/payment-verification")}
              variant="outline"
              className="justify-start gap-2"
            >
              <IndianRupee className="w-4 h-4" />
              Payment Verification
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
