import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

  const menuVariants = {
    closed: { x: 100, transition: { type: "spring" as const, stiffness: 400, damping: 40 } },
    opened: { 
      x: 0, 
      transition: { 
        type: "spring" as const, stiffness: 400, damping: 40,
        staggerChildren: 0.08, 
        delayChildren: 0.2 
      } 
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: 30 },
    opened: { opacity: 1, x: 0 }
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
            
            {/* --- Logo & Site Name Section --- */}
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
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black">B</div>
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

            {/* --- Desktop Nav Links --- */}
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

            {/* --- Desktop Right Actions --- */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <Button
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                  className="relative overflow-hidden group bg-white text-black hover:bg-white/90 font-medium px-6 rounded-xl transition-all shadow-xl shadow-white/5"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {user ? "Dashboard" : "Join Now"}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  />
                </Button>
              </div>

              {!isOpen && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="lg:hidden p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* --- Mobile Menu --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[60] lg:hidden"
            />

            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="opened"
              exit="closed"
              className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-zinc-950 border-l border-white/10 shadow-2xl z-[70] lg:hidden flex flex-col"
            >
              {/* Top Header in Menu */}
              <div className="p-8 pt-12 relative">
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/20"
                >
                  <X className="w-6 h-6" />
                </motion.button>

                <div className="mt-12">
                  <motion.p variants={itemVariants} className="text-blue-500 font-black tracking-[0.4em] uppercase text-[10px]">
                    Navigation
                  </motion.p>
                  <motion.h2 variants={itemVariants} className="text-4xl xs:text-5xl font-bold text-white mt-2 tracking-tighter">
                    Explore <span className="text-zinc-700">Us.</span>
                  </motion.h2>
                </div>
              </div>

              {/* Mobile Menu Links */}
              <div className="flex-1 px-4 py-2 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <motion.button
                      key={link.name}
                      variants={itemVariants}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavClick(link.href)}
                      className="flex items-center gap-4 w-full px-6 py-5 rounded-2xl transition-all text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-zinc-800">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xl">{link.name}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom Section in Menu */}
              <motion.div variants={itemVariants} className="p-8 border-t border-white/5 bg-black/20">
                <Button
                  onClick={() => handleNavClick(user ? "/dashboard" : "/auth")}
                  className="relative overflow-hidden group w-full h-16 bg-white text-black hover:bg-white/90 font-medium px-6 rounded-2xl transition-all shadow-xl shadow-white/5"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                    {user ? "Go to Dashboard" : "Join Now"}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  {/* Shiny sweep animation */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  />
                </Button>
                
                <p className="text-center text-zinc-600 text-[10px] mt-6 tracking-widest uppercase font-bold">
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