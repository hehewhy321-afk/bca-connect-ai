import { motion } from "framer-motion";
import { Target, Eye, Heart, Zap } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission",
    description:
      "To foster a collaborative learning environment that empowers BCA students to excel in technology and innovation.",
  },
  {
    icon: Eye,
    title: "Vision",
    description:
      "To become Nepal's leading student-driven tech community, producing industry-ready graduates and entrepreneurs.",
  },
  {
    icon: Heart,
    title: "Values",
    description:
      "Collaboration, continuous learning, innovation, inclusivity, and commitment to excellence in all endeavors.",
  },
  {
    icon: Zap,
    title: "Impact",
    description:
      "Bridging the gap between academia and industry through practical workshops, mentorship, and real-world projects.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              About Us
            </span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Shaping Tomorrow's{" "}
              <span className="gradient-text">Tech Leaders</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              The BCA Association of MMAMC College is a student-led organization
              dedicated to enhancing the academic and professional journey of
              Bachelor of Computer Applications students.
            </p>
            <p className="text-muted-foreground mb-8">
              Founded with a vision to bridge the gap between classroom learning
              and industry demands, we provide a platform for students to
              collaborate, innovate, and grow. From coding workshops to industry
              seminars, hackathons to career fairs, we create opportunities that
              transform students into industry-ready professionals.
            </p>

            {/* Stats Inline */}
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="font-heading text-3xl font-bold text-primary">
                  Est. 2020
                </div>
                <div className="text-sm text-muted-foreground">Founded</div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-secondary">
                  500+
                </div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-accent">
                  150+
                </div>
                <div className="text-sm text-muted-foreground">Alumni</div>
              </div>
            </div>
          </motion.div>

          {/* Right - Values Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
