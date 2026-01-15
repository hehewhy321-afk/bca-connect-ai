import { useEffect, useState, useRef } from "react";
import { motion, easeOut } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Code,
  Cpu,
  Terminal,
  Database,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useTypewriter, Cursor } from "react-simple-typewriter";

export function HeroSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [text] = useTypewriter({
    words: [
      "BCA Community",
      "Innovation Hub",
      "Skill Builders",
      "Future Leaders",
    ],
    loop: true,
    typeSpeed: 80,
    deleteSpeed: 50,
    delaySpeed: 2000,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: easeOut },
    },
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16 px-4"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background" />
      {/* Minimalist: Removed radial gradient overlay */}

      {/* Mouse Reactive Ambient Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(218, 120, 9, 0.08), transparent 80%)`,
        }}
      />

      {/* Floating Animated Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-40">
        {[
          { Icon: Code, size: 40, top: "15%", left: "10%", delay: 0 },
          { Icon: Cpu, size: 30, top: "20%", right: "15%", delay: 1 },
          { Icon: Terminal, size: 35, bottom: "25%", left: "15%", delay: 2 },
          { Icon: Database, size: 45, bottom: "20%", right: "10%", delay: 3 },
          { Icon: Laptop, size: 50, top: "45%", left: "5%", delay: 4 },
        ].map(({ Icon, size, top, left, right, bottom, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
            style={{ top, left, right, bottom }}
            className="absolute text-primary/40"
          >
            <Icon size={size} strokeWidth={1} />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="container mx-auto relative z-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary tracking-wide">
                BCA Association • MMAMC
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              Empowering the Next
              <br />
              <span className="text-gradient font-black">Generation of Devs</span>
            </h1>
            <div className="text-xl md:text-2xl text-muted-foreground font-medium h-[40px]">
              We are <span className="text-primary italic">{text}</span>
              <Cursor cursorColor="#da7809" />
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            A community of BCA students at MMAMC, dedicated to fostering innovation,
            collaboration, and professional growth.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <ShimmerButton
              onClick={() => navigate("/auth")}
              className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20"
              background="hsl(var(--primary))"
              shimmerColor="#ffffff"
              shimmerSize="0.1em"
              shimmerDuration="2.5s"
              borderRadius="1rem"
            >
              <span className="relative z-10 flex items-center gap-2">
                Join Our Community
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </ShimmerButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Micro-Interactions: Grid Lines */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#da7809_1px,transparent_1px),linear-gradient(to_bottom,#da7809_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    </section>
  );
}
