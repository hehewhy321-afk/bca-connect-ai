import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    Users,
    CreditCard,
    ExternalLink,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const AdminEnrollments = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: enrollments, isLoading } = useQuery({
        queryKey: ["admin-enrollments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("course_enrollments")
                .select(`
          *,
          profiles:user_id (full_name, email),
          courses:course_id (title, price)
        `)
                .eq("status", "pending")
                .order("enrolled_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: "approved" | "rejected" }) => {
            const { error } = await supabase
                .from("course_enrollments")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            toast.success(`Enrollment ${variables.status} successfully`);
            queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
        },
        onError: (error) => {
            toast.error("Failed to update status: " + error.message);
        }
    });

    const filteredEnrollments = enrollments?.filter((enrollment: any) =>
        enrollment.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.courses?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                                Enrollment Requests
                            </h1>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                Verify Payments & Grant Access
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by student or course..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 rounded-xl bg-white/5 border-white/5"
                    />
                </div>

                <div className="grid gap-6">
                    {isLoading ? (
                        <div className="py-10 text-center">Loading requests...</div>
                    ) : filteredEnrollments?.length === 0 ? (
                        <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl text-muted-foreground">
                            No pending enrollment requests found.
                        </div>
                    ) : (
                        filteredEnrollments?.map((enrollment: any) => (
                            <Card key={enrollment.id} className="glass-card border-white/5 overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">

                                        {/* User & Course Info */}
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                    {enrollment.courses?.title}
                                                </Badge>
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    NPR {enrollment.courses?.price}
                                                </Badge>
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground">
                                                {enrollment.profiles?.full_name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {enrollment.profiles?.email} • Requested {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                            </p>
                                            {enrollment.transaction_id && (
                                                <p className="text-xs font-mono bg-white/5 inline-block px-2 py-1 rounded">
                                                    TxID: {enrollment.transaction_id}
                                                </p>
                                            )}
                                        </div>

                                        {/* Screenshot Preview */}
                                        {enrollment.payment_screenshot_url && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <div className="relative group cursor-pointer border border-white/10 rounded-xl overflow-hidden w-full lg:w-48 h-32 bg-black/40">
                                                        <img
                                                            src={enrollment.payment_screenshot_url}
                                                            alt="Payment Proof"
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ExternalLink className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div className="absolute bottom-2 right-2">
                                                            <CreditCard className="w-4 h-4 text-white drop-shadow-md" />
                                                        </div>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl border-white/10 bg-black/90 p-0 overflow-hidden">
                                                    <img
                                                        src={enrollment.payment_screenshot_url}
                                                        alt="Payment Proof Full"
                                                        className="w-full h-auto max-h-[80vh] object-contain"
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 w-full lg:w-auto">
                                            <Button
                                                variant="destructive"
                                                onClick={() => updateStatusMutation.mutate({ id: enrollment.id, status: "rejected" })}
                                                className="flex-1 lg:flex-none rounded-xl"
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                onClick={() => updateStatusMutation.mutate({ id: enrollment.id, status: "approved" })}
                                                className="flex-1 lg:flex-none rounded-xl bg-green-600 hover:bg-green-700 text-white"
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve
                                            </Button>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminEnrollments;
