import { useState } from "react";
import { motion } from "framer-motion";
import {
    Award,
    Calendar,
    Download,
    Filter,
    Search,
    Trophy,
    Eye,
    X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { useCertificates, useCertificateCategories } from "@/hooks/useCertificates";
import { CertificateRenderer } from "@/components/certificates/CertificateRenderer";
import { useAuth } from "@/contexts/AuthContext";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export default function Certificates() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [selectedCertificate, setSelectedCertificate] = useState<any>(null);

    const { data: certificates, isLoading } = useCertificates({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: search || undefined,
    });

    const { data: categories } = useCertificateCategories();

    const handleDownload = async (certificate: any) => {
        try {
            const element = document.getElementById(`cert-${certificate.id}`);
            if (!element) {
                toast.error("Certificate not found");
                return;
            }

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: "#ffffff",
            });

            const link = document.createElement("a");
            link.download = `certificate-${certificate.verification_code}.png`;
            link.href = canvas.toDataURL();
            link.click();

            toast.success("Certificate downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download certificate");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">
                            My Certificates
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            View and download your achievement certificates
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                            <p className="text-sm text-muted-foreground">Total Certificates</p>
                            <p className="text-2xl font-black text-primary">
                                {certificates?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search certificates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Certificates Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-64 bg-muted animate-pulse rounded-2xl"
                            />
                        ))}
                    </div>
                ) : certificates && certificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((certificate, index) => (
                            <motion.div
                                key={certificate.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                            >
                                {/* Certificate Preview */}
                                <div className="aspect-[4/3] bg-slate-100 rounded-xl mb-4 relative overflow-hidden group-hover:shadow-inner">
                                    {/* Real Preview - Scaled Down */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="transform scale-[0.25] origin-center pointer-events-none">
                                            <CertificateRenderer
                                                certificate={certificate}
                                                userName={user?.user_metadata?.full_name || ""}
                                            />
                                        </div>
                                    </div>

                                    {/* Off-screen render for download (One per cert to avoid ID conflicts?) 
                                        Actually, let's keep the global one or one per item. 
                                        The ID used is `cert-${certificate.id}`. 
                                        We must ensure it exists in the DOM but is not display:none.
                                    */}
                                    <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0">
                                        <div id={`cert-${certificate.id}`}>
                                            <CertificateRenderer
                                                certificate={certificate}
                                                userName={user?.user_metadata?.full_name || ""}
                                            />
                                        </div>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                </div>

                                {/* Certificate Info */}
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                            {certificate.title}
                                        </h3>
                                        {certificate.category && (
                                            <p className="text-sm text-primary font-semibold mt-1">
                                                {certificate.category.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {new Date(certificate.event_date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedCertificate(certificate)}
                                            className="flex-1"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleDownload(certificate)}
                                            className="flex-1"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Award className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            No Certificates Yet
                        </h3>
                        <p className="text-muted-foreground">
                            Your certificates will appear here once they are issued
                        </p>
                    </div>
                )}
            </div>

            {/* Certificate Preview Dialog */}
            <Dialog
                open={!!selectedCertificate}
                onOpenChange={() => setSelectedCertificate(null)}
            >
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>{selectedCertificate?.title}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedCertificate(null)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedCertificate && (
                        <div className="space-y-4">
                            <div className="flex justify-center bg-muted/30 p-8 rounded-xl">
                                <div className="transform scale-75 origin-top">
                                    <CertificateRenderer
                                        certificate={selectedCertificate}
                                        userName={user?.user_metadata?.full_name || ""}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedCertificate(null)}
                                >
                                    Close
                                </Button>
                                <Button onClick={() => handleDownload(selectedCertificate)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Certificate
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
