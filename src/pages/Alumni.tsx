import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  Building2,
  Briefcase,
  Calendar,
  Github,
  Linkedin,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Alumni {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  batch: string | null;
  bio: string | null;
  skills: string[] | null;
  github_url: string | null;
  linkedin_url: string | null;
  graduation_year: number | null;
  current_company: string | null;
  job_title: string | null;
  xp_points: number;
  level: number;
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_alumni", true)
        .order("graduation_year", { ascending: false });

      if (error) throw error;
      setAlumni(data || []);
    } catch (error) {
      console.error("Error fetching alumni:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter(
    (member) =>
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.current_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.batch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Alumni Network
            </h1>
          </div>
          <p className="text-muted-foreground">
            Connect with our graduated members and explore their career journeys.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-primary">
              {alumni.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Alumni</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Building2 className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-secondary">
              {new Set(alumni.filter(a => a.current_company).map(a => a.current_company)).size}
            </p>
            <p className="text-sm text-muted-foreground">Companies</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Briefcase className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-accent">
              {alumni.filter(a => a.job_title).length}
            </p>
            <p className="text-sm text-muted-foreground">Working</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-heading text-2xl font-bold text-primary">
              {new Set(alumni.filter(a => a.graduation_year).map(a => a.graduation_year)).size}
            </p>
            <p className="text-sm text-muted-foreground">Grad Years</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search alumni by name, company, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Alumni Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-foreground mb-2">
              No alumni found
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "Try a different search term" : "Alumni profiles will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlumni.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {member.full_name}
                    </h3>
                    {member.job_title && (
                      <p className="text-sm text-primary font-medium truncate">
                        {member.job_title}
                      </p>
                    )}
                    {member.current_company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {member.current_company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {member.graduation_year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Class of {member.graduation_year}
                      </span>
                    )}
                    {member.batch && (
                      <span>Batch: {member.batch}</span>
                    )}
                  </div>
                  
                  {member.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {member.bio}
                    </p>
                  )}
                </div>

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.skills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                        +{member.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Social Links */}
                <div className="flex items-center gap-2">
                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Github className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  <div className="ml-auto text-xs text-muted-foreground">
                    Level {member.level} • {member.xp_points} XP
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
