import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, HelpCircle, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

const categories = ["General", "Membership", "Events", "Resources", "Technical", "Other"];

const AdminFAQs = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General",
    display_order: 0,
    is_active: true,
  });

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("faqs").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ created successfully!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create FAQ: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("faqs").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ updated successfully!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update FAQ: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete FAQ: " + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("faqs").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ status updated!");
    },
    onError: (error) => {
      toast.error("Failed to update FAQ: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "General",
      display_order: (faqs?.length || 0) + 1,
      is_active: true,
    });
    setEditingFaq(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      display_order: faq.display_order,
      is_active: faq.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      deleteMutation.mutate(id);
    }
  };

  const groupedFaqs = faqs?.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                Intelligence Grid
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Managing the primary knowledge base and frequent queries
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                <Plus className="h-5 w-5 mr-2" />
                INITIATE FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass border-white/10 p-8 rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground underline decoration-primary/30 decoration-4 underline-offset-8 mb-6">
                  {editingFaq ? "RECONFIGURE NODE" : "ESTABLISH NODE"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inquiry String (Question)</Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Input the inquiry pattern"
                    className="h-11 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response Payload (Answer)</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Encode the resolution content..."
                    className="min-h-[120px] rounded-xl bg-white/5 border-white/10 focus:ring-primary/20 font-medium"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sector Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grid Priority (Order)</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="h-11 rounded-xl bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div>
                    <Label htmlFor="is_active" className="text-xs font-black uppercase tracking-widest text-foreground block">Visible Protocol</Label>
                    <span className="text-[9px] text-muted-foreground font-bold leading-none">Broadcasts this node to the public grid</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" className="flex-1 h-11 rounded-xl font-black text-xs uppercase" onClick={resetForm}>
                    ABORT
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase shadow-lg shadow-primary/20">
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingFaq ? "UPDATE NODE" : "ESTABLISH NODE"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {faqs?.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[3rem] border border-white/5">
            <HelpCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-black text-foreground tracking-tight mb-2">Matrix Depleted</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Add your first intelligence node to begin.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedFaqs || {}).map(([category, categoryFaqs]) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4 ml-2">
                  <div className="w-1 h-8 rounded-full bg-primary/50" />
                  <h2 className="text-xl font-black text-foreground uppercase tracking-widest">{category}</h2>
                  <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/10 font-black px-3">{categoryFaqs.length}</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {categoryFaqs.map((faq) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden ${!faq.is_active ? "opacity-60 bg-white/5 saturate-0" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-6 relative z-10">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <GripVertical className="h-5 w-5 text-muted-foreground/30 mt-1 cursor-grab active:cursor-grabbing hover:text-primary transition-colors" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <p className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">{faq.question}</p>
                              {!faq.is_active && (
                                <Badge variant="outline" className="text-[8px] font-black border-red-500/30 text-red-500 uppercase px-2 py-0">ENCRYPTED/HIDDEN</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground line-clamp-3 leading-relaxed italic border-l-2 border-primary/20 pl-4">{faq.answer}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <Switch
                              checked={faq.is_active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: faq.id, is_active: checked })
                              }
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(faq)}
                              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(faq.id)}
                              disabled={deleteMutation.isPending}
                              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Decoration */}
                      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminFAQs;
