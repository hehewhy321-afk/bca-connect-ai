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
  { name: "Contact Us", href: "/contact", icon: Mail },
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
    // Smooth scroll to top after navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled 
          ? "bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border-b border-white/30" 
          : "bg-transparent"
      }`}
      style={{
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(200%)" : "none",
        backdropFilter: scrolled ? "blur(20px) saturate(200%)" : "none",
      }}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/15 overflow-hidden shadow-lg group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                {settings?.site_logo ? (
                  <img
                    src={settings.site_logo}
                    alt={settings?.site_name || "Logo"}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoLoaded(true)}
                    className={`w-11 h-11 object-cover transition-opacity duration-200 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                  />
                ) : null}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-background" />
            </div>
            <div className="flex flex-col">
              <span className={`font-heading font-bold text-lg leading-tight transition-colors duration-300 ${
                scrolled ? "text-foreground" : "text-white"
              }`}>
                {settings?.site_name || "BCA Association"}
              </span>
              <span className={`text-xs font-medium transition-colors duration-300 ${
                scrolled ? "text-muted-foreground" : "text-white/70"
              }`}>
                {settings?.site_subtitle || "MMAMC Biratnagar"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            <div className={`flex items-center rounded-full px-2 py-1.5 transition-all duration-500 ${
              scrolled ? "bg-black/5" : "bg-white/10 backdrop-blur-sm"
            }`}>
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full ${
                    scrolled 
                      ? "text-foreground/80 hover:text-foreground hover:bg-muted" 
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center">
            {user ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className={`group px-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  scrolled 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-white text-primary hover:bg-white/90"
                }`}
              >
                Dashboard
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className={`group px-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  scrolled 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-white text-primary hover:bg-white/90"
                }`}
              >
                Join Now
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2.5 rounded-xl transition-colors ${
              scrolled 
                ? "hover:bg-muted border border-border" 
                : "hover:bg-white/10 border border-white/20"
            }`}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className={`w-5 h-5 ${scrolled ? "text-foreground" : "text-white"}`} />
            ) : (
              <Menu className={`w-5 h-5 ${scrolled ? "text-foreground" : "text-white"}`} />
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
              className="lg:hidden overflow-hidden"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className={`py-4 space-y-1 border-t mt-2 mx-2 rounded-2xl ${
                  scrolled 
                    ? "border-white/30 bg-white/40 backdrop-blur-xl" 
                    : "border-white/10 bg-white/10 backdrop-blur-xl"
                }`}
              >
                {navLinks.map((link, index) => {
                  const IconComponent = link.icon;
                  return (
                    <motion.button
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      onClick={() => handleNavClick(link.href)}
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                        scrolled 
                          ? "text-foreground hover:bg-muted" 
                          : "text-white hover:bg-white/15"
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${scrolled ? "text-muted-foreground" : "text-white/70"}`} />
                      {link.name}
                    </motion.button>
                  );
                })}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                  className={`pt-4 mt-4 px-4 border-t ${scrolled ? "border-border/50" : "border-white/10"}`}
                >
                  {user ? (
                    <Button
                      className="w-full bg-white text-primary hover:bg-white/90 shadow-lg"
                      onClick={() => handleNavClick("/dashboard")}
                    >
                      Dashboard
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-white text-primary hover:bg-white/90 shadow-lg"
                      onClick={() => handleNavClick("/auth")}
                    >
                      Join Now
                      <ChevronRight className="w-4 h-4 ml-1" />
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
