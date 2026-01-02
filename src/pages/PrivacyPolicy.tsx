import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Eye, Lock, Database, Share2, Bell, Mail, FileText } from "lucide-react";

const sections = [
  {
    icon: Eye,
    title: "Information We Collect",
    content: [
      "Personal information you provide during registration (name, email, phone number)",
      "Academic information (semester, batch, skills)",
      "Profile information (bio, social media links, avatar)",
      "Usage data and activity logs within the platform",
      "Content you create or share (forum posts, comments, resources)",
    ],
  },
  {
    icon: Database,
    title: "How We Use Your Information",
    content: [
      "To provide and maintain our services",
      "To personalize your experience and recommend relevant content",
      "To communicate with you about events, updates, and announcements",
      "To track achievements and maintain leaderboards",
      "To improve our platform based on usage patterns",
      "To ensure security and prevent abuse",
    ],
  },
  {
    icon: Share2,
    title: "Information Sharing",
    content: [
      "We do not sell your personal information to third parties",
      "Your public profile information is visible to other members",
      "We may share anonymized, aggregated data for research purposes",
      "Information may be disclosed if required by law or to protect rights",
      "Third-party service providers may access data to perform services on our behalf",
    ],
  },
  {
    icon: Lock,
    title: "Data Security",
    content: [
      "We implement industry-standard security measures",
      "Data is encrypted in transit and at rest",
      "Regular security audits and vulnerability assessments",
      "Access to personal data is restricted to authorized personnel",
      "We maintain secure backup and disaster recovery procedures",
    ],
  },
  {
    icon: Bell,
    title: "Your Rights",
    content: [
      "Access and download your personal data",
      "Request correction of inaccurate information",
      "Delete your account and associated data",
      "Opt-out of non-essential communications",
      "Control visibility of your profile information",
    ],
  },
  {
    icon: FileText,
    title: "Cookies & Tracking",
    content: [
      "We use essential cookies for authentication and session management",
      "Analytics cookies help us understand platform usage",
      "You can control cookie preferences through your browser settings",
      "Third-party services may set their own cookies",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 1, 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="text-muted-foreground leading-relaxed">
              BCA Association MMAMC ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our platform. Please read this privacy policy carefully. If you do not agree 
              with the terms of this privacy policy, please do not access the platform.
            </p>
          </motion.div>

          {/* Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              <div className="pl-13 ml-[52px]">
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 p-6 bg-card border border-border rounded-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Contact Us About Privacy
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              If you have questions or comments about this privacy policy, please contact us at:
            </p>
            <div className="text-muted-foreground">
              <p><strong className="text-foreground">Email:</strong> bca@mmamc.edu.np</p>
              <p><strong className="text-foreground">Address:</strong> MMAMC College, Biratnagar, Nepal</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
