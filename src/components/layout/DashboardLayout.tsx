import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Bot,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Resources", href: "/dashboard/resources", icon: BookOpen },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
  { name: "Community", href: "/dashboard/community", icon: Users },
  { name: "Achievements", href: "/dashboard/achievements", icon: Trophy },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg text-foreground">
                BCA Association
              </span>
              <span className="text-xs text-muted-foreground">MMAMC Nepal</span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Page Title */}
            <h1 className="font-heading font-semibold text-lg text-foreground hidden lg:block">
              {sidebarLinks.find((l) => l.href === location.pathname)?.name ||
                "Dashboard"}
            </h1>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
              </Button>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">Member</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
