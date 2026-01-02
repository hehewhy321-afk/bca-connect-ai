import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FileText, Users, BookOpen, AlertTriangle, Scale, RefreshCw, Mail } from "lucide-react";

const sections = [
  {
    icon: Users,
    title: "Eligibility & Account",
    content: [
      "You must be a current or former student of MMAMC College or an affiliated institution",
      "You must be at least 16 years of age to use this platform",
      "You are responsible for maintaining the confidentiality of your account credentials",
      "You agree to provide accurate, current, and complete information during registration",
      "One person may only maintain one account",
    ],
  },
  {
    icon: BookOpen,
    title: "Acceptable Use",
    content: [
      "Use the platform for educational and professional development purposes",
      "Respect other members and maintain a positive community environment",
      "Share only content that you have the right to distribute",
      "Give proper attribution when sharing others' work with permission",
      "Report any violations or inappropriate content to administrators",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Prohibited Activities",
    content: [
      "Harassing, bullying, or intimidating other members",
      "Posting spam, advertisements, or promotional content without permission",
      "Sharing copyrighted material without proper authorization",
      "Attempting to gain unauthorized access to the platform or other accounts",
      "Impersonating others or misrepresenting your identity",
      "Using the platform for any illegal or unauthorized purpose",
      "Distributing malware, viruses, or harmful content",
    ],
  },
  {
    icon: FileText,
    title: "Content & Intellectual Property",
    content: [
      "You retain ownership of content you create and share on the platform",
      "By posting content, you grant us a license to display and distribute it on the platform",
      "Study materials and resources are for educational use only",
      "The BCA Association branding and platform design are our intellectual property",
      "User-generated content may be removed if it violates our policies",
    ],
  },
  {
    icon: Scale,
    title: "Disclaimer & Liability",
    content: [
      "The platform is provided 'as is' without warranties of any kind",
      "We do not guarantee the accuracy of user-submitted content",
      "We are not responsible for any loss or damage arising from platform use",
      "Academic materials are supplementary and do not replace official course materials",
      "Career advice and resources are informational and not professional guidance",
    ],
  },
  {
    icon: RefreshCw,
    title: "Modifications & Termination",
    content: [
      "We reserve the right to modify these terms at any time",
      "Continued use after modifications constitutes acceptance of new terms",
      "We may suspend or terminate accounts that violate these terms",
      "You may delete your account at any time through the settings page",
      "Upon termination, your public content may remain visible to others",
    ],
  },
];

export default function TermsOfService() {
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using the BCA Association platform.
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
              Welcome to BCA Association MMAMC. These Terms of Service ("Terms") govern your access to 
              and use of our platform, including any content, features, and services offered. By accessing 
              or using the platform, you agree to be bound by these Terms. If you do not agree to these 
              Terms, you may not access or use the platform.
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

          {/* Governing Law */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Governing Law
              </h2>
            </div>
            <div className="ml-[52px]">
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of Nepal. 
                Any disputes arising from these Terms or your use of the platform shall be subject to 
                the exclusive jurisdiction of the courts of Nepal.
              </p>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12 p-6 bg-card border border-border rounded-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Questions About These Terms?
              </h2>
            </div>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us:
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
