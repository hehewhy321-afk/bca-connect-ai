import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, Home, Users, Calendar, Bell, Mail } from "lucide-react";
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
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setLogoLoaded(false);
  }, [settings?.site_logo]);

  const handleNavClick = (href: string) => {
    navigate(href);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled 
          ? "bg-white/8 backdrop-blur-md border-b border-white/10 shadow-sm" 
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-gradient-to-br from-white/15 to-white/5 overflow-hidden transition-all duration-300 group-hover:from-white/25 group-hover:to-white/10 group-hover:scale-105 border border-white/10">
                {settings?.site_logo ? (
                  <img
                    src={settings.site_logo}
                    alt={settings?.site_name || "Logo"}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                  />
                ) : null}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-background" />
            </div>
            
            {/* Brand Text - Hidden on mobile, visible from sm */}
            <div className="hidden sm:flex flex-col">
              <span className="font-heading font-bold text-sm sm:text-base md:text-lg leading-tight text-white transition-colors duration-300">
                {settings?.site_name || "BCA Association"}
              </span>
              <span className="text-xs font-medium text-white/60 transition-colors duration-300">
                {settings?.site_subtitle || "MMAMC"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 border border-white/15 rounded-full backdrop-blur-sm hover:bg-white/12 transition-all duration-300">
              {navLinks.map((link) => (
                <motion.button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white rounded-full bg-transparent hover:bg-white/20 transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Liquid background effect */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-full -z-10"
                  />
                  <span className="relative z-10">{link.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden lg:flex items-center flex-shrink-0">
            {user ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="group gap-2 px-5 md:px-6 h-10 bg-white text-primary hover:bg-white/90 font-medium shadow-md hover:shadow-lg transition-all duration-300"
              >
                Dashboard
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className="group gap-2 px-5 md:px-6 h-10 bg-white text-primary hover:bg-white/90 font-medium shadow-md hover:shadow-lg transition-all duration-300"
              >
                Join Now
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors border border-white/10 flex-shrink-0"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden overflow-hidden pb-4"
            >
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="space-y-2 pt-4"
              >
                {navLinks.map((link, index) => {
                  const IconComponent = link.icon;
                  return (
                    <motion.button
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                      onClick={() => handleNavClick(link.href)}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <IconComponent className="w-4 h-4 text-white/60" />
                      {link.name}
                    </motion.button>
                  );
                })}
                
                {/* Mobile CTA */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                  className="pt-3 border-t border-white/10 mt-3"
                >
                  {user ? (
                    <Button
                      className="w-full gap-2 h-10 bg-white text-primary hover:bg-white/90 font-medium shadow-md"
                      onClick={() => handleNavClick("/dashboard")}
                    >
                      Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2 h-10 bg-white text-primary hover:bg-white/90 font-medium shadow-md"
                      onClick={() => handleNavClick("/auth")}
                    >
                      Join Now
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
