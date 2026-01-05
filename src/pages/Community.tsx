import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Github, Linkedin, Mail, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  batch: string | null;
  semester: number | null;
  bio: string | null;
  skills: string[] | null;
  github_url: string | null;
  linkedin_url: string | null;
  xp_points: number;
  level: number;
  is_alumni: boolean;
}

export default function Community() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("xp_points", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.batch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      filterType === "all" ||
      (filterType === "alumni" && member.is_alumni) ||
      (filterType === "students" && !member.is_alumni);
    return matchesSearch && matchesFilter;
  });

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
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Community
          </h1>
          <p className="text-muted-foreground">
            Connect with fellow BCA students and alumni.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, batch, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "students" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("students")}
            >
              Students
            </Button>
            <Button
              variant={filterType === "alumni" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("alumni")}
            >
              Alumni
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="font-heading text-2xl font-bold text-primary">
              {members.length}
            </p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="font-heading text-2xl font-bold text-accent">
              {members.filter((m) => !m.is_alumni).length}
            </p>
            <p className="text-sm text-muted-foreground">Students</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="font-heading text-2xl font-bold text-secondary">
              {members.filter((m) => m.is_alumni).length}
            </p>
            <p className="text-sm text-muted-foreground">Alumni</p>
          </div>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-48 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-foreground mb-2">
              No members found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                {/* Avatar & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(member.full_name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {member.full_name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {member.batch && (
                        <span className="text-xs text-muted-foreground">
                          {member.batch}
                        </span>
                      )}
                      {member.is_alumni && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs">
                          Alumni
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Semester Info */}
                {!member.is_alumni && member.semester && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Semester {member.semester}
                  </p>
                )}

                {/* Bio */}
                {member.bio && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {member.bio}
                  </p>
                )}

                {/* Level & XP */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                    <Award className="w-3 h-3" />
                    Level {member.level}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {member.xp_points} XP
                  </span>
                </div>

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
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
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Github className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  <a
                    href={`mailto:${member.email}`}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
