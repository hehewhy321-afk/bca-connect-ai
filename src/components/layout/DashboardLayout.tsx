import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import { LayoutDashboard, Calendar, BookOpen, Users, Bot, Trophy, Settings, LogOut, Menu, X, MessageSquare, Shield, GraduationCap, Award, ChevronLeft, ChevronRight } from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Events Hub", href: "/dashboard/events", icon: Calendar },
  { name: "Study Library", href: "/dashboard/resources", icon: BookOpen },
  { name: "Certificates", href: "/dashboard/certificates", icon: Award },
  { name: "Alumni Network", href: "/dashboard/alumni", icon: GraduationCap },
  { name: "Community", href: "/dashboard/community", icon: Users },
  { name: "Neural Nexus", href: "/dashboard/ai-assistant", icon: Bot },
  { name: "Forum", href: "/dashboard/forum", icon: MessageSquare },
  { name: "Hall of Fame", href: "/dashboard/achievements", icon: Trophy },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('dashboard-sidebar-collapsed');
    return saved === 'true';
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    isAdmin,
    isModerator
  } = useUserRole();

  // Fetch user profile with avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Persist collapsed state to localStorage
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('dashboard-sidebar-collapsed', String(newCollapsed));
  };



  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] -z-10" />

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

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-[70] h-full glass border-r border-white/10 transition-all duration-500 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-24" : "w-72"}`}>
        {/* Logo Section */}
        <div className={`p-8 ${collapsed ? "px-4" : ""}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent p-[1px] shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                <img src={logoImg} alt="BCA" className="w-full h-full object-cover" />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-lg text-foreground tracking-tight leading-none">
                  BCA Association
                </span>
                <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1.5 px-0.5 opacity-60">
                  MMAMC Biratnagar
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

        {/* Navigation */}
        <nav className={`px-4 py-2 space-y-1 overflow-y-auto h-[calc(100vh-220px)] scrollbar-none ${collapsed ? "px-2" : ""}`}>
          {sidebarLinks.map((link) => {
            const isActive = link.href === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname === link.href || location.pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-4 rounded-[1.25rem] text-sm font-semibold transition-all duration-300 group relative ${
                  collapsed ? "justify-center px-3" : ""
                } ${isActive
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                title={collapsed ? link.name : ""}
              >
                <link.icon className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                {!collapsed && link.name}
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className={`absolute bottom-6 left-4 right-4 space-y-2 ${collapsed ? "left-2 right-2" : ""}`}>
          {(isAdmin || isModerator) && (
            <Button
              variant="ghost"
              className={`w-full justify-start gap-4 h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold group ${collapsed ? "justify-center px-3" : ""}`}
              onClick={() => navigate("/admin")}
              title={collapsed ? "Admin Portal" : ""}
            >
              <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary transition-colors flex-shrink-0">
                <Shield className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
              </div>
              {!collapsed && "Admin Portal"}
            </Button>
          )}
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
        {/* Top Header */}
        <header className="sticky top-0 z-[50] glass-card border-b border-white/5 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-6 h-20">
            {/* Mobile Trigger & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground active:scale-95 transition-all"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="font-black text-xl text-foreground tracking-tight hidden lg:block">
                {sidebarLinks.find(l => l.href === location.pathname)?.name || "Dashboard"}
              </h1>
            </div>

            {/* Actions Area */}
            <div className="flex items-center gap-4">
              <NotificationsDropdown />

              <div className="h-10 w-[1px] bg-white/10 mx-1 hidden sm:block" />

              <div className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white/5 border border-white/5 items-center">
                <Avatar className="w-10 h-10 shadow-lg shadow-primary/20">
                  <AvatarImage 
                    src={avatarUrl || undefined} 
                    alt={user?.user_metadata?.full_name || user?.email || "User"} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-black text-sm">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block leading-tight">
                  <p className="text-sm font-bold text-foreground truncate max-w-[150px]">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-80">
                    {isAdmin ? "Super Admin" : isModerator ? "Moderator" : "Member"}
                  </p>
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

        {/* Dashboard Footer */}
        <footer className="p-8 text-center border-t border-white/5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">
            © {new Date().getFullYear()} BCA Connect AI • All Rights Reserved
          </p>
        </footer>
      </div>
    </div>
  );
}
