import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Linkedin, Facebook, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FoundingMember {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  bio: string | null;
}

export function FoundingMembersSection() {
  const [members, setMembers] = useState<FoundingMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("founding_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching founding members:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient-primary">Founding</span> Members
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      {/* Background Effects - Removed for minimalism */}

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient-primary">Founding</span> Members
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Meet the visionaries who laid the foundation for our BCA Association
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center group hover:border-primary/50 transition-all duration-300"
            >
              {/* Avatar */}
              <div className="relative mx-auto mb-4 w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="w-full h-full rounded-full object-cover border-2 border-primary/20 group-hover:border-primary/50 transition-colors"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {member.full_name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name & Role */}
              <h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {member.full_name}
              </h3>
              <p className="text-primary text-sm font-medium mb-3">
                {member.role}
              </p>

              {/* Bio */}
              {member.bio && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {member.bio}
                </p>
              )}

              {/* Social Links */}
              <div className="flex items-center justify-center gap-3">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                    title="Phone"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {member.linkedin_url && (
                  <a
                    href={member.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-[#0077b5] hover:text-white transition-all"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {member.facebook_url && (
                  <a
                    href={member.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-[#1877f2] hover:text-white transition-all"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {member.twitter_url && (
                  <a
                    href={member.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-[#1da1f2] hover:text-white transition-all"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}