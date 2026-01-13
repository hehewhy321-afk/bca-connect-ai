import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Users,
  Calendar,
  Bell,
  Mail,
  X,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Notice", href: "/notice", icon: Bell },
  { name: "About", href: "/about", icon: Users },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings } = useWebsiteSettings();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    navigate(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sidebarVariants = {
    closed: { x: "100%" as const, transition: { type: "spring" as const, stiffness: 400, damping: 40 } },
    opened: {
      x: 0,
      transition: {
        type: "spring" as const, stiffness: 400, damping: 40,
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: 20 },
    opened: { opacity: 1, x: 0 }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || isOpen
          ? "bg-background/60 backdrop-blur-xl border-b border-border py-2 shadow-lg"
          : "bg-transparent py-4"
          }`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <nav className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-primary to-accent p-[1px]">
                <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                  {settings?.site_logo ? (
                    <img
                      src={settings.site_logo}
                      alt="Logo"
                      onLoad={() => setLogoLoaded(true)}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-black italic">
                      B
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-none">
                  {settings?.site_name || "BCA Association"}
                </h1>
                <p className="text-[8px] text-muted-foreground font-bold tracking-widest mt-1 uppercase">
                  {settings?.site_subtitle || "MMAMC"}
                </p>
              </div>
            </Link>

            {/* Desktop Tubelight Navigation */}
            <div className="hidden lg:flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;

                return (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.href)}
                    className={`relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors ${isActive
                      ? "bg-muted text-primary"
                      : "text-foreground/80 hover:text-primary"
                      }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-lamp"
                        className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                          <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                          <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                          <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                        </div>
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden sm:block">
                <Button
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 rounded-lg h-9 text-xs"
                >
                  {user ? "Dashboard" : "Join Now"}
                </Button>
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg bg-muted/50 border border-border text-foreground active:scale-90 transition-all"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />

            <motion.div
              variants={sidebarVariants}
              initial="closed"
              animate="opened"
              exit="closed"
              className="fixed right-0 top-0 h-full w-[260px] bg-background border-l border-border shadow-2xl z-[70] lg:hidden flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-5 flex justify-between items-center border-b border-border">
                <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Navigation</span>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button onClick={() => setIsOpen(false)} className="text-muted-foreground p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 py-4 px-3">
                <div className="space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <motion.button
                        key={link.name}
                        variants={itemVariants}
                        onClick={() => handleNavClick(link.href)}
                        className="flex items-center gap-3 w-full p-3.5 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
                      >
                        <div className="p-2 rounded-lg bg-muted/80 text-muted-foreground">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm tracking-wide">{link.name}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* --- Action Button  --- */}
                <motion.div variants={itemVariants} className="mt-6 px-1">
                  <Button
                    onClick={() => handleNavClick(user ? "/dashboard" : "/auth")}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-primary/20"
                  >
                    {user ? "Dashboard" : "Join Now"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>

              {/* Footer Section (Minimal) */}
              <div className="p-6 border-t border-border mt-auto">
                <p className="text-center text-muted-foreground text-[9px] tracking-tight font-medium">
                  © {new Date().getFullYear()} {settings?.site_name || "BCA Association"}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}