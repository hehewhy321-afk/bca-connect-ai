import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Image, 
  Trash2, 
  Download, 
  Search, 
  Calendar, 
  Sparkles, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortDesc,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  model_used: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 12;

export default function ImageGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [filterModel, setFilterModel] = useState<string>("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: images, isLoading } = useQuery({
    queryKey: ["ai-generated-images", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generated_images")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GeneratedImage[];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("ai_generated_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-generated-images"] });
      toast.success("Image deleted successfully");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    },
  });

  // Get unique models for filtering
  const uniqueModels = [...new Set(images?.map(img => img.model_used).filter(Boolean))];

  // Filter and sort images
  const filteredAndSortedImages = images
    ?.filter((img) => {
      const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModel = filterModel === "all" || img.model_used === filterModel;
      return matchesSearch && matchesModel;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  // Pagination
  const totalPages = Math.ceil((filteredAndSortedImages?.length || 0) / ITEMS_PER_PAGE);
  const paginatedImages = filteredAndSortedImages?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      // Handle base64 images
      if (imageUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `ai-image-${prompt.slice(0, 30).replace(/\s+/g, "-")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded");
        return;
      }

      // Handle URL images
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-image-${prompt.slice(0, 30).replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const parseModelInfo = (modelUsed: string | null) => {
    if (!modelUsed) return { provider: "Unknown", model: "Unknown" };
    const parts = modelUsed.split(":");
    if (parts.length === 2) {
      return { provider: parts[0], model: parts[1] };
    }
    return { provider: "Unknown", model: modelUsed };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Image className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                AI Image Gallery
              </h1>
              <p className="text-sm text-muted-foreground">
                Your generated images • {filteredAndSortedImages?.length || 0} images
              </p>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by prompt..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          <Select value={filterModel} onValueChange={(v) => { setFilterModel(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {uniqueModels.map((model) => (
                <SelectItem key={model} value={model || "unknown"}>
                  {model ? parseModelInfo(model).model.split("/").pop() : "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "oldest")}>
            <SelectTrigger className="w-[150px]">
              <SortDesc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gallery */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedImages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {searchQuery || filterModel !== "all" ? "No matching images" : "No images yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {searchQuery || filterModel !== "all" 
                ? "Try adjusting your search or filters"
                : "Generate images using the AI Assistant by typing prompts like \"Generate an image of...\""
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedImages?.map((image, index) => {
                const modelInfo = parseModelInfo(image.model_used);
                return (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="relative aspect-square cursor-pointer overflow-hidden">
                              <img
                                src={image.image_url}
                                alt={image.prompt}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-sm line-clamp-2">
                                  {image.prompt}
                                </p>
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(image.image_url, image.prompt);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Generated Image
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="relative">
                                <img
                                  src={image.image_url}
                                  alt={image.prompt}
                                  className="w-full rounded-lg"
                                />
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Prompt</label>
                                  <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm text-foreground">{image.prompt}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Provider</label>
                                    <Badge variant="secondary" className="w-full justify-center">
                                      {modelInfo.provider}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Model</label>
                                    <Badge variant="outline" className="w-full justify-center text-xs">
                                      {modelInfo.model.split("/").pop()}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(image.created_at), "MMM d, yyyy 'at' h:mm a")}
                                </div>

                                <div className="flex gap-2 pt-4">
                                  <Button
                                    onClick={() => handleDownload(image.image_url, image.prompt)}
                                    className="flex-1"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. The image will be permanently deleted.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteMutation.mutate(image.id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <div className="p-3 space-y-2">
                          <p className="text-sm text-foreground line-clamp-1 font-medium">
                            {image.prompt}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(image.created_at), "MMM d, yyyy")}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {modelInfo.model.split("/").pop()?.slice(0, 15)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
