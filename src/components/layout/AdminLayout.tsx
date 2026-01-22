import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import {
  Shield,
  Calendar,
  BookOpen,
  Users,
  Bell,
  FileText,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Award,
  QrCode,
  Settings,
  HelpCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Video,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

const adminLinks = [
  { name: "Overview", href: "/admin", icon: Shield },
  { name: "Courses", href: "/admin/courses", icon: Video },
  { name: "Enrollments", href: "/admin/enrollments", icon: CreditCard },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "QR Check-in", href: "/admin/qr-scanner", icon: QrCode },
  { name: "Resources", href: "/admin/resources", icon: BookOpen },
  { name: "Certificates", href: "/admin/certificates", icon: Award },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Founding Members", href: "/admin/founding-members", icon: Award },
  { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { name: "Notices", href: "/admin/notices", icon: FileText },
  { name: "Notifications", href: "/admin/send-notifications", icon: Bell },
  { name: "FAQs", href: "/admin/faqs", icon: HelpCircle },
  { name: "AI Settings", href: "/admin/ai-settings", icon: Bot },
  { name: "Website Settings", href: "/admin/settings", icon: Settings },
  { name: "Contacts", href: "/admin/contacts", icon: MessageSquare },
  { name: "Create User", href: "/admin/users", icon: UserPlus },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin, isModerator, loading } = useUserRole();
  const [pendingEnrollments, setPendingEnrollments] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from("course_enrollments")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending");

      if (!error) setPendingEnrollments(count || 0);
    };

    fetchPendingCount();

    const channel = supabase
      .channel('enrollment-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_enrollments' },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // Persist collapsed state to localStorage
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('admin-sidebar-collapsed', String(newCollapsed));
  };

  useEffect(() => {
    if (!loading && !isAdmin && !isModerator) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, isModerator, loading, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20" />
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] -z-10" />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Refined Glassmorphism */}
      <aside
        className={`fixed top-0 left-0 z-[70] h-full glass border-r border-white/10 transition-all duration-500 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-24" : "w-72"}`}
      >
        {/* Logo Section */}
        <div className={`p-8 ${collapsed ? "px-4" : ""}`}>
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent p-[1px] shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                <img src={logoImg} alt="BCA" className="w-full h-full object-cover" />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-lg text-foreground tracking-tight leading-none">
                  Admin Center
                </span>
                <span className="text-[10px] text-primary font-bold tracking-widest uppercase mt-1.5 px-0.5 opacity-80">
                  MMAMC BCA • Staff
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Collapse Toggle Button - Desktop Only */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 rounded-full bg-primary border-2 border-background items-center justify-center hover:scale-110 transition-transform z-10"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-primary-foreground" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-primary-foreground" />
          )}
        </button>

        {/* Navigation - Scrollable with custom styles */}
        <nav className={`px-4 py-2 space-y-1 overflow-y-auto h-[calc(100vh-280px)] scrollbar-none ${collapsed ? "px-2" : ""}`}>
          {adminLinks.map((link) => {
            const isActive = location.pathname === link.href ||
              (link.href !== "/admin" && location.pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-[1.25rem] text-sm font-semibold transition-all duration-300 group relative ${collapsed ? "justify-center px-3" : ""
                  } ${isActive
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                title={collapsed ? link.name : ""}
              >
                <div className="relative">
                  <link.icon className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  {link.name === "Enrollments" && pendingEnrollments > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-600 animate-pulse ring-2 ring-background z-10 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                  )}
                </div>
                {!collapsed && link.name}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="active-admin-nav"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className={`absolute bottom-6 left-4 right-4 space-y-2 ${collapsed ? "left-2 right-2" : ""}`}>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-4 h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold group ${collapsed ? "justify-center px-3" : ""}`}
            onClick={() => navigate("/dashboard")}
            title={collapsed ? "User View" : ""}
          >
            <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary transition-colors flex-shrink-0">
              <LayoutDashboard className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
            </div>
            {!collapsed && "User View"}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-bold ${collapsed ? "justify-center px-3" : ""}`}
            onClick={handleSignOut}
            title={collapsed ? "Sign Out" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex flex-col min-h-screen transition-all duration-500 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        {/* Top Header - Glassmorphic */}
        <header className="sticky top-0 z-[50] glass-card border-b border-white/5 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-6 h-20">
            {/* Mobile Trigger & Breadcrumb/Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground active:scale-95 transition-all"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground font-black text-xs uppercase tracking-[0.2em]">Management</span>
                <span className="text-muted-foreground/30 font-black text-xs">/</span>
                <h1 className="font-black text-lg text-foreground tracking-tight">
                  {adminLinks.find((l) => location.pathname === l.href ||
                    (l.href !== "/admin" && location.pathname.startsWith(l.href)))?.name || "Admin"}
                </h1>
              </div>
            </div>

            {/* Actions Area */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-[1px] bg-white/10 mx-1 hidden sm:block" />

              <div className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/20">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-sm font-bold text-foreground truncate max-w-[150px]">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-80">Active Session</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            {children}
          </motion.div>
        </main>

        {/* Admin Footer */}
        <footer className="p-8 text-center border-t border-white/5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">
            Internal Admin Portal • BCA Association • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}
