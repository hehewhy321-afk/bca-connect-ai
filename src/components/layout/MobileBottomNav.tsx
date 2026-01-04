import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Calendar, MessageSquare, HelpCircle, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: MessageSquare, label: "Contact", path: "/contact" },
  { icon: HelpCircle, label: "FAQ", path: "/faq" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);

  // Add profile/login as last item
  const allNavItems = [
    ...navItems,
    { 
      icon: User, 
      label: user ? "Profile" : "Login", 
      path: user ? "/dashboard" : "/auth" 
    }
  ];

  useEffect(() => {
    const currentIndex = allNavItems.findIndex(item => {
      if (item.path === "/") {
        return location.pathname === "/";
      }
      return location.pathname.startsWith(item.path);
    });
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [location.pathname, user]);

  if (!isMobile) return null;

  // Hide on dashboard and admin routes
  if (location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden"
    >
      <div className="mx-3 mb-3">
        <div className="relative bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
          {/* Liquid blob indicator */}
          <motion.div
            className="absolute top-0 bottom-0 w-[20%] bg-primary/20 rounded-2xl"
            initial={false}
            animate={{
              x: `${activeIndex * 100}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
            }}
          />
          
          {/* Active glow effect */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-primary/30 rounded-full blur-xl"
            initial={false}
            animate={{
              x: `calc(${activeIndex * 100}% + ${activeIndex * 0}px + 50% - 24px)`,
              left: `${activeIndex * 20}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
            }}
          />

          <ul className="relative flex items-center justify-around py-2 px-1">
            {allNavItems.map((item, index) => {
              const isActive = index === activeIndex;
              
              return (
                <li key={item.path} className="flex-1">
                  <Link
                    to={item.path}
                    className="flex flex-col items-center justify-center py-2 px-1 relative"
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        y: isActive ? -2 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="relative"
                    >
                      <item.icon 
                        className={`w-5 h-5 transition-colors duration-200 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      
                      {/* Ripple effect on active */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            exit={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 bg-primary rounded-full"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    <motion.span
                      initial={false}
                      animate={{
                        opacity: isActive ? 1 : 0.6,
                        scale: isActive ? 1 : 0.9,
                      }}
                      className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </motion.nav>
  );
}
