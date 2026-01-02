import { motion } from "framer-motion";
import {
  Bot,
  Users,
  Calendar,
  BookOpen,
  Trophy,
  MessageSquare,
  Briefcase,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Study Assistant",
    description:
      "Get instant help with BCA curriculum questions, code debugging, and practice problems powered by advanced AI.",
    color: "from-primary to-primary/70",
  },
  {
    icon: Users,
    title: "Member Management",
    description:
      "Digital ID cards, skill tracking, batch organization, and seamless alumni network integration.",
    color: "from-secondary to-secondary/70",
  },
  {
    icon: Calendar,
    title: "Smart Events",
    description:
      "AI-powered event recommendations, QR check-ins, live streaming, and automatic certificate generation.",
    color: "from-accent to-accent/70",
  },
  {
    icon: BookOpen,
    title: "Resource Hub",
    description:
      "Access study materials, past papers with AI solutions, project repos, and interview prep resources.",
    color: "from-primary to-accent",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Earn XP points, unlock badges, climb leaderboards, and complete challenges to showcase your skills.",
    color: "from-secondary to-primary",
  },
  {
    icon: MessageSquare,
    title: "Discussion Forum",
    description:
      "Reddit-style threading, code highlighting, real-time markdown editing, and AI-powered moderation.",
    color: "from-accent to-secondary",
  },
  {
    icon: Briefcase,
    title: "Career Portal",
    description:
      "AI career advisor, skill assessments, mentorship matching, and direct job referrals from alumni.",
    color: "from-primary to-secondary",
  },
  {
    icon: Shield,
    title: "Verified Credentials",
    description:
      "Blockchain-based certificate verification with tamper-proof digital credentials and QR validation.",
    color: "from-accent to-primary",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover powerful tools designed to enhance your learning journey,
            career growth, and community engagement.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Gradient */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
