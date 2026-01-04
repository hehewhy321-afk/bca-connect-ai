import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
interface Member {
  id: string;
  full_name: string;
  avatar_url: string | null;
  batch: string | null;
  is_alumni: boolean | null;
}
const testimonials = [{
  name: "Aarav Sharma",
  role: "BCA 4th Semester",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  content: "The AI study assistant helped me ace my database exam. It's like having a personal tutor available 24/7!",
  rating: 5
}, {
  name: "Priya Thapa",
  role: "BCA 6th Semester",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  content: "The project showcase platform connected me with industry mentors. I landed my first internship through the alumni network!",
  rating: 5
}, {
  name: "Rohan Maharjan",
  role: "BCA Graduate 2025",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
  content: "From coding workshops to hackathons, BCA Association gave me the skills and confidence to start my tech career.",
  rating: 5
}];
export function CommunitySection() {
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    alumni: 0,
    batches: 0
  });
  useEffect(() => {
    fetchStats();
  }, []);
  const fetchStats = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("profiles").select("batch, is_alumni");
      if (error) throw error;
      const uniqueBatches = new Set(data?.filter(p => p.batch).map(p => p.batch));
      const alumniCount = data?.filter(p => p.is_alumni).length || 0;
      const studentCount = data?.filter(p => !p.is_alumni).length || 0;
      setStats({
        total: data?.length || 0,
        students: studentCount,
        alumni: alumniCount,
        batches: uniqueBatches.size
      });
    } catch (error) {
      console.error("Error fetching community stats:", error);
    }
  };
  const statItems = [{
    value: `${stats.total}+`,
    label: "Active Members"
  }, {
    value: `${stats.batches}+`,
    label: "Batches Connected"
  }, {
    value: `${stats.alumni}+`,
    label: "Alumni Network"
  }, {
    value: `${stats.students}+`,
    label: "Current Students"
  }];
  return <section id="community" className="py-20 md:py-32 bg-gradient-to-br from-primary via-primary/95 to-accent/80 relative overflow-hidden">
      {/* Pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.5
      }} className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-4">
            Community
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Join Our Thriving <span className="text-secondary">Community</span>
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Be part of a supportive network of students, alumni, and industry
            professionals dedicated to your success.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.5,
        delay: 0.1
      }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {statItems.map((stat, index) => <motion.div key={stat.label} initial={{
          opacity: 0,
          scale: 0.8
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.4,
          delay: 0.2 + index * 0.1
        }} className="glass rounded-2xl p-6 text-center">
              <div className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-primary-foreground/70">
                {stat.label}
              </div>
            </motion.div>)}
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => <motion.div key={testimonial.name} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.3 + index * 0.1
        }} className="rounded-2xl p-6 shadow-xl bg-[sidebar-primary-foreground] bg-slate-950 border-2 border-dotted border-muted opacity-100">
              {/* Quote Icon */}
              <Quote className="w-10 h-10 text-primary/20 mb-4" />

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({
              length: testimonial.rating
            }).map((_, i) => <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />)}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-medium text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>)}
        </div>
      </div>
    </section>;
}