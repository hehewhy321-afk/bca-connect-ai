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
import { useTypewriter, Cursor } from "react-simple-typewriter";

export function HeroSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [text] = useTypewriter({
    words: [
      "Tech Community",
      "Innovation Hub",
      "Skill Builders",
      "Future Leaders",
    ],
    loop: true,
    typeSpeed: 80,
    deleteSpeed: 50,
    delaySpeed: 2200,
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
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: easeOut },
    },
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 px-4"
    >
      {/* Deep Black Base */}
      <div className="absolute inset-0 bg-black" />

      {/* Very Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/10 via-black to-indigo-950/10" />

      {/* Soft Mouse Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `radial-gradient(900px at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 211, 238, 0.12), transparent 80%)`,
        }}
      />

      {/* Balanced Floating Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { Icon: Code, size: 100, top: "12%", left: "6%", delay: 0 },
          { Icon: Cpu, size: 85, top: "15%", right: "8%", delay: 3 },
          { Icon: Terminal, size: 75, bottom: "35%", left: "10%", delay: 1 },
          { Icon: Database, size: 80, bottom: "20%", right: "15%", delay: 4 },
          { Icon: Laptop, size: 120, top: "50%", left: "-4%", delay: 2 },
        ].map(({ Icon, size, top, left, right, bottom, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              y: i % 2 === 0 ? [0, -25, 0] : [0, 25, 0],
              x: i === 2 ? [0, 30, 0] : [0, -15, 0],
              rotate: i === 4 ? [0, 360] : [0, 10, -10, 0],
              opacity: [0.08, 0.22, 0.08], 
            }}
            transition={{
              y: { duration: 22 + i * 3, repeat: Infinity, ease: "easeInOut" },
              x: { duration: 24 + i * 3, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: i === 4 ? 90 : 25, repeat: Infinity, ease: "linear" },
              opacity: { duration: 14, repeat: Infinity, ease: "easeInOut", delay },
            }}
            style={{ top, left, right, bottom }}
            className="absolute text-cyan-400/50" 
          >
            <Icon size={size} strokeWidth={0.5} />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="container mx-auto relative z-30">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center space-y-10 md:space-y-14"
        >
          {/* Elegant Neon Badge */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-black/60 backdrop-blur-md border border-cyan-400/40 shadow-2xl shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              <span className="text-sm md:text-base font-medium text-cyan-100 tracking-wider">
                Powered by AI • Built for Success
              </span>
            </div>
          </motion.div>

          {/* Hero Heading */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              Empowering Future
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-blue-300 drop-shadow-2xl">
                Tech Leaders
              </span>
            </h1>

            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 font-light mt-8 min-h-[60px]">
              <span className="text-cyan-300 font-medium">{text}</span>
              <Cursor cursorColor="#06b6d4" />
            </h2>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed px-4"
          >
            Official BCA Association of MMAMC College, Nepal. Connect, learn, and grow through workshops, collaborative projects, events, and industry networks.
          </motion.p>

          {/* Clean & Elegant Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4"
          >
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="group relative px-10 py-6 text-lg font-semibold rounded-2xl border-2 border-cyan-400/70 text-cyan-200 hover:text-cyan-50 hover:border-cyan-300 hover:bg-cyan-500/5 backdrop-blur-sm shadow-xl transition-all duration-500"
            >
              <span className="flex items-center gap-4">
                Get Started
                <ArrowRight className="w-6 h-6 transition-all duration-500 group-hover:translate-x-3 group-hover:scale-110" />
              </span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="px-10 py-6 text-lg font-semibold rounded-2xl border-2 border-cyan-400/50 text-cyan-300 hover:text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/5 backdrop-blur-sm shadow-xl transition-all duration-500"
              onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Features
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}