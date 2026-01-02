import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Upload, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const types = [
  { value: "study_material", label: "Study Material" },
  { value: "past_paper", label: "Past Paper" },
  { value: "project", label: "Project" },
  { value: "interview_prep", label: "Interview Prep" },
  { value: "article", label: "Article" },
];

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ResourceForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "study_material",
    category: "",
    semester: "",
    subject: "",
    file_url: "",
    external_url: "",
  });

  useEffect(() => {
    if (isEditing) {
      fetchResource();
    }
  }, [id]);

  const fetchResource = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || "",
        description: data.description || "",
        type: data.type || "study_material",
        category: data.category || "",
        semester: data.semester?.toString() || "",
        subject: data.subject || "",
        file_url: data.file_url || "",
        external_url: data.external_url || "",
      });
    } catch (error) {
      console.error("Error fetching resource:", error);
      navigate("/dashboard/admin/resources");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, file_url: urlData.publicUrl }));
      toast({
        title: "File uploaded",
        description: "Resource file has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.file_url && !formData.external_url) {
      toast({
        title: "Missing file",
        description: "Please upload a file or provide an external URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const resourceData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as any,
        category: formData.category || null,
        semester: formData.semester ? parseInt(formData.semester) : null,
        subject: formData.subject || null,
        file_url: formData.file_url || null,
        external_url: formData.external_url || null,
        uploaded_by: user.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("resources")
          .update(resourceData)
          .eq("id", id);

        if (error) throw error;
        toast({
          title: "Resource updated",
          description: "The resource has been updated successfully.",
        });
      } else {
        const { error } = await supabase.from("resources").insert(resourceData);

        if (error) throw error;
        toast({
          title: "Resource created",
          description: "The resource has been uploaded successfully.",
        });
      }

      navigate("/dashboard/admin/resources");
    } catch (error) {
      console.error("Error saving resource:", error);
      toast({
        title: "Error",
        description: "Failed to save resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/dashboard/admin/resources"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isEditing ? "Edit Resource" : "Upload Resource"}
          </h1>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-border p-6 space-y-6"
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Resource title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Resource description"
              rows={3}
            />
          </div>

          {/* Type & Category */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="e.g., Programming, Database"
              />
            </div>
          </div>

          {/* Semester & Subject */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <select
                id="semester"
                value={formData.semester}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, semester: e.target.value }))
                }
                className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select semester</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="e.g., Data Structures"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File</Label>
            {formData.file_url ? (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <div className="flex-1 truncate text-sm">
                  {formData.file_url.split("/").pop()}
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, file_url: "" }))}
                  className="p-1 hover:bg-background rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Click to upload file"}
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label htmlFor="external_url">Or External URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="external_url"
                value={formData.external_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, external_url: e.target.value }))
                }
                placeholder="https://example.com/resource"
                className="pl-10"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Resource"
                : "Upload Resource"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/admin/resources")}
            >
              Cancel
            </Button>
          </div>
        </motion.form>
      </div>
    </DashboardLayout>
  );
}
