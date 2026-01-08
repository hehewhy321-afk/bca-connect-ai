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
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled || isOpen
            ? "bg-black/60 backdrop-blur-xl border-b border-white/10 py-2 shadow-2xl"
            : "bg-transparent py-4"
        }`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <nav className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
                <div className="w-full h-full rounded-xl bg-black flex items-center justify-center overflow-hidden">
                  {settings?.site_logo ? (
                    <img
                      src={settings.site_logo}
                      alt="Logo"
                      onLoad={() => setLogoLoaded(true)}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black italic text-xs">B</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                  {settings?.site_name || "BCA Association"}
                </h1>
                <p className="text-[8px] text-white/50 font-bold tracking-widest mt-1 uppercase">
                  {settings?.site_subtitle || "MMAMC"}
                </p>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-xl p-1 border border-white/10">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all rounded-lg"
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <Button
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                  className="bg-white text-black hover:bg-white/90 font-bold px-5 rounded-lg h-9 text-xs"
                >
                  {user ? "Dashboard" : "Join Now"}
                </Button>
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white active:scale-90 transition-all"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

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
              className="fixed right-0 top-0 h-full w-[260px] bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-[70] lg:hidden flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-5 flex justify-between items-center border-b border-white/5">
                <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Navigation</span>
                <button onClick={() => setIsOpen(false)} className="text-white/40 p-1">
                   <X className="w-5 h-5" />
                </button>
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
                        className="flex items-center gap-3 w-full p-3.5 rounded-xl transition-all text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10"
                      >
                        <div className="p-2 rounded-lg bg-white/5 text-white/50">
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
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-white/5"
                  >
                    {user ? "Dashboard" : "Join Now"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>

              {/* Footer Section (Minimal) */}
              <div className="p-6 border-t border-white/5 mt-auto">
                <p className="text-center text-white/20 text-[9px] tracking-tight font-medium">
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