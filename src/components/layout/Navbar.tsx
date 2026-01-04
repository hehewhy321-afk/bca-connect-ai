import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, GraduationCap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
const navLinks = [{
  name: "Home",
  href: "/"
}, {
  name: "About",
  href: "/about"
}, {
  name: "Events",
  href: "/dashboard/events"
}, {
  name: "Notice",
  href: "/notice"
}, {
  name: "Contact Us",
  href: "/contact"
}];
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const handleNavClick = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };
  return <motion.header initial={{
    y: -100
  }} animate={{
    y: 0
  }} transition={{
    duration: 0.5,
    ease: "easeOut"
  }} className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-background" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-tight text-white">
                BCA Association
              </span>
              <span className="text-xs text-white/70 font-medium">MMAMC Biratnagar</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-2 py-1.5">
              {navLinks.map(link => <button key={link.name} onClick={() => handleNavClick(link.href)} className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors duration-200 rounded-full hover:bg-white/10">
                  {link.name}
                </button>)}
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center">
            {user ? <Button onClick={() => navigate("/dashboard")} className="group px-6 bg-white text-primary hover:bg-white/90">
                Dashboard
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button> : <Button onClick={() => navigate("/auth")} className="group px-6 bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300">
                Join Now
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2.5 rounded-xl hover:bg-white/10 transition-colors border border-white/20" aria-label="Toggle menu">
            {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && <motion.div initial={{
          opacity: 0,
          height: 0
        }} animate={{
          opacity: 1,
          height: "auto"
        }} exit={{
          opacity: 0,
          height: 0
        }} transition={{
          duration: 0.3
        }} className="lg:hidden overflow-hidden">
              <div className="py-4 space-y-1 border-t border-white/10 bg-black/20 backdrop-blur-xl rounded-b-2xl">
                {navLinks.map(link => <button key={link.name} onClick={() => handleNavClick(link.href)} className="block w-full text-left px-4 py-3 text-base font-medium text-white hover:text-primary hover:bg-white/10 rounded-xl transition-colors">
                    {link.name}
                  </button>)}
                <div className="pt-4 border-t border-white/10 mt-4 px-4">
                  {user ? <Button className="w-full bg-white text-primary hover:bg-white/90" onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </Button> : <Button className="w-full bg-white text-primary hover:bg-white/90" onClick={() => navigate("/auth")}>
                      Join Now
                    </Button>}
                </div>
              </div>
            </motion.div>}
        </AnimatePresence>
      </div>
    </motion.header>;
}