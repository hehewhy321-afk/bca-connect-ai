import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    ShieldCheck,
    Loader2,
    Eye,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Search,
    Filter,
    CreditCard,
    User,
    Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const AdminPaymentVerification = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const { data: registrations, isLoading } = useQuery({
        queryKey: ["admin-registrations"],
        queryFn: async () => {
            // Fetch both public and member registrations
            const [revRes, pubRes] = await Promise.all([
                supabase
                    .from("event_registrations")
                    .select("*, events(title), profiles(full_name, email)"),
                supabase
                    .from("public_event_registrations")
                    .select("*, events(title)")
            ]);

            if (revRes.error) throw revRes.error;
            if (pubRes.error) throw pubRes.error;

            // Normalize data
            const normalizedRev = (revRes.data as any[]).map(r => ({
                id: r.id,
                source: "member",
                userName: r.profiles?.full_name || "Unknown",
                userEmail: r.profiles?.email || "Unknown",
                eventTitle: r.events?.title || "Unknown Event",
                status: r.payment_status || "pending",
                receiptUrl: r.payment_receipt_url,
                date: r.registered_at,
                isAttended: r.attended
            }));

            const normalizedPub = (pubRes.data as any[]).map(r => ({
                id: r.id,
                source: "public",
                userName: r.full_name,
                userEmail: r.email,
                eventTitle: r.events?.title || "Unknown Event",
                status: r.payment_status || "pending",
                receiptUrl: r.payment_receipt_url,
                date: r.created_at,
                isAttended: false
            }));

            return [...normalizedRev, ...normalizedPub].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, source }: { id: string, status: string, source: string }) => {
            const table = source === "member" ? "event_registrations" : "public_event_registrations";
            const { error } = await supabase
                .from(table as any)
                .update({ payment_status: status } as any)
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
            toast.success("Verification status updated");
        },
        onError: (error) => {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    });

    const filteredData = registrations?.filter(r => {
        const matchesSearch =
            r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.eventTitle.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === "all" || r.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-10 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                                Audit Core
                            </h1>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                Transaction sovereignty and identity verification protocols
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="glass px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">ledger synchronized</span>
                        </div>
                    </div>
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="SEARCH ENTITY OR EVENT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20 transition-all shadow-inner"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-foreground text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                        >
                            <option value="all">ALL PROTOCOLS</option>
                            <option value="pending">PENDING</option>
                            <option value="paid">VERIFIED</option>
                            <option value="failed">FAILED</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-center glass rounded-2xl border border-white/5 px-6">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Queue Depth</p>
                            <p className="text-xl font-black text-primary tracking-tighter">{filteredData?.length || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Audit Log Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-[3rem] border border-white/5 overflow-hidden"
                >
                    <Table>
                        <TableHeader className="bg-white/2 border-b border-white/5">
                            <TableRow>
                                <TableHead className="h-16 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entity</TableHead>
                                <TableHead className="h-16 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sector (Event)</TableHead>
                                <TableHead className="h-16 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Origin</TableHead>
                                <TableHead className="h-16 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Timeline</TableHead>
                                <TableHead className="h-16 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocol Status</TableHead>
                                <TableHead className="h-16 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredData?.map((reg) => (
                                    <motion.tr
                                        layout
                                        key={`${reg.source}-${reg.id}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <TableCell className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-foreground uppercase">{reg.userName}</p>
                                                    <p className="text-[10px] font-medium text-muted-foreground">{reg.userEmail}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-primary opacity-50" />
                                                <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">{reg.eventTitle}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest ${reg.source === "member" ? "text-primary border-primary/20 bg-primary/5" : "text-accent border-accent/20 bg-accent/5"}`}>
                                                {reg.source}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <p className="text-[10px] font-bold text-muted-foreground">
                                                {format(new Date(reg.date), "MMM dd, yyyy")}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${reg.status === "paid" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                                                    reg.status === "pending" ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(218,120,9,0.5)]" :
                                                        "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                    }`} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${reg.status === "paid" ? "text-green-500" :
                                                    reg.status === "pending" ? "text-primary" :
                                                        "text-red-500"
                                                    }`}>
                                                    {reg.status}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {reg.receiptUrl ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(reg.receiptUrl, "_blank")}
                                                        className="h-9 w-9 rounded-xl bg-white/5 hover:bg-primary/10 hover:text-primary transition-all"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <div className="h-9 w-9 rounded-xl bg-white/2 flex items-center justify-center text-muted-foreground opacity-30" title="No receipt found">
                                                        <Eye className="h-4 w-4" />
                                                    </div>
                                                )}

                                                {reg.status !== "paid" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "paid", source: reg.source })}
                                                        className="h-9 w-9 rounded-xl bg-white/5 hover:bg-green-500/10 hover:text-green-500 transition-all"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {reg.status !== "failed" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "failed", source: reg.source })}
                                                        className="h-9 w-9 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>

                    {!filteredData?.length && (
                        <div className="flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-muted-foreground/30">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl font-black text-foreground/50 uppercase tracking-widest">Zero Detections</h3>
                            <p className="text-xs font-medium text-muted-foreground mt-2 max-w-xs mx-auto">All transaction sectors currently clear or search parameters yielding null results.</p>
                        </div>
                    )}
                </motion.div>

                {/* Legend/Info Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-8 rounded-[2rem] border border-white/5 flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-1">Payment Protocol</h4>
                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">Admins must manually verify the payment_receipt_url before transitioning PENDING states to VERIFIED.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 glass-card p-8 rounded-[2rem] border border-white/10 bg-primary/[0.02]">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Audit Chain Instructions</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-primary uppercase">Step 01</p>
                                <p className="text-[10px] font-medium text-muted-foreground italic">Execute visual scan of receipt credentials via Eye icon.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-primary uppercase">Step 02</p>
                                <p className="text-[10px] font-medium text-muted-foreground italic">Authorize transaction to VERIFIED or flag as FAILED.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPaymentVerification;
