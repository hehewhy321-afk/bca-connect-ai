import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, Github } from "lucide-react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const footerLinks = {
  quickLinks: [
    { name: "About Us", href: "/about" },
    { name: "Events", href: "/events" },
    { name: "Resources", href: "/dashboard/resources", requiresAuth: true },
    { name: "Community", href: "/dashboard/community", requiresAuth: true },
    { name: "Notice", href: "/notice" },
  ],
  resources: [
    { name: "Study Materials", href: "/dashboard/resources", requiresAuth: true },
    { name: "Past Papers", href: "/dashboard/resources", requiresAuth: true },
    { name: "AI Assistant", href: "/dashboard/ai-assistant", requiresAuth: true },
    { name: "Forum", href: "/dashboard/forum", requiresAuth: true },
    { name: "Achievements", href: "/dashboard/achievements", requiresAuth: true },
  ],
  support: [
    { name: "FAQs", href: "/faq" },
    { name: "Contact Us", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings } = useWebsiteSettings();

  const socialLinks = [
    { icon: Facebook, href: settings?.facebook_url || "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: settings?.instagram_url || "https://instagram.com", label: "Instagram" },
    { icon: Twitter, href: settings?.twitter_url || "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: settings?.linkedin_url || "https://linkedin.com", label: "LinkedIn" },
    { icon: Github, href: settings?.github_url || "https://github.com", label: "GitHub" },
  ];

  const handleNavClick = (href: string) => {
    // Check if it's a hash link for the home page
    if (href.startsWith("#")) {
      if (location.pathname === "/") {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        navigate("/");
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } else {
      navigate(href);
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {settings?.site_logo ? (
                <img
                  src={settings.site_logo}
                  alt={settings?.site_name || "Logo"}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-heading font-bold text-lg leading-tight text-foreground">
                  {settings?.site_name || "BCA Association"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {settings?.site_subtitle || "MMAMC Nepal"}
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Empowering future tech leaders through AI-powered learning,
              collaborative projects, and industry connections.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{settings?.address || "MMAMC College, Biratnagar, Nepal"}</span>
              </div>
              <a
                href={`mailto:${settings?.email_primary || "bca@mmamc.edu.np"}`}
                className="flex items-center gap-3 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-primary" />
                <span>{settings?.email_primary || "bca@mmamc.edu.np"}</span>
              </a>
              <a
                href={`tel:${settings?.phone || "+97721123456"}`}
                className="flex items-center gap-3 hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-primary" />
                <span>{settings?.phone || "+977 21-123456"}</span>
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings?.site_name || "BCA Association"}, MMAMC College. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <span className="flex items-center gap-1">
              Made with ❤️ by{" "}
              <a 
                href="https://www.instagram.com/me_saifali/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium"
              >
                Saif Ali
              </a>
              <span className="flex items-center gap-1 ml-1">
                <a 
                  href="https://github.com/mesaifali" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                  aria-label="Developer GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.instagram.com/me_saifali/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                  aria-label="Developer Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
