import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Upload, Check, Pen } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    useCertificateSignatures,
    useCreateSignature,
    useUpdateSignature,
    useDeleteSignature,
} from "@/hooks/useCertificates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminCertificateSignatures() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        title: "",
        signature_url: "",
        is_default: false,
    });

    const { data: signatures, isLoading } = useCertificateSignatures();
    const createMutation = useCreateSignature();
    const updateMutation = useUpdateSignature();
    const deleteMutation = useDeleteSignature();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        setUploading(true);

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `signatures/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("certificates")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from("certificates").getPublicUrl(filePath);

            setFormData({ ...formData, signature_url: publicUrl });
            toast.success("Signature uploaded successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to upload signature");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.title || !formData.signature_url) {
            toast.error("Please fill in all fields and upload a signature");
            return;
        }

        await createMutation.mutateAsync(formData);
        setIsCreateOpen(false);
        resetForm();
    };

    const handleSetDefault = async (id: string) => {
        // First, unset all defaults
        if (signatures) {
            for (const sig of signatures) {
                if (sig.is_default) {
                    await updateMutation.mutateAsync({
                        id: sig.id,
                        updates: { is_default: false },
                    });
                }
            }
        }

        // Then set the new default
        await updateMutation.mutateAsync({
            id,
            updates: { is_default: true },
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this signature?")) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            title: "",
            signature_url: "",
            is_default: false,
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">
                            Certificate Signatures
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage authorized signatures for certificates
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Signature
                    </Button>
                </div>

                {/* Signatures Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-48 bg-muted animate-pulse rounded-xl"
                            />
                        ))}
                    </div>
                ) : signatures && signatures.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {signatures.map((signature, index) => (
                            <motion.div
                                key={signature.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative bg-card border rounded-xl p-6 hover:shadow-lg transition-all ${signature.is_default
                                        ? "border-primary/50 shadow-primary/10"
                                        : "border-border"
                                    }`}
                            >
                                {signature.is_default && (
                                    <div className="absolute top-4 right-4">
                                        <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            Default
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {/* Signature Image */}
                                    <div className="h-24 flex items-center justify-center bg-muted/30 rounded-lg border border-border">
                                        <img
                                            src={signature.signature_url}
                                            alt={signature.name}
                                            className="max-h-20 max-w-full object-contain"
                                        />
                                    </div>

                                    {/* Signature Info */}
                                    <div className="text-center">
                                        <h3 className="font-bold text-foreground">
                                            {signature.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {signature.title}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {!signature.is_default && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSetDefault(signature.id)}
                                                className="flex-1"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Set Default
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(signature.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Pen className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            No Signatures Yet
                        </h3>
                        <p className="text-muted-foreground">
                            Add your first authorized signature
                        </p>
                    </div>
                )}
            </div>

            {/* Create Signature Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Signature</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Signer Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="e.g., Dr. John Doe"
                            />
                        </div>

                        <div>
                            <Label htmlFor="title">Title/Position *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="e.g., President, BCA Association"
                            />
                        </div>

                        <div>
                            <Label htmlFor="signature">Signature Image *</Label>
                            <div className="space-y-3">
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                    <input
                                        type="file"
                                        id="signature"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="signature"
                                        className="cursor-pointer flex flex-col items-center gap-2"
                                    >
                                        <Upload className="w-10 h-10 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {uploading ? "Uploading..." : "Click to upload signature"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PNG, JPG up to 2MB
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {formData.signature_url && (
                                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                                        <img
                                            src={formData.signature_url}
                                            alt="Preview"
                                            className="max-h-20 mx-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || uploading}
                            >
                                {createMutation.isPending ? "Adding..." : "Add Signature"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
