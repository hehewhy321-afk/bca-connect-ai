import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Pin,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    is_pinned: false,
    expires_at: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast({
        title: "Error",
        description: "Failed to load notices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      priority: "normal",
      is_pinned: false,
      expires_at: "",
    });
    setEditingNotice(null);
  };

  const handleOpenDialog = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        priority: notice.priority || "normal",
        is_pinned: notice.is_pinned || false,
        expires_at: notice.expires_at
          ? format(new Date(notice.expires_at), "yyyy-MM-dd")
          : "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const noticeData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        is_pinned: formData.is_pinned,
        expires_at: formData.expires_at || null,
        created_by: user.id,
      };

      if (editingNotice) {
        const { error } = await supabase
          .from("announcements")
          .update(noticeData)
          .eq("id", editingNotice.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Notice updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert([noticeData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Notice created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error("Error saving notice:", error);
      toast({
        title: "Error",
        description: "Failed to save notice",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Notice deleted successfully",
      });
      fetchNotices();
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast({
        title: "Error",
        description: "Failed to delete notice",
        variant: "destructive",
      });
    }
  };

  const filteredNotices = notices.filter(
    (notice) =>
      notice.title.toLowerCase().includes(search.toLowerCase()) ||
      notice.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                Public Relations
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Official documentation and public circulars
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                <Plus className="w-5 h-5 mr-2" />
                DRAFT NOTICE
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg glass border-white/10 p-8 rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground underline decoration-primary/30 decoration-4 underline-offset-8 mb-6">
                  {editingNotice ? "REVISE RECORD" : "ISSUE CIRCULAR"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-11 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                    placeholder="Reference identification"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Circular Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="min-h-[140px] rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                    placeholder="Formal notice text..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Urgency Level</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="normal">Standard</SelectItem>
                        <SelectItem value="medium">Elevated</SelectItem>
                        <SelectItem value="high">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires_at" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Validity Node</Label>
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
                    <Label htmlFor="is_pinned" className="text-xs font-black uppercase tracking-widest text-foreground block">Pin Records</Label>
                    <span className="text-[9px] text-muted-foreground font-bold leading-none">Elevates visibility in public feed</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" className="flex-1 h-11 rounded-xl font-black text-xs uppercase" onClick={() => setDialogOpen(false)}>
                    CANCEL
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase shadow-lg shadow-primary/20">
                    {submitting ? "PROCESSING..." : editingNotice ? "UPDATE RECORDS" : "POST CIRCULAR"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Archives Search */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars by keyword..."
            className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold"
          />
        </div>

        {/* Notices Archive */}
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 glass rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[3rem] border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-black text-foreground tracking-tight mb-2">Archive Vacant</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {search ? "No matches found in active protocol." : "Establish your first official circular."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredNotices.map((notice, index) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card rounded-[2.5rem] border border-white/5 p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
              >
                {/* Visual Flair */}
                <div className={`absolute -right-6 -top-6 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full bg-primary blur-3xl`} />

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 relative z-10">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {notice.is_pinned && (
                        <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                          <Pin className="w-3.5 h-3.5 text-primary fill-primary" />
                        </div>
                      )}
                      <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">
                        {notice.title}
                      </h3>
                      {notice.priority === "high" && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-tighter border border-red-500/30">
                          <AlertCircle className="w-3 h-3" />
                          CRITICAL PROTOCOL
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground text-sm font-medium leading-relaxed border-l-4 border-primary/10 pl-6 my-4 line-clamp-2">
                      {notice.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ID: </span>
                        <span className="text-[10px] font-black text-primary uppercase">{notice.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ISSUED</span>
                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{format(new Date(notice.created_at), "MMM d, yyyy")}</span>
                      </div>
                      {notice.expires_at && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">VALID UNTIL</span>
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest">{format(new Date(notice.expires_at), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:text-primary transition-all shadow-sm"
                      onClick={() => handleOpenDialog(notice)}
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all shadow-sm">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass border-white/10 rounded-[2.5rem] p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black tracking-tight text-foreground underline decoration-primary/30 decoration-4 underline-offset-8">DELETE RECORD</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground py-4 text-sm font-medium leading-relaxed">
                            Are you certain you wish to purge circular <span className="text-primary font-black">"{notice.title}"</span>? This operation is irreversible and will remove all associated logs from the archive.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-4 flex gap-3">
                          <AlertDialogCancel className="rounded-xl font-black text-xs uppercase h-11 flex-1">ABORT</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(notice.id)}
                            className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-black text-xs uppercase h-11 flex-1 shadow-lg shadow-red-500/20"
                          >
                            PURGE RECORDS
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
