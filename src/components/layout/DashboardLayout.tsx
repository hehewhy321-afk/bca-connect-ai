import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import { LayoutDashboard, Calendar, BookOpen, Users, Bot, Trophy, Settings, LogOut, Menu, X, MessageSquare, Shield, GraduationCap, Award, ChevronLeft, ChevronRight, ChevronDown, Video, type LucideIcon } from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { preloadRoute, preloadRoutesWhenIdle } from "@/lib/route-preload";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Pages that supply their own header (the AI assistant) can hide this one. */
  hideHeader?: boolean;
  /** Drops the main padding and footer so a page can own the viewport (chat). */
  fullBleed?: boolean;
}

const dashboardLink = { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard };
const settingsLink = { name: "Settings", href: "/dashboard/settings", icon: Settings };

const sidebarGroups = [
  {
    name: "Learning",
    icon: BookOpen,
    links: [
      { name: "Courses", href: "/dashboard/courses", icon: Video },
      { name: "Study Library", href: "/dashboard/resources", icon: BookOpen },
      { name: "Certificates", href: "/dashboard/certificates", icon: Award },
    ],
  },
  {
    name: "Campus",
    icon: Calendar,
    links: [
      { name: "Events Hub", href: "/dashboard/events", icon: Calendar },
      { name: "Alumni Network", href: "/dashboard/alumni", icon: GraduationCap },
    ],
  },
  {
    name: "Community",
    icon: Users,
    links: [
      { name: "Community", href: "/dashboard/community", icon: Users },
      { name: "Forum", href: "/dashboard/forum", icon: MessageSquare },
      { name: "Hall of Fame", href: "/dashboard/achievements", icon: Trophy },
    ],
  },
];

// Flat list used when the sidebar is collapsed to icons.
const sidebarLinks = [
  dashboardLink,
  ...sidebarGroups.flatMap((group) => group.links),
  settingsLink,
];

function NavRow({
  link,
  isActive,
  collapsed = false,
  nested = false,
  onNavigate,
}: {
  link: { name: string; href: string; icon: LucideIcon };
  isActive: boolean;
  collapsed?: boolean;
  nested?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={link.href}
      onClick={onNavigate}
      onMouseEnter={() => preloadRoute(link.href)}
      onFocus={() => preloadRoute(link.href)}
      onTouchStart={() => preloadRoute(link.href)}
      className={`flex items-center gap-3 py-3.5 rounded-md text-sm font-semibold transition-colors duration-200 group relative ${
        collapsed ? "justify-center px-3" : nested ? "ml-4 pl-5 pr-4" : "px-4"
      } ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
      title={collapsed ? link.name : ""}
    >
      <link.icon className="w-[18px] h-[18px] flex-shrink-0" />
      {!collapsed && link.name}
    </Link>
  );
}

export function DashboardLayout({
  children,
  hideHeader = false,
  fullBleed = false
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
  // Keep the group holding the current page open, plus whatever the user opened.
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const active = sidebarGroups.find((group) =>
      group.links.some((link) => location.pathname.startsWith(link.href))
    );
    return active ? [active.name] : [];
  });

  useEffect(() => {
    const active = sidebarGroups.find((group) =>
      group.links.some((link) => location.pathname.startsWith(link.href))
    );
    if (active) {
      setOpenGroups((prev) =>
        prev.includes(active.name) ? prev : [...prev, active.name]
      );
    }
  }, [location.pathname]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isLinkActive = (href: string) =>
    href === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname === href || location.pathname.startsWith(href + "/");

  // Warm every sidebar chunk once the browser goes idle.
  useEffect(() => preloadRoutesWhenIdle(sidebarLinks.map((link) => link.href)), []);

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
        <nav className={`px-3 py-2 space-y-1 overflow-y-auto h-[calc(100vh-220px)] scrollbar-none ${collapsed ? "px-2" : ""}`}>
          {collapsed ? (
            sidebarLinks.map((link) => (
              <NavRow
                key={link.name}
                link={link}
                collapsed
                isActive={isLinkActive(link.href)}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))
          ) : (
            <>
              <NavRow
                link={dashboardLink}
                isActive={isLinkActive(dashboardLink.href)}
                onNavigate={() => setSidebarOpen(false)}
              />
              {sidebarGroups.map((group) => {
                const isOpen = openGroups.includes(group.name);
                return (
                  <Collapsible
                    key={group.name}
                    open={isOpen}
                    onOpenChange={() => toggleGroup(group.name)}
                  >
                    <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground/80 transition-colors hover:text-foreground">
                      <group.icon className="w-[18px] h-[18px] flex-shrink-0" />
                      <span className="flex-1 text-left">{group.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden space-y-1 pb-1 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      {group.links.map((link) => (
                        <NavRow
                          key={link.name}
                          link={link}
                          nested
                          isActive={isLinkActive(link.href)}
                          onNavigate={() => setSidebarOpen(false)}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
              <NavRow
                link={settingsLink}
                isActive={isLinkActive(settingsLink.href)}
                onNavigate={() => setSidebarOpen(false)}
              />
            </>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="absolute bottom-6 left-0 right-0">
          {(isAdmin || isModerator) && (
            <Button
              variant="ghost"
              className={`w-full justify-start gap-4 h-14 rounded-none bg-white/5 border-y border-white/5 px-4 hover:bg-white/10 transition-all font-bold group ${collapsed ? "justify-center px-3" : ""}`}
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
            className={`w-full justify-start gap-3 h-12 rounded-none px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-bold ${collapsed ? "justify-center px-3" : ""}`}
            onClick={handleSignOut}
            title={collapsed ? "Sign Out" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex flex-col transition-all duration-500 ${fullBleed ? "h-screen overflow-hidden" : "min-h-screen"} ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        {/* Top Header */}
        {!hideHeader && (
        <header className="sticky top-0 z-[50] glass-card border-b border-white/5 backdrop-blur-2xl">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16 sm:h-20">
            {/* Mobile Trigger & Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-foreground active:scale-95 transition-all"
              >
                {sidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <h1 className="font-black text-base sm:text-xl text-foreground tracking-tight hidden sm:block lg:block">
                {sidebarLinks.find(l => l.href === location.pathname)?.name || "Dashboard"}
              </h1>
            </div>

            {/* Actions Area */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/dashboard/ai-assistant"
                aria-label="AI assistant"
                title="AI assistant"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-white transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Bot className="h-6 w-6 motion-safe:animate-wiggle" aria-hidden />
              </Link>

              <NotificationsDropdown />

              <div className="h-8 sm:h-10 w-[1px] bg-white/10 mx-0.5 sm:mx-1 hidden sm:block" />

              <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-2 sm:pr-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 items-center">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shadow-lg shadow-primary/20">
                  <AvatarImage
                    src={avatarUrl || undefined}
                    alt={user?.user_metadata?.full_name || user?.email || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-black text-xs sm:text-sm">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block leading-tight">
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[100px] sm:max-w-[150px]">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest opacity-80">
                    {isAdmin ? "Super Admin" : isModerator ? "Moderator" : "Member"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        )}

        {hideHeader && (
          <div className="sticky top-0 z-[50] flex items-center gap-3 border-b border-white/5 px-4 py-3 backdrop-blur-2xl lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-foreground transition-all active:scale-95"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className={fullBleed ? "flex min-h-0 flex-1 flex-col" : "flex-1 p-4 sm:p-6 md:p-8 lg:p-10"}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            {children}
          </motion.div>
        </main>

        {/* Dashboard Footer */}
        {!fullBleed && (
          <footer className="p-4 sm:p-8 text-center border-t border-white/5">
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40">
              © {new Date().getFullYear()} BCA Connect AI • All Rights Reserved
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
