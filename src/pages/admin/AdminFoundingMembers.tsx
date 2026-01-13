import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, ArrowLeft, Search,
  Filter,
  User,
  GripVertical
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

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
  display_order: number;
  is_active: boolean;
}

const emptyMember = {
  full_name: "",
  role: "",
  avatar_url: "",
  email: "",
  phone: "",
  linkedin_url: "",
  facebook_url: "",
  twitter_url: "",
  bio: "",
  display_order: 0,
  is_active: true,
};

export default function AdminFoundingMembers() {
  const [members, setMembers] = useState<FoundingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FoundingMember | null>(null);
  const [formData, setFormData] = useState(emptyMember);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("founding_members")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMember(null);
    setFormData({ ...emptyMember, display_order: members.length });
    setDialogOpen(true);
  };

  const handleEdit = (member: FoundingMember) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      role: member.role,
      avatar_url: member.avatar_url || "",
      email: member.email || "",
      phone: member.phone || "",
      linkedin_url: member.linkedin_url || "",
      facebook_url: member.facebook_url || "",
      twitter_url: member.twitter_url || "",
      bio: member.bio || "",
      display_order: member.display_order,
      is_active: member.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        full_name: formData.full_name,
        role: formData.role,
        avatar_url: formData.avatar_url || null,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
        facebook_url: formData.facebook_url || null,
        twitter_url: formData.twitter_url || null,
        bio: formData.bio || null,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (editingMember) {
        const { error } = await supabase
          .from("founding_members")
          .update(payload)
          .eq("id", editingMember.id);

        if (error) throw error;
        toast({ title: "Member updated successfully" });
      } else {
        const { error } = await supabase
          .from("founding_members")
          .insert(payload);

        if (error) throw error;
        toast({ title: "Member added successfully" });
      }

      setDialogOpen(false);
      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const { error } = await supabase
        .from("founding_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Member deleted successfully" });
      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                Legacy Core
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Managing the founding protocols and original architects
              </p>
            </div>
          </div>
          <Button
            onClick={handleAdd}
            className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            INITIATE MEMBER
          </Button>
        </div>

        {/* Search Frequency */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search founding profiles (name, role)..."
            className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
          />
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 glass rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[3rem] border border-white/5">
            <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-black text-foreground tracking-tight mb-2">Registry Vacant</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No founding members found in the current archive.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`glass - card p - 6 rounded - [2.5rem] border border - white / 5 hover: border - primary / 20 transition - all group relative overflow - hidden ${!member.is_active ? "opacity-60 grayscale" : ""} `}
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className="text-muted-foreground/30 hover:text-primary transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="relative">
                    <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors shadow-2xl">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary text-2xl font-black uppercase">
                          {member.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {member.is_active && (
                      <div className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-green-500 border-4 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">{member.full_name}</h3>
                      {!member.is_active && (
                        <Badge variant="outline" className="text-[8px] font-black border-red-500/30 text-red-500 uppercase px-2 py-0">DEACTIVATED</Badge>
                      )}
                    </div>
                    <p className="text-xs font-black text-primary uppercase tracking-widest">{member.role}</p>

                    <div className="flex gap-4 mt-3">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ORDER: {member.display_order}</span>
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ID: {member.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(member)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Visual Flair */}
                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl glass border-white/10 p-10 rounded-[3rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground underline decoration-primary/30 decoration-4 underline-offset-8 mb-6 uppercase">
              {editingMember ? "REVISE ARCHITECT" : "ENROLL FOUNDATION NODE"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-8 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Official Designation (Full Name) *</Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Designate entity..."
                  className="h-11 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grid Protocol (Role) *</Label>
                <Input
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Lead Architect / President"
                  className="h-11 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visual ID Source (Avatar URL)</Label>
                <Input
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://cloud.storage.com/avatar.jpg"
                  className="h-11 rounded-xl bg-white/5 border-white/10 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transmission Port (Email)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hq@archive.core"
                  className="h-11 rounded-xl bg-white/5 border-white/10 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Voice Frequency (Phone)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+977 (441) 2234"
                  className="h-11 rounded-xl bg-white/5 border-white/10"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">LinkedIn Intelligence Path</Label>
                <Input
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/profiler"
                  className="h-11 rounded-xl bg-white/5 border-white/10"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entity Log (Short Bio)</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief archival summary of the entity..."
                  rows={3}
                  className="rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grid Priority (Order)</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="h-11 rounded-xl bg-white/5 border-white/10"
                />
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 mt-4">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  className="data-[state=checked]:bg-primary"
                />
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest text-foreground block">Active Nexus</Label>
                  <span className="text-[9px] text-muted-foreground font-bold leading-none">Maintains entity within public visual stream</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="button" variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-xs uppercase" onClick={() => setDialogOpen(false)}>
                ABORT
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase shadow-lg shadow-primary/20">
                {submitting ? "SYNCING..." : editingMember ? "UPDATE ARCHITECT" : "ENROLL FOUNDER"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
