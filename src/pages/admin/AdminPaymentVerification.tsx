import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Eye, Search, Filter, IndianRupee, Calendar, User, FileImage } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Registration {
  id: string;
  full_name?: string;
  email: string;
  phone?: string;
  team_name?: string;
  payment_receipt_url?: string;
  payment_status?: string;
  created_at: string;
  event_id: string;
  event_title?: string;
  registration_fee?: number;
  type: "internal" | "public";
  user_id?: string;
}

export default function AdminPaymentVerification() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      // Fetch events with fees
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, title, registration_fee")
        .gt("registration_fee", 0);

      if (eventsError) throw eventsError;

      const eventMap = new Map(events?.map(e => [e.id, { title: e.title, fee: e.registration_fee }]) || []);
      const eventIds = events?.map(e => e.id) || [];

      if (eventIds.length === 0) {
        setRegistrations([]);
        setLoading(false);
        return;
      }

      // Fetch public registrations for paid events
      const { data: publicRegs, error: publicError } = await supabase
        .from("public_event_registrations")
        .select("*")
        .in("event_id", eventIds);

      if (publicError) throw publicError;

      // Fetch internal registrations for paid events
      const { data: internalRegs, error: internalError } = await supabase
        .from("event_registrations")
        .select("*")
        .in("event_id", eventIds);

      if (internalError) throw internalError;

      // Get profiles for internal registrations
      const userIds = internalRegs?.map(r => r.user_id) || [];
      let profileMap = new Map<string, any>();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, phone")
          .in("user_id", userIds);
        
        profiles?.forEach(p => profileMap.set(p.user_id, p));
      }

      // Combine registrations
      const allRegistrations: Registration[] = [
        ...(publicRegs?.map(r => ({
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          phone: r.phone,
          team_name: r.team_name,
          payment_receipt_url: (r as any).payment_receipt_url,
          payment_status: (r as any).payment_status || "pending",
          created_at: r.created_at,
          event_id: r.event_id,
          event_title: eventMap.get(r.event_id)?.title,
          registration_fee: eventMap.get(r.event_id)?.fee,
          type: "public" as const,
        })) || []),
        ...(internalRegs?.map(r => {
          const profile = profileMap.get(r.user_id);
          return {
            id: r.id,
            full_name: profile?.full_name,
            email: profile?.email,
            phone: profile?.phone,
            team_name: r.team_name,
            payment_receipt_url: (r as any).payment_receipt_url,
            payment_status: (r as any).payment_status || "pending",
            created_at: r.registered_at,
            event_id: r.event_id,
            event_title: eventMap.get(r.event_id)?.title,
            registration_fee: eventMap.get(r.event_id)?.fee,
            type: "internal" as const,
            user_id: r.user_id,
          };
        }) || []),
      ];

      setRegistrations(allRegistrations.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (registration: Registration, status: string) => {
    try {
      const table = registration.type === "public" 
        ? "public_event_registrations" 
        : "event_registrations";

      const { error } = await supabase
        .from(table)
        .update({ payment_status: status })
        .eq("id", registration.id);

      if (error) throw error;

      setRegistrations(prev => 
        prev.map(r => r.id === registration.id ? { ...r, payment_status: status } : r)
      );

      toast({
        title: "Payment status updated",
        description: `Registration marked as ${status}`,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = 
      r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.event_title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || r.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Payment Verification</h1>
            <p className="text-muted-foreground">Review and verify payment receipts for paid events</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-card border border-border"
          >
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{registrations.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
          >
            <p className="text-sm text-yellow-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">
              {registrations.filter(r => r.payment_status === "pending").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/30"
          >
            <p className="text-sm text-green-400">Approved</p>
            <p className="text-2xl font-bold text-green-400">
              {registrations.filter(r => r.payment_status === "approved").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"
          >
            <p className="text-sm text-red-400">Rejected</p>
            <p className="text-2xl font-bold text-red-400">
              {registrations.filter(r => r.payment_status === "rejected").length}
            </p>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading registrations...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-8 text-center">
              <IndianRupee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No paid registrations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registrant</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{registration.full_name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{registration.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{registration.event_title}</p>
                        <Badge variant="outline" className="text-xs">
                          {registration.type === "public" ? "Public" : "Member"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        <span className="font-medium">{registration.registration_fee}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {registration.payment_receipt_url ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedReceipt(registration.payment_receipt_url || null)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Payment Receipt</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-auto">
                              <img 
                                src={registration.payment_receipt_url} 
                                alt="Payment Receipt"
                                className="w-full rounded-lg"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground text-sm">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(registration.payment_status || "pending")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(registration.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          onClick={() => updatePaymentStatus(registration, "approved")}
                          disabled={registration.payment_status === "approved"}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => updatePaymentStatus(registration, "rejected")}
                          disabled={registration.payment_status === "rejected"}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
