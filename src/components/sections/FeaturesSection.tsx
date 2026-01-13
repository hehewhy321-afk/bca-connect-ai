import { motion, easeOut } from "framer-motion";
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
    description: "Get instant help with BCA curriculum, code debugging, and practice problems powered by advanced AI.",
    color: "from-primary to-accent",
  },
  {
    icon: Users,
    title: "Member Management",
    description: "Digital ID cards, skill tracking, batch organization, and seamless alumni network integration.",
    color: "from-primary/80 to-primary",
  },
  {
    icon: Calendar,
    title: "Smart Events",
    description: "AI-powered recommendations, QR check-ins, live streaming, and automatic certificates.",
    color: "from-accent to-primary",
  },
  {
    icon: BookOpen,
    title: "Resource Hub",
    description: "Access study materials, past papers with AI solutions, project repos, and prep resources.",
    color: "from-primary to-secondary",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn XP points, unlock badges, climb leaderboards, and complete challenges to showcase skills.",
    color: "from-secondary to-primary",
  },
  {
    icon: MessageSquare,
    title: "Discussion Forum",
    description: "Reddit-style threading, code highlighting, real-time editing, and AI moderation.",
    color: "from-primary/60 to-primary",
  },
  {
    icon: Briefcase,
    title: "Career Portal",
    description: "AI career advisor, skill assessments, mentorship matching, and job referrals.",
    color: "from-accent to-secondary",
  },
  {
    icon: Shield,
    title: "Verified Credentials",
    description: "Blockchain-based certificate verification with tamper-proof digital credentials.",
    color: "from-primary to-accent",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background Decor */}
      {/* Background Decor - Removed for minimalism */}

      <div className="container mx-auto px-6">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6 border border-primary/20">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-6">
            Everything You Need to{" "}
            <span className="text-gradient">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
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
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="relative h-full p-8 rounded-[2.5rem] bg-card border border-border shadow-sm transition-all duration-500 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 flex flex-col items-center text-center overflow-hidden">

                {/* Background Shadow Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon Container */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 active:scale-95 transition-transform duration-500`}
                >
                  <feature.icon className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Subtle Hover Indicator */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity group-hover:animate-ping" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
