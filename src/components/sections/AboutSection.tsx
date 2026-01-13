import { motion, easeOut } from "framer-motion";
import { Target, Eye, Heart, Zap } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission",
    description: "To foster a collaborative learning environment that empowers BCA students to excel in technology and innovation.",
    color: "from-blue-500/20 to-cyan-500/20"
  },
  {
    icon: Eye,
    title: "Vision",
    description: "To become Nepal's leading student-driven tech community, producing industry-ready graduates and entrepreneurs.",
    color: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: Heart,
    title: "Values",
    description: "Collaboration, continuous learning, innovation, inclusivity, and commitment to excellence in all endeavors.",
    color: "from-red-500/20 to-orange-500/20"
  },
  {
    icon: Zap,
    title: "Impact",
    description: "Bridging the gap between academia and industry through practical workshops, mentorship, and real-world projects.",
    color: "from-yellow-500/20 to-amber-500/20"
  },
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100 }
  }
};

export function AboutSection() {
  return (
    <section id="about" className="relative py-20 md:py-32 bg-background overflow-hidden">
      {/* Background Decorative Element */}
      {/* Removed for minimalism */}

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              About Us
            </motion.span>

            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Shaping Tomorrow's{" "}
              <span className="gradient-text">Tech Leaders</span>
            </h2>

            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              The BCA Association of MMAMC College is a student-led organization
              dedicated to enhancing the academic and professional journey of
              Bachelor of Computer Applications students.
            </p>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Founded with a vision to bridge the gap between classroom learning
              and industry demands, we provide a platform for students to
              collaborate, innovate, and grow.
            </p>

            {/* Stats Inline Animation */}
            <div className="flex flex-wrap gap-8">
              {[
                { label: "Founded", value: "Est. 2020", color: "text-primary" },
                { label: "Members", value: "500+", color: "text-secondary" },
                { label: "Alumni", value: "150+", color: "text-accent" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  viewport={{ once: true }}
                >
                  <div className={`font-heading text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Values Grid with Staggered Animation */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.2 }
                }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Subtle Hover Background Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 text-primary"
                  >
                    <value.icon className="w-6 h-6" />
                  </motion.div>

                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}