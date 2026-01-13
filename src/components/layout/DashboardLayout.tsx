import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import { LayoutDashboard, Calendar, BookOpen, Users, Bot, Trophy, Settings, LogOut, Menu, X, ChevronDown, MessageSquare, Shield, GraduationCap, Award } from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useUserRole } from "@/hooks/useUserRole";
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
      <aside className={`fixed top-0 left-0 z-[70] h-full w-72 glass border-r border-white/10 transition-transform duration-500 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo Section */}
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent p-[1px] shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                <img src={logoImg} alt="BCA" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-foreground tracking-tight leading-none">
                BCA Association
              </span>
              <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1.5 px-0.5 opacity-60">
                MMAMC Biratnagar
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-2 space-y-1 overflow-y-auto h-[calc(100vh-220px)] scrollbar-none">
          {sidebarLinks.map((link) => {
            const isActive = link.href === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname === link.href || location.pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-5 py-4 rounded-[1.25rem] text-sm font-semibold transition-all duration-300 group relative ${isActive
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
              >
                <link.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                {link.name}
                {isActive && (
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
        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          {(isAdmin || isModerator) && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-bold group"
              onClick={() => navigate("/admin")}
            >
              <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary transition-colors">
                <Shield className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
              </div>
              Admin Portal
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-bold"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/20">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
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
