import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  semester: number | null;
  subject: string | null;
  file_url: string | null;
  external_url: string | null;
  downloads: number;
  views: number;
}

export default function AdminResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      toast({
        title: "Resource deleted",
        description: "The resource has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: "Failed to delete resource.",
        variant: "destructive",
      });
    }
  };

  const filteredResources = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* Header Section */}
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
                Resource Bank
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Study materials and academic logistics
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/resources/new")}
            className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            UPLOAD RESOURCE
          </Button>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Query by title, type or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Nodes: {filteredResources.length}
            </div>
          </div>
        </div>

        {/* Resources Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 glass rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-[3rem] border border-white/5">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-black text-foreground tracking-tight mb-2">
              No Data Found
            </h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">
              The resource repository is currently empty for this query.
            </p>
            <Button
              onClick={() => navigate("/admin/resources/new")}
              variant="outline"
              className="rounded-xl border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest px-8"
            >
              UPLOAD FIRST MATERIAL
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card rounded-[2.5rem] border border-white/5 p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
              >
                {/* Header Actions */}
                <div className="absolute top-8 right-8 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:text-primary transition-all"
                    onClick={() => navigate(`/admin/resources/${resource.id}`)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all"
                    onClick={() => handleDelete(resource.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Resource Info */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110`}>
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-xl font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-1">
                    {resource.title}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    {resource.type.replace("_", " ")}
                  </p>
                  <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                    {resource.description}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex flex-wrap gap-2">
                    {resource.semester && (
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-primary uppercase tracking-widest">
                        SEM {resource.semester}
                      </span>
                    )}
                    {resource.subject && (
                      <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-accent uppercase tracking-widest">
                        {resource.subject}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                        <Eye size={14} className="text-primary" />
                        {resource.views}
                      </div>
                      <div className="flex items-center gap-1.5 font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                        <Download size={14} className="text-accent" />
                        {resource.downloads}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary font-black text-[10px] uppercase tracking-[0.2em] h-auto p-0 hover:bg-transparent hover:text-primary/80 transition-all group-hover:translate-x-1"
                      onClick={() => window.open(resource.file_url || resource.external_url || '#', '_blank')}
                    >
                      VIEW ACCESS <ArrowLeft className="w-3.5 h-3.5 ml-1.5 rotate-180" />
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
