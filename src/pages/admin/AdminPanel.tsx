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
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">
                Manage events, resources & members
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {adminCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => navigate(card.href)}
              className="cursor-pointer"
            >
              <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group h-full">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                >
                  <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1 text-sm sm:text-base truncate">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4 line-clamp-2 hidden sm:block">
                  {card.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                      {loading ? "..." : card.stat}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {card.statLabel}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <Button
              onClick={() => navigate("/admin/events/new")}
              className="justify-center sm:justify-start gap-2 text-xs sm:text-sm h-auto py-3"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span> Event
            </Button>
            <Button
              onClick={() => navigate("/admin/resources/new")}
              variant="outline"
              className="justify-center sm:justify-start gap-2 text-xs sm:text-sm h-auto py-3"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span> Resource
            </Button>
            <Button
              onClick={() => navigate("/admin/announcements")}
              variant="outline"
              className="justify-center sm:justify-start gap-2 text-xs sm:text-sm h-auto py-3"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden xs:inline">Announce</span>
            </Button>
            <Button
              onClick={() => navigate("/admin/notices")}
              variant="outline"
              className="justify-center sm:justify-start gap-2 text-xs sm:text-sm h-auto py-3"
            >
              <FileText className="w-4 h-4" />
              Notices
            </Button>
            <Button
              onClick={() => navigate("/admin/members")}
              variant="outline"
              className="justify-center sm:justify-start gap-2 text-xs sm:text-sm h-auto py-3"
            >
              <Users className="w-4 h-4" />
              Members
            </Button>
            <Button
              onClick={() => navigate("/admin/payment-verification")}
              variant="outline"
              className="justify-center sm:justify-start gap-2 text-xs sm:text-sm h-auto py-3"
            >
              <IndianRupee className="w-4 h-4" />
              Payments
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
