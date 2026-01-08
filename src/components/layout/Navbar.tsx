import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Notice", href: "/notice", icon: Bell },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
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
    navigate(href);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Animation Variants for Mobile Menu ---
  const sidebarVariants = {
    closed: { x: 280, transition: { type: "spring" as const, stiffness: 400, damping: 40 } },
    opened: { 
      x: 0, 
      transition: { 
        type: "spring" as const, stiffness: 400, damping: 40,
        staggerChildren: 0.08, // items come one by one
        delayChildren: 0.2 
      } 
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: 30, transition: { duration: 0.2 } },
    opened: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled || isOpen
            ? "bg-black/40 backdrop-blur-2xl border-b border-white/10 py-2 shadow-2xl"
            : "bg-transparent py-4"
        }`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <nav className="flex items-center justify-between h-16">
            
            {/* --- Logo & Site Name (Desktop Preserved) --- */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group" onClick={() => window.scrollTo(0, 0)}>
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-[1px] shadow-lg shadow-blue-500/20">
                  <div className="w-full h-full rounded-xl bg-black flex items-center justify-center overflow-hidden">
                    {settings?.site_logo ? (
                      <img
                        src={settings.site_logo}
                        alt="Logo"
                        onLoad={() => setLogoLoaded(true)}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black italic">B</div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              <div className="flex flex-col justify-center">
                <h1 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl text-white tracking-tight leading-none transition-colors group-hover:text-blue-400">
                  {settings?.site_name || "BCA Association"}
                </h1>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-white/50 font-semibold tracking-[0.15em] mt-1 leading-none uppercase">
                  {settings?.site_subtitle || "MMAMC"}
                </p>
              </div>
            </Link>

            {/* --- Desktop Nav Links (Preserved) --- */}
            <div className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="relative px-5 py-2.5 text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 rounded-xl"
                >
                  <span className="relative z-10">{link.name}</span>
                </button>
              ))}
            </div>

            {/* --- Desktop Right Actions (Preserved) --- */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <Button
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                  className="relative overflow-hidden group bg-white text-black hover:bg-white/90 font-medium px-6 rounded-xl transition-all shadow-xl shadow-white/5 h-10 px-5 text-sm"
                >
                  {user ? "Dashboard" : "Join Now"}
                </Button>
              </div>

              {!isOpen && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all shadow-inner"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* --- Upgraded Mobile Menu --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] lg:hidden"
            />

            <motion.div
              variants={sidebarVariants}
              initial="closed"
              animate="opened"
              exit="closed"
              className="fixed right-0 top-0 h-full w-[280px] bg-zinc-950 border-l border-white/5 shadow-2xl z-[70] lg:hidden flex flex-col"
            >
              {/* Close Button with Rotation */}
              <div className="p-6 flex justify-end">
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="flex-1 px-6 pb-6 overflow-y-auto">
                <motion.div variants={itemVariants} className="mb-8">
                  <p className="text-blue-500 font-bold tracking-[0.2em] uppercase text-[9px] mb-1">
                    Navigation
                  </p>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Explore <span className="text-zinc-600 font-medium text-lg">Us.</span>
                  </h2>
                </motion.div>

                {/* Staggered Navigation Links */}
                <div className="space-y-1.5">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <motion.button
                        key={link.name}
                        variants={itemVariants}
                        whileTap={{ scale: 0.98, x: 5 }}
                        onClick={() => handleNavClick(link.href)}
                        className="flex items-center gap-4 w-full p-3.5 rounded-2xl transition-all text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/10"
                      >
                        <div className="p-2 rounded-xl bg-zinc-900 shadow-inner">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm tracking-wide">{link.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Section with Slide-up Animation */}
              <motion.div 
                variants={itemVariants} 
                className="p-6 border-t border-white/5 bg-zinc-900/50"
              >
                <Button
                  onClick={() => handleNavClick(user ? "/dashboard" : "/auth")}
                  className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold px-6 rounded-xl transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 text-sm"
                >
                  {user ? "Dashboard" : "Join Now"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <p className="text-center text-zinc-600 text-[8px] mt-6 tracking-widest uppercase font-bold">
                  © {new Date().getFullYear()} {settings?.site_name || "BCA Association"}
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}