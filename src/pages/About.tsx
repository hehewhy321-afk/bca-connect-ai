import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  GraduationCap, 
  Users, 
  Target, 
  Heart, 
  Lightbulb, 
  Award,
  BookOpen,
  Globe,
  Rocket
} from "lucide-react";

const stats = [
  { label: "Active Members", value: "500+", icon: Users },
  { label: "Resources Shared", value: "1,000+", icon: BookOpen },
  { label: "Events Organized", value: "50+", icon: Award },
  { label: "Alumni Network", value: "200+", icon: Globe },
];

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We embrace new technologies and encourage creative problem-solving.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We foster a supportive environment where everyone can learn and grow together.",
  },
  {
    icon: Target,
    title: "Excellence",
    description: "We strive for academic and professional excellence in everything we do.",
  },
  {
    icon: Heart,
    title: "Inclusivity",
    description: "We welcome diverse perspectives and ensure equal opportunities for all.",
  },
];

const team = [
  {
    name: "Student Executive Committee",
    description: "Elected student leaders who oversee day-to-day operations and events.",
  },
  {
    name: "Faculty Advisors",
    description: "Experienced professors providing guidance and institutional support.",
  },
  {
    name: "Alumni Mentors",
    description: "Industry professionals sharing real-world insights and career advice.",
  },
  {
    name: "Technical Team",
    description: "Student developers maintaining and improving the platform.",
  },
];

export default function About() {
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
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
              About BCA Association
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Empowering future tech leaders through collaboration, innovation, and excellence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              BCA Association MMAMC is dedicated to bridging the gap between academic learning and 
              industry requirements. We provide a platform for BCA students to collaborate, share 
              knowledge, access resources, and build connections that will help them succeed in 
              their careers. Through events, workshops, and mentorship programs, we prepare our 
              members for the challenges of the tech industry.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground">The principles that guide everything we do.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-foreground">Our Story</h2>
            </div>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                BCA Association MMAMC was founded in 2020 by a group of passionate BCA students 
                who recognized the need for a stronger community among tech students. What started 
                as informal study groups and coding sessions has grown into a vibrant organization 
                serving hundreds of students.
              </p>
              <p className="mt-4">
                Over the years, we have organized numerous workshops, hackathons, and career fairs. 
                We've built an extensive library of study materials and created a platform that 
                connects current students with successful alumni. Our AI-powered features help 
                students learn more effectively and prepare for their careers.
              </p>
              <p className="mt-4">
                Today, we continue to evolve and expand our offerings, always keeping our core 
                mission in mind: to help every BCA student at MMAMC College succeed in their 
                academic journey and beyond.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Our Team</h2>
            <p className="text-muted-foreground">The people behind BCA Association.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {member.name}
                </h3>
                <p className="text-muted-foreground">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-muted-foreground mb-6">
              Become a part of the BCA Association and start your journey today.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
