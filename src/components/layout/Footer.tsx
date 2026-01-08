import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  GraduationCap, Mail, Phone, MapPin, 
  Facebook, Instagram, Twitter, Linkedin, 
  Github, ArrowRight, Heart 
} from "lucide-react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const footerLinks = {
  quickLinks: [
    { name: "About Us", href: "/about" },
    { name: "Events", href: "/events" },
    { name: "Resources", href: "/dashboard/resources" },
    { name: "Community", href: "/dashboard/community" },
    { name: "Notice", href: "/notice" },
  ],
  resources: [
    { name: "Study Materials", href: "/dashboard/resources" },
    { name: "Past Papers", href: "/dashboard/resources" },
    { name: "AI Assistant", href: "/dashboard/ai-assistant" },
    { name: "Forum", href: "/dashboard/forum" },
    { name: "Achievements", href: "/dashboard/achievements" },
  ],
  support: [
    { name: "FAQs", href: "/faq" },
    { name: "Contact Us", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings } = useWebsiteSettings();

  const socialLinks = [
    { icon: Facebook, href: settings?.facebook_url || "#", label: "Facebook" },
    { icon: Instagram, href: settings?.instagram_url || "#", label: "Instagram" },
    { icon: Twitter, href: settings?.twitter_url || "#", label: "Twitter" },
    { icon: Linkedin, href: settings?.linkedin_url || "#", label: "LinkedIn" },
    { icon: Github, href: settings?.github_url || "#", label: "GitHub" },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(href);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-zinc-950 border-t border-white/5 pt-20 pb-10 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8"
        >
          {/* Brand Column */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-[1px] shadow-lg shadow-blue-500/10">
                <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden">
                  {settings?.site_logo ? (
                    <img src={settings.site_logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-white tracking-tight">
                  {settings?.site_name || "BCA Association"}
                </span>
                <span className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">
                  {settings?.site_subtitle || "MMAMC Nepal"}
                </span>
              </div>
            </Link>
            
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
              Empowering future tech leaders through AI-powered learning,
              collaborative projects, and industry connections at MMAMC Biratnagar.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-400 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>{settings?.address || "MMAMC, Biratnagar, Nepal"}</span>
              </div>
              <a href={`mailto:${settings?.email_primary}`} className="flex items-center gap-3 text-sm text-zinc-400 hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>{settings?.email_primary || "bca@mmamc.edu.np"}</span>
              </a>
            </div>
          </motion.div>

          {/* Links Columns */}
          {[
            { title: "Quick Links", links: footerLinks.quickLinks },
            { title: "Resources", links: footerLinks.resources },
            { title: "Support", links: footerLinks.support },
          ].map((section, idx) => (
            <motion.div variants={itemVariants} key={idx} className="space-y-6">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => handleNavClick(link.href)}
                      className="group flex items-center text-zinc-500 hover:text-white text-sm transition-all duration-300"
                    >
                      <ArrowRight className="w-0 h-4 group-hover:w-4 group-hover:mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-blue-500" />
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Social & Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-20 pt-10 border-t border-white/5 flex flex-col md:row gap-8 items-center justify-between"
        >
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ y: -5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all shadow-lg"
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <p className="text-xs text-zinc-500 font-medium">
              © {new Date().getFullYear()} {settings?.site_name}. All rights reserved.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-zinc-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
              <span>by</span>
              <a 
                href="https://www.instagram.com/me_saifali/" 
                target="_blank" 
                className="text-white hover:text-blue-400 font-bold transition-colors"
              >
                Saif Ali
              </a>
              <div className="flex gap-2 ml-2 border-l border-white/10 pl-2">
                <a href="https://github.com/mesaifali" target="_blank" className="hover:text-white transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}