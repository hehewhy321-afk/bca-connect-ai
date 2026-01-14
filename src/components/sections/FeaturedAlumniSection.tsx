import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Building2,
  Briefcase,
  ArrowRight,
  Linkedin,
  Github,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FeaturedAlumni {
  id: string;
  full_name: string;
  avatar_url: string | null;
  graduation_year: number | null;
  current_company: string | null;
  job_title: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
}

export const FeaturedAlumniSection = () => {
  const [alumni, setAlumni] = useState<FeaturedAlumni[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedAlumni();
  }, []);

  const fetchFeaturedAlumni = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, graduation_year, current_company, job_title, bio, linkedin_url, github_url")
        .eq("is_alumni", true)
        .not("current_company", "is", null)
        .order("graduation_year", { ascending: false })
        .limit(4);

      if (error) throw error;
      setAlumni(data || []);
    } catch (error) {
      console.error("Error fetching featured alumni:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (alumni.length === 0) {
    return null;
  }

  return (
    <section id="featured-alumni" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm font-medium">Success Stories</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Alumni
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet our successful graduates making an impact in the tech industry
          </p>
        </motion.div>

        {/* Alumni Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {alumni.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-xl md:rounded-2xl border border-border p-4 md:p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              {/* Avatar */}
              <div className="flex justify-center mb-3 md:mb-4">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg md:text-xl font-bold">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="text-center">
                <h3 className="font-heading font-semibold text-sm md:text-base text-foreground mb-1 line-clamp-1">
                  {member.full_name}
                </h3>

                {member.job_title && (
                  <p className="text-xs md:text-sm text-primary font-medium flex items-center justify-center gap-1 mb-1 line-clamp-1">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1">{member.job_title}</span>
                  </p>
                )}

                {member.current_company && (
                  <p className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1 mb-2 md:mb-3 line-clamp-1">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1">{member.current_company}</span>
                  </p>
                )}

                {member.graduation_year && (
                  <span className="inline-block px-2.5 py-0.5 md:px-3 md:py-1 bg-accent/10 text-accent rounded-full text-xs font-medium mb-2 md:mb-3">
                    Class of {member.graduation_year}
                  </span>
                )}

                {member.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 md:mb-4 hidden md:block">
                    {member.bio}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex items-center justify-center gap-2">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 md:p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </a>
                  )}
                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 md:p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Github className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Link to="/auth">
            <Button variant="outline" className="group">
              View All Alumni
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
