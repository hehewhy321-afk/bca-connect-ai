import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Megaphone,
  Trash2,
  Edit,
  Pin,
  Clock,
  Search,
  Image as ImageIcon,
  Paperclip,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
  image_url?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    is_pinned: false,
    expires_at: "",
    image_url: "",
    attachment_url: "",
    attachment_name: "",
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setFormData({ 
        ...formData, 
        attachment_url: data.publicUrl,
        attachment_name: file.name 
      });
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        is_pinned: formData.is_pinned,
        expires_at: formData.expires_at || null,
        image_url: formData.image_url || null,
        attachment_url: formData.attachment_url || null,
        attachment_name: formData.attachment_name || null,
        created_by: user?.id,
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from("announcements")
          .update(announcementData)
          .eq("id", editingAnnouncement.id);

        if (error) throw error;
        toast.success("Announcement updated successfully");
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert([announcementData]);

        if (error) throw error;
        toast.success("Announcement created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Failed to save announcement");
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority || "normal",
      is_pinned: announcement.is_pinned || false,
      expires_at: announcement.expires_at ? announcement.expires_at.split("T")[0] : "",
      image_url: announcement.image_url || "",
      attachment_url: announcement.attachment_url || "",
      attachment_name: announcement.attachment_name || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Announcement deleted successfully");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };

  const togglePin = async (announcement: Announcement) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_pinned: !announcement.is_pinned })
        .eq("id", announcement.id);

      if (error) throw error;
      toast.success(announcement.is_pinned ? "Announcement unpinned" : "Announcement pinned");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update announcement");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      priority: "normal",
      is_pinned: false,
      expires_at: "",
      image_url: "",
      attachment_url: "",
      attachment_name: "",
    });
    setEditingAnnouncement(null);
    setImageFile(null);
    setAttachmentFile(null);
  };

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive bg-destructive/10";
      case "low":
        return "text-muted-foreground bg-muted";
      default:
        return "text-primary bg-primary/10";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
              Media Tower
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Broadcasting intelligence to the community
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                <Plus className="w-5 h-5 mr-2" />
                NEW BROADCAST
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg glass border-white/10 p-8 rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground underline decoration-primary/30 decoration-4 underline-offset-8 mb-6">
                  {editingAnnouncement ? "MODIFY SIGNAL" : "INITIATE SIGNAL"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Header Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-11 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                    placeholder="Brief identifying headline"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signal Payload</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="min-h-[120px] rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                    placeholder="Full announcement content..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority Protocol</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="low">Standard</SelectItem>
                        <SelectItem value="normal">Priority</SelectItem>
                        <SelectItem value="high">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiration Node</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      className="h-11 rounded-xl bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <Switch
                    id="is_pinned"
                    checked={formData.is_pinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div>
                    <Label htmlFor="is_pinned" className="text-xs font-black uppercase tracking-widest text-foreground block">Pin Signal</Label>
                    <span className="text-[9px] text-muted-foreground font-bold leading-none">Keeps this at the top of the feed</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" className="flex-1 h-11 rounded-xl font-black text-xs uppercase" onClick={() => setIsDialogOpen(false)}>
                    ABORT
                  </Button>
                  <Button type="submit" className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase">
                    {editingAnnouncement ? "UPDATE SIGNAL" : "TRANSMIT NOW"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Intelligence Query */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search signals by payload keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
          />
        </div>

        {/* Signals List */}
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 glass rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-[3rem] border border-white/5">
            <Megaphone className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-black text-foreground tracking-tight mb-2">No Active Signals</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">The airwaves are currently silent.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-[2.5rem] border border-white/5 p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
              >
                {/* Background Decoration */}
                <div className={`absolute -right-12 -bottom-12 w-48 h-48 opacity-5 group-hover:opacity-10 transition-opacity rounded-full bg-gradient-to-br from-primary to-accent`} />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 relative z-10">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {announcement.is_pinned && (
                        <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                          <Pin className="w-3.5 h-3.5 text-primary fill-primary" />
                        </div>
                      )}
                      <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                        {announcement.title}
                      </h3>
                      <Badge className={`uppercase tracking-tighter font-black text-[8px] px-3 py-1 rounded-full ${announcement.priority === "high" ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                        announcement.priority === "low" ? "bg-white/5 text-muted-foreground border border-white/10" :
                          "bg-primary/20 text-primary border border-primary/30"
                        }`}>
                        {announcement.priority || "NORMAL"} PROTOCOL
                      </Badge>
                    </div>

                    <p className="text-muted-foreground text-sm font-medium leading-relaxed italic border-l-4 border-primary/20 pl-6 my-4 line-clamp-3">
                      {announcement.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          DEFORMED {formatDate(announcement.created_at)}
                        </span>
                      </div>

                      {announcement.expires_at && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-red-500/10">
                            <Clock className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          <span className="text-[10px] font-black text-red-500/70 uppercase tracking-widest">
                            DEGRADES {formatDate(announcement.expires_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:flex-col lg:justify-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePin(announcement)}
                      className={`w-12 h-12 rounded-2xl border transition-all ${announcement.is_pinned
                        ? "bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/20"
                        : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10"
                        }`}
                    >
                      <Pin className={`w-5 h-5 ${announcement.is_pinned ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:text-primary transition-all"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(announcement.id)}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
