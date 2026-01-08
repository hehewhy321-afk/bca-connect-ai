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
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Member Management",
    description: "Digital ID cards, skill tracking, batch organization, and seamless alumni network integration.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Smart Events",
    description: "AI-powered recommendations, QR check-ins, live streaming, and automatic certificates.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BookOpen,
    title: "Resource Hub",
    description: "Access study materials, past papers with AI solutions, project repos, and prep resources.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn XP points, unlock badges, climb leaderboards, and complete challenges to showcase skills.",
    color: "from-blue-600 to-indigo-600",
  },
  {
    icon: MessageSquare,
    title: "Discussion Forum",
    description: "Reddit-style threading, code highlighting, real-time editing, and AI moderation.",
    color: "from-pink-600 to-rose-600",
  },
  {
    icon: Briefcase,
    title: "Career Portal",
    description: "AI career advisor, skill assessments, mentorship matching, and job referrals.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "Verified Credentials",
    description: "Blockchain-based certificate verification with tamper-proof digital credentials.",
    color: "from-indigo-500 to-blue-700",
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
    <section id="features" className="py-16 md:py-24 lg:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-5">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12 md:mb-20"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            Platform Features
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg leading-relaxed px-2">
            Discover powerful tools designed to enhance your learning journey,
            career growth, and community engagement.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileTap={{ scale: 0.97 }} // Touch feedback for mobile
              className="group relative h-full"
            >
              <div className="relative h-full p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden">
                
                {/* Gradient Background Decoration */}
                <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${feature.color} opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-opacity`} />

                {/* Icon Container */}
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-500`}
                >
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-2">
                  {feature.description}
                </p>

                {/* Subtle Hover Indicator */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-transparent group-hover:w-full transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}