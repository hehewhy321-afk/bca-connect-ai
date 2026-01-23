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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";

const AdminEnrollments = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "pending");
    const [selectedCourse, setSelectedCourse] = useState(searchParams.get("courseId") || "all");

    const { data: enrollments, isLoading } = useQuery({
        queryKey: ["admin-enrollments", activeTab],
        queryFn: async () => {
            let query = supabase
                .from("course_enrollments")
                .select(`
                  *,
                  profiles:user_id (full_name, email),
                  courses:course_id (id, title, price)
                `)
                .order("enrolled_at", { ascending: false });

            if (activeTab === "pending") {
                query = query.eq("status", "pending");
            } else if (activeTab === "approved") {
                query = query.eq("status", "approved");
            } else if (activeTab === "rejected") {
                query = query.eq("status", "rejected");
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
    });

    const { data: courses } = useQuery({
        queryKey: ["admin-courses-list"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("courses")
                .select("id, title")
                .order("title");
            if (error) throw error;
            return data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, silent = false }: { id: string, status: "approved" | "rejected" | "pending", silent?: boolean }) => {
            const { error } = await supabase
                .from("course_enrollments")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            if (!variables.silent) {
                toast.success(`Enrollment status updated to ${variables.status}`);
            }
            queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
        },
        onError: (error) => {
            toast.error("Failed to update status: " + error.message);
        }
    });

    const filteredEnrollments = enrollments?.filter((enrollment: any) => {
        const matchesSearch = enrollment.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            enrollment.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            enrollment.courses?.title?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCourse = selectedCourse === "all" || enrollment.course_id === selectedCourse;

        return matchesSearch && matchesCourse;
    });

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

                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student, email or course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 rounded-xl bg-transparent border-none focus-visible:ring-0 text-base"
                        />
                    </div>

                    {/* Course Filter */}
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="w-full lg:w-64 h-12 rounded-xl bg-white/5 border-white/10">
                            <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses?.map((course: any) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-white/5 rounded-2xl border border-white/5">
                        <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
                            Pending Requests
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
                            Active Students
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
                            Rejected/Revoked
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-8 grid gap-6">
                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-muted-foreground font-bold italic">Loading enrollments...</p>
                            </div>
                        ) : filteredEnrollments?.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold">No enrollments found for this view.</p>
                            </div>
                        ) : (
                            filteredEnrollments?.map((enrollment: any) => (
                                <Card key={enrollment.id} className="glass-card border-white/5 overflow-hidden hover:border-white/10 transition-all">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">

                                            {/* User & Course Info */}
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                        {enrollment.courses?.title}
                                                    </Badge>
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {enrollment.courses?.price > 0 ? `NPR ${enrollment.courses?.price}` : "FREE"}
                                                    </Badge>
                                                    {enrollment.status === 'approved' && (
                                                        <Badge className="bg-green-500/20 text-green-500 border-none">Active</Badge>
                                                    )}
                                                    {enrollment.status === 'rejected' && (
                                                        <Badge className="bg-red-500/20 text-red-500 border-none">Revoked/Rejected</Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground">
                                                    {enrollment.profiles?.full_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {enrollment.profiles?.email} • {activeTab === 'pending' ? 'Requested' : 'Processed'} {new Date(enrollment.updated_at || enrollment.enrolled_at).toLocaleDateString()}
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
                                                {activeTab === "pending" ? (
                                                    <>
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
                                                            className="flex-1 lg:flex-none rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                                            disabled={updateStatusMutation.isPending}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Approve
                                                        </Button>
                                                    </>
                                                ) : activeTab === "approved" ? (
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => {
                                                            if (confirm(`Revoke access for ${enrollment.profiles?.full_name}?`)) {
                                                                updateStatusMutation.mutate({ id: enrollment.id, status: "rejected" });
                                                            }
                                                        }}
                                                        className="flex-1 lg:flex-none rounded-xl border-dashed border-red-500/50"
                                                        disabled={updateStatusMutation.isPending}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Revoke Access
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => updateStatusMutation.mutate({ id: enrollment.id, status: "pending" })}
                                                        className="flex-1 lg:flex-none rounded-xl"
                                                        disabled={updateStatusMutation.isPending}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Restore to Pending
                                                    </Button>
                                                )}
                                            </div>

                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </Tabs>
            </div>
        </AdminLayout>
    );
};

export default AdminEnrollments;
