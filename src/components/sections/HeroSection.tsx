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
    delaySpeed: 2000,
  });

  // Mouse position track - HeroSection भित्र मात्र
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
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOut } },
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10"
    >
      {/* Black Background */}
      <div className="absolute inset-0 bg-black" />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-blue-950/20" />

      {/* Mouse Glow Effect*/}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 211, 238, 0.15), transparent 80%)`,
        }}
      />

      {/* Floating Tech Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { Icon: Code, size: 110, top: "15%", left: "8%", delay: 0 },
          { Icon: Cpu, size: 90, top: "18%", right: "10%", delay: 2 },
          { Icon: Terminal, size: 80, bottom: "32%", left: "8%", delay: 1 },
          { Icon: Database, size: 85, bottom: "22%", right: "12%", delay: 3 },
          { Icon: Laptop, size: 130, top: "45%", left: "-6%", delay: 0 },
        ].map(({ Icon, size, top, left, right, bottom, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              y: i % 2 === 0 ? [0, -30, 0] : [0, 30, 0],
              x: i === 2 ? [0, 40, 0] : [0, -20, 0],
              rotate: i === 4 ? [0, 360] : [0, 15, -15, 0],
              opacity: [0.15, 0.35, 0.15], // अझ subtle breathing
            }}
            transition={{
              y: { duration: 18 + i * 2, repeat: Infinity, ease: "easeInOut" },
              x: { duration: 20 + i * 2, repeat: Infinity, ease: "easeInOut" },
              rotate: {
                duration: i === 4 ? 80 : 22,
                repeat: Infinity,
                ease: "linear",
              },
              opacity: {
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              },
            }}
            style={{ top, left, right, bottom }}
            className="absolute text-cyan-400/50 drop-shadow-2xl" 
          >
            <Icon size={size} strokeWidth={0.6} />{" "}
            
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-30">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center space-y-10 md:space-y-14"
        >
          {/* Neon Badge */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/70 backdrop-blur-xl border border-cyan-400/50 shadow-2xl shadow-cyan-500/30 mt-10">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              <span className="text-sm md:text-base font-semibold text-cyan-200 tracking-wide">
                Powered by AI • Built for Success
              </span>
            </div>
          </motion.div>

          {/* Heading + Typewriter */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Empowering Future
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-200 to-blue-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]">
                Tech Leaders
              </span>
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 font-medium mt-8 min-h-[60px]">
              <span className="text-cyan-300">{text}</span>
              <Cursor cursorColor="#06b6d4" />
            </h2>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4"
          >
            Official BCA Association of MMAMC College, Nepal. Connect, learn,
            and grow through workshops, collaborative projects, events, and
            industry networks.
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold px-10 py-7 text-lg rounded-2xl shadow-2xl shadow-cyan-500/50 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Started
                <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-4 group-hover:scale-110" />
              </span>
              <motion.div
                className="absolute inset-0 bg-white/30"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-200 hover:text-cyan-100 px-10 py-7 text-lg rounded-2xl backdrop-blur-sm shadow-xl transition-all duration-300"
              onClick={() =>
                document
                  .querySelector("#features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Features
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 opacity-50">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 100C120 80 240 40 360 35C480 30 600 40 720 50C840 60 960 70 1080 65C1200 60 1320 40 1380 30L1440 20V120H0Z"
            fill="url(#wave_gradient)"
          />
          <defs>
            <linearGradient id="wave_gradient" x1="0" y1="0" x2="1440" y2="120">
              <stop stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="1" stopColor="#1e293b" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
}
