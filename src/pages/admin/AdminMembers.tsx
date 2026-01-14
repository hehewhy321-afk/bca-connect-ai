import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Users,
  Mail,
  Award,
  Shield,
  UserCheck,
  UserX,
  GraduationCap,
  Ban,
  ShieldOff,
  Filter,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BanUserDialog } from "@/components/admin/BanUserDialog";

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  batch: string | null;
  semester: number | null;
  xp_points: number;
  level: number;
  is_alumni: boolean;
  is_banned: boolean;
  ban_expires_at: string | null;
  ban_reason: string | null;
  role?: string;
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const userIds = profiles?.map((p) => p.user_id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const rolesMap: Record<string, string> = {};
      roles?.forEach((r) => {
        rolesMap[r.user_id] = r.role;
      });

      const membersWithRoles: Member[] = profiles?.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name || "",
        email: p.email || "",
        avatar_url: p.avatar_url,
        batch: p.batch,
        semester: p.semester,
        xp_points: p.xp_points || 0,
        level: p.level || 1,
        is_alumni: p.is_alumni || false,
        is_banned: p.is_banned || false,
        ban_expires_at: p.ban_expires_at || null,
        ban_reason: p.ban_reason || null,
        role: rolesMap[p.user_id] || "member",
      })) || [];

      setMembers(membersWithRoles);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole as any });
        if (error) throw error;
      }

      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
      );

      toast({
        title: "Role updated",
        description: `User role has been changed to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const handleAlumniToggle = async (userId: string, isAlumni: boolean) => {
    try {
      const updateData: any = {
        is_alumni: isAlumni,
      };
      
      if (isAlumni) {
        updateData.semester = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, is_alumni: isAlumni, semester: isAlumni ? null : m.semester } : m))
      );

      toast({
        title: "Alumni status updated",
        description: `User has been ${isAlumni ? "marked as" : "removed from"} alumni.`,
      });
    } catch (error) {
      console.error("Error updating alumni status:", error);
      toast({
        title: "Error",
        description: "Failed to update alumni status.",
        variant: "destructive",
      });
    }
  };

  const handleBanClick = (member: Member) => {
    setSelectedMember(member);
    setBanDialogOpen(true);
  };

  const handleBanConfirm = async (durationInDays: number | null, reason: string) => {
    if (!selectedMember) return;

    try {
      const isBanning = !selectedMember.is_banned;
      let banExpiresAt: string | null = null;

      if (isBanning && durationInDays !== null) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationInDays);
        banExpiresAt = expiryDate.toISOString();
      }

      const updateData: any = {
        is_banned: isBanning,
        ban_expires_at: isBanning ? banExpiresAt : null,
        ban_reason: isBanning ? reason : null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", selectedMember.user_id);

      if (error) throw error;

      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === selectedMember.user_id
            ? {
                ...m,
                is_banned: isBanning,
                ban_expires_at: isBanning ? banExpiresAt : null,
                ban_reason: isBanning ? reason : null,
              }
            : m
        )
      );

      toast({
        title: isBanning ? "User banned" : "User unbanned",
        description: isBanning
          ? `${selectedMember.full_name} has been banned${
              durationInDays ? ` for ${durationInDays} days` : " permanently"
            }.`
          : `${selectedMember.full_name} can now access the platform.`,
      });

      setBanDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Error updating ban status:", error);
      toast({
        title: "Error",
        description: "Failed to update ban status.",
        variant: "destructive",
      });
    }
  };

  const filteredMembers = members.filter((member) => {
    // Search filter
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.batch?.toLowerCase().includes(searchQuery.toLowerCase());

    // Semester filter
    const matchesSemester =
      semesterFilter === "all" ||
      (semesterFilter === "alumni" && member.is_alumni) ||
      (semesterFilter !== "alumni" && member.semester?.toString() === semesterFilter);

    // Role filter
    const matchesRole =
      roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesSemester && matchesRole;
  });

  const clearFilters = () => {
    setSemesterFilter("all");
    setRoleFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = semesterFilter !== "all" || roleFilter !== "all" || searchQuery !== "";

  // Get unique semesters from members
  const uniqueSemesters = Array.from(
    new Set(
      members
        .filter((m) => !m.is_alumni && m.semester)
        .map((m) => m.semester)
    )
  ).sort((a, b) => (a || 0) - (b || 0));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary/20 text-primary border border-primary/20",
    moderator: "bg-accent/20 text-accent border border-accent/20",
    member: "bg-white/5 text-muted-foreground border border-white/10",
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Modern Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Link
                to="/admin"
                className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-90"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                  Registry
                </h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                  User base and role management
                </p>
              </div>
            </div>

            <div className="relative group min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by name, email or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>

            {/* Semester Filter */}
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                {uniqueSemesters.map((sem) => (
                  <SelectItem key={sem} value={sem?.toString() || ""}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}

            {/* Active Filter Count */}
            {hasActiveFilters && (
              <span className="text-xs font-bold text-primary px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                {filteredMembers.length} of {members.length} members
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Stats View */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { label: "Community", val: members.length, icon: Users, color: "text-primary" },
            { label: "Privileged", val: members.filter(m => m.role === "admin").length, icon: Shield, color: "text-accent" },
            { label: "Guardians", val: members.filter(m => m.role === "moderator").length, icon: UserCheck, color: "text-primary" },
            { label: "Banned", val: members.filter(m => m.is_banned).length, icon: Ban, color: "text-destructive" }
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-3xl p-6 border border-white/5 flex items-center justify-between group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon size={80} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-foreground tracking-tighter">{stat.val}</p>
              </div>
              <div className={`p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Member Grid/List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 glass rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 glass rounded-[3rem] border border-dashed border-white/10">
            <UserX className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">No matches in current registry</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card rounded-[2rem] border border-white/5 p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-[1px] shadow-lg shadow-primary/20">
                        <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-black text-primary">{getInitials(member.full_name)}</span>
                          )}
                        </div>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${member.is_alumni ? "bg-primary" : "bg-green-500"}`}>
                        {member.is_alumni ? <GraduationCap size={10} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {member.full_name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${roleColors[member.role || "member"]}`}>
                          {member.role}
                        </span>
                        {member.is_banned && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-destructive/20 text-destructive border border-destructive/20 cursor-help">
                                  BANNED
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-bold">
                                  {member.ban_expires_at
                                    ? `Banned until ${new Date(member.ban_expires_at).toLocaleString()}`
                                    : "Permanently banned"}
                                </p>
                                {member.ban_reason && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Reason: {member.ban_reason}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-primary" />
                          {member.email}
                        </span>
                        {member.batch && <span className="bg-white/5 px-2 py-0.5 rounded-lg opacity-80 decoration-accent decoration-2 underline-offset-2">• {member.batch}</span>}
                        {member.semester && <span className="opacity-80 decoration-primary decoration-2 underline-offset-2">• SEMESTER {member.semester}</span>}
                        {member.is_banned && member.ban_expires_at && (
                          <span className="flex items-center gap-1.5 text-destructive">
                            • Banned until {new Date(member.ban_expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {member.is_banned && !member.ban_expires_at && (
                          <span className="flex items-center gap-1.5 text-destructive">
                            • Permanently banned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Progression */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                    <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Progression</p>
                        <div className="flex items-center gap-1.5 font-black text-foreground">
                          <Award size={14} className="text-primary" />
                          <span>LVL {member.level}</span>
                        </div>
                      </div>
                      <div className="w-[1px] h-8 bg-white/10" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Global XP</p>
                        <p className="font-black text-foreground tracking-tight">{member.xp_points}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Control Panel */}
                      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground hidden sm:block">Alumni</span>
                        <Switch
                          checked={member.is_alumni}
                          onCheckedChange={(checked) =>
                            handleAlumniToggle(member.user_id, checked)
                          }
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      <Button
                        variant={member.is_banned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleBanClick(member)}
                        className={`rounded-xl font-bold ${
                          member.is_banned
                            ? "border-green-500/50 text-green-500 hover:bg-green-500/10"
                            : ""
                        }`}
                      >
                        {member.is_banned ? (
                          <>
                            <ShieldOff className="w-4 h-4 mr-2" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-2" />
                            Ban
                          </>
                        )}
                      </Button>

                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.user_id, e.target.value)
                        }
                        className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-white/10 min-w-[120px]"
                      >
                        <option value="member" className="bg-background">Member</option>
                        <option value="moderator" className="bg-background">Moderator</option>
                        <option value="admin" className="bg-background">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BanUserDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        userName={selectedMember?.full_name || ""}
        isBanned={selectedMember?.is_banned || false}
        onConfirm={handleBanConfirm}
      />
    </AdminLayout>
  );
}
