import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Users, Calendar, BookOpen, Code, Cpu, Terminal, Database, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  members: number;
  events: number;
  resources: number;
}

export function HeroSection() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ members: 0, events: 0, resources: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [profilesRes, eventsRes, resourcesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("resources").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        members: profilesRes.count || 0,
        events: eventsRes.count || 0,
        resources: resourcesRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statItems = [
    { icon: Users, value: `${stats.members}+`, label: "Active Members" },
    { icon: Calendar, value: `${stats.events}+`, label: "Events" },
    { icon: BookOpen, value: `${stats.resources}+`, label: "Resources" },
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent/80" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />

      {/* --- Floating Background Icons --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Code Icon - Top Left */}
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[5%] text-white"
        >
          <Code size={120} strokeWidth={0.5} />
        </motion.div>

        {/* Cpu Icon - Top Right */}
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, -10, 0], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[8%] text-white"
        >
          <Cpu size={100} strokeWidth={0.5} />
        </motion.div>

        {/* Terminal Icon - Bottom Left */}
        <motion.div
          animate={{ x: [0, 20, 0], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[25%] left-[10%] text-white"
        >
          <Terminal size={80} strokeWidth={0.5} />
        </motion.div>

        {/* Database Icon - Bottom Right */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[15%] right-[12%] text-white"
        >
          <Database size={90} strokeWidth={0.5} />
        </motion.div>

        {/* Laptop Icon - Middle Left */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-[45%] left-[-2%] text-white opacity-10"
        >
          <Laptop size={140} strokeWidth={0.5} />
        </motion.div>
      </div>
      
      {/* Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary-foreground">
              Powered by AI • Built for Success
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6"
          >
            Empowering Future
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-secondary/70">
              Tech Leaders
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10"
          >
            Join the official BCA Association of MMAMC College, Nepal. Connect,
            learn, and grow with AI-powered tools, collaborative projects, and
            industry connections.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button variant="hero" size="xl" className="group" onClick={() => navigate("/auth")}>
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="heroOutline" size="xl" onClick={() => {
              document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" });
            }}>
              Explore Features
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-4 text-center border border-white/10 shadow-lg"
              >
                <stat.icon className="w-6 h-6 text-secondary mx-auto mb-2" />
                <div className="font-heading text-2xl font-bold text-primary-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-primary-foreground/70 uppercase tracking-wider font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}