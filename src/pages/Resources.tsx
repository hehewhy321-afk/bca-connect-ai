import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Code,
  Briefcase,
  Search,
  Download,
  ExternalLink,
  Eye,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  file_url: string | null;
  external_url: string | null;
  semester: number | null;
  subject: string;
  downloads: number;
  views: number;
}

const typeIcons: Record<string, typeof BookOpen> = {
  study_material: BookOpen,
  past_paper: FileText,
  project: Code,
  interview_prep: Briefcase,
  article: FileText,
};

const typeColors: Record<string, string> = {
  study_material: "from-primary to-primary/70",
  past_paper: "from-accent to-accent/70",
  project: "from-secondary to-secondary/70",
  interview_prep: "from-primary to-accent",
  article: "from-accent to-secondary",
};

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");

  const types = [
    { value: "all", label: "All Types" },
    { value: "study_material", label: "Study Materials" },
    { value: "past_paper", label: "Past Papers" },
    { value: "project", label: "Projects" },
    { value: "interview_prep", label: "Interview Prep" },
  ];

  const semesters = ["all", "1", "2", "3", "4", "5", "6", "7", "8"];

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

  const handleView = async (resource: Resource) => {
    // Increment view count
    await supabase
      .from("resources")
      .update({ views: resource.views + 1 })
      .eq("id", resource.id);

    const url = resource.external_url || resource.file_url;
    if (url) {
      window.open(url, "_blank");
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" || resource.type === selectedType;
    const matchesSemester =
      selectedSemester === "all" ||
      resource.semester?.toString() === selectedSemester;
    return matchesSearch && matchesType && matchesSemester;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Resource Hub
          </h1>
          <p className="text-muted-foreground">
            Access study materials, past papers, projects, and more.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Semesters</option>
              {semesters.slice(1).map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-foreground mb-2">
              No resources found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => {
              const Icon = typeIcons[resource.type] || BookOpen;
              const colorClass = typeColors[resource.type] || "from-primary to-primary/70";

              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group"
                >
                  <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-heading font-semibold text-foreground line-clamp-2">
                          {resource.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {resource.type.replace("_", " ")}
                        </span>
                        {resource.semester && (
                          <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                            Sem {resource.semester}
                          </span>
                        )}
                        {resource.subject && (
                          <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                            {resource.subject}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {resource.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resource.downloads}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(resource)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
