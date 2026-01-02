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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Manage Resources
              </h1>
              <p className="text-muted-foreground">
                Upload and organize study materials
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/resources/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Resource
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Resources List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-foreground mb-2">
              No resources found
            </h3>
            <p className="text-muted-foreground mb-4">
              Upload your first resource to get started.
            </p>
            <Button onClick={() => navigate("/admin/resources/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Resource
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-heading font-semibold text-foreground truncate">
                        {resource.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {resource.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                      {resource.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {resource.semester && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                          Semester {resource.semester}
                        </span>
                      )}
                      {resource.subject && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                          {resource.subject}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {resource.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {resource.downloads}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        navigate(`/admin/resources/${resource.id}`)
                      }
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(resource.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
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
