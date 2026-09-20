import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Loader2, X, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

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

export default function FoundingMemberForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState(emptyMember);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      fetchMember();
    } else {
      fetchNextOrder();
    }
  }, [id]);

  const fetchMember = async () => {
    try {
      const { data, error } = await supabase
        .from("founding_members")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        full_name: data.full_name || "",
        role: data.role || "",
        avatar_url: data.avatar_url || "",
        email: data.email || "",
        phone: data.phone || "",
        linkedin_url: data.linkedin_url || "",
        facebook_url: data.facebook_url || "",
        twitter_url: data.twitter_url || "",
        bio: data.bio || "",
        display_order: data.display_order ?? 0,
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      console.error("Error fetching member:", error);
      navigate("/admin/founding-members");
    } finally {
      setLoading(false);
    }
  };

  // New members go to the end of the grid by default.
  const fetchNextOrder = async () => {
    const { count } = await supabase
      .from("founding_members")
      .select("*", { count: "exact", head: true });

    setFormData((prev) => ({ ...prev, display_order: count ?? 0 }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast({ title: "Image must be smaller than 5MB", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `founding-members/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", contentType: file.type });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Photo uploaded" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Allow re-selecting the same file after a removal.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = () => {
    setFormData((prev) => ({ ...prev, avatar_url: "" }));
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

      if (isEditing) {
        const { error } = await supabase
          .from("founding_members")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
        toast({ title: "Member updated successfully" });
      } else {
        const { error } = await supabase.from("founding_members").insert(payload);

        if (error) throw error;
        toast({ title: "Member added successfully" });
      }

      navigate("/admin/founding-members");
    } catch (error) {
      toast({
        title: "Error saving member",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-foreground underline decoration-primary/30 decoration-4 underline-offset-8 uppercase">
            {isEditing ? "Modify Foundation Node" : "Enroll Foundation Node"}
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="w-full space-y-8"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Official Designation (Full Name) *</Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Designate entity..."
                  className="h-11 rounded-md bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grid Protocol (Role) *</Label>
                <Input
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Lead Architect / President"
                  className="h-11 rounded-md bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visual ID Source (Photo)</Label>
                <div className="flex items-center gap-4 rounded-md bg-white/5 border border-white/10 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/5 border border-white/10">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md border-white/10 bg-white/5"
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {formData.avatar_url ? "Replace Photo" : "Upload Photo"}
                          </>
                        )}
                      </Button>
                      {formData.avatar_url && !uploadingAvatar && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAvatarRemove}
                          className="rounded-md text-muted-foreground hover:text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      PNG or JPG, up to 5MB
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transmission Port (Email)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hq@archive.core"
                  className="h-11 rounded-md bg-white/5 border-white/10 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Voice Frequency (Phone)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+977 (441) 2234"
                  className="h-11 rounded-md bg-white/5 border-white/10"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">LinkedIn Intelligence Path</Label>
                <Input
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/profiler"
                  className="h-11 rounded-md bg-white/5 border-white/10"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entity Log (Short Bio)</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief archival summary of the entity..."
                  rows={3}
                  className="rounded-md bg-white/5 border-white/10 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grid Priority (Order)</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="h-11 rounded-md bg-white/5 border-white/10"
                />
              </div>
              <div className="flex items-center gap-4 p-4 rounded-md bg-white/5 border border-white/5 mt-4">
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

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-8 rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive font-black text-xs uppercase"
                onClick={() => navigate("/admin/founding-members")}
              >
                ABORT
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploadingAvatar}
                className="h-12 px-8 rounded-md bg-primary text-primary-foreground font-black text-xs uppercase"
              >
                {submitting ? "SYNCING..." : isEditing ? "UPDATE ARCHITECT" : "ENROLL FOUNDER"}
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </AdminLayout>
  );
}
