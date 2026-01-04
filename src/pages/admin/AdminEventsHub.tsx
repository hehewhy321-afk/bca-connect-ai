import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  MessageSquare,
  Star,
  Check,
  X,
  Eye,
  IndianRupee,
  User,
  Filter,
  ClipboardList,
  CreditCard,
  BarChart3,
  Download,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Types
interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  start_date: string;
  location: string;
  status: string;
  max_attendees: number | null;
  is_featured: boolean;
  registration_fee: number | null;
}

interface InternalRegistration {
  id: string;
  user_id: string;
  event_id: string;
  registered_at: string;
  attended: boolean;
  team_name: string | null;
  team_members: any;
  payment_status: string | null;
  payment_receipt_url: string | null;
  events: {
    title: string;
    start_date: string;
    max_attendees: number | null;
    team_type: string;
    registration_fee: number | null;
  } | null;
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface PublicRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  event_id: string;
  team_name: string | null;
  payment_status: string | null;
  payment_receipt_url: string | null;
  events: {
    title: string;
    start_date: string;
    registration_fee: number | null;
  } | null;
}

interface Feedback {
  id: string;
  rating: number;
  feedback: string | null;
  is_anonymous: boolean;
  created_at: string;
  event_id: string;
  user_id: string;
  events: { title: string } | null;
}

export default function AdminEventsHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [internalRegs, setInternalRegs] = useState<InternalRegistration[]>([]);
  const [publicRegs, setPublicRegs] = useState<PublicRegistration[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("events");

  useEffect(() => {
    fetchAllData();
    
    // Realtime subscription for registrations
    const channel = supabase
      .channel('admin-events-hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_event_registrations' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_feedback' }, fetchAllData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });
      setEvents(eventsData || []);

      // Fetch internal registrations
      const { data: internalData } = await supabase
        .from("event_registrations")
        .select(`*, events (title, start_date, max_attendees, team_type, registration_fee)`)
        .order("registered_at", { ascending: false });

      // Fetch profiles for internal registrations
      const userIds = [...new Set((internalData || []).map(r => r.user_id))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, phone")
          .in("user_id", userIds);
        profiles?.forEach(p => profilesMap[p.user_id] = p);
      }
      
      const internalWithProfiles = (internalData || []).map(r => ({
        ...r,
        profiles: profilesMap[r.user_id] || null,
      }));
      setInternalRegs(internalWithProfiles);

      // Fetch public registrations
      const { data: publicData } = await supabase
        .from("public_event_registrations")
        .select(`*, events (title, start_date, registration_fee)`)
        .order("created_at", { ascending: false });
      setPublicRegs(publicData || []);

      // Fetch feedback
      const { data: feedbackData } = await supabase
        .from("event_feedback")
        .select(`*, events (title)`)
        .order("created_at", { ascending: false });
      setFeedbacks(feedbackData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({ title: "Event deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleAttended = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({ attended: !currentValue })
        .eq("id", id);
      if (error) throw error;
      setInternalRegs(prev => prev.map(r => r.id === id ? { ...r, attended: !currentValue } : r));
      toast({ title: `Marked as ${!currentValue ? "attended" : "not attended"}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePublicReg = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    try {
      const { error } = await supabase.from("public_event_registrations").delete().eq("id", id);
      if (error) throw error;
      setPublicRegs(prev => prev.filter(r => r.id !== id));
      toast({ title: "Registration deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updatePaymentStatus = async (id: string, type: "internal" | "public", status: string) => {
    try {
      const table = type === "public" ? "public_event_registrations" : "event_registrations";
      const { error } = await supabase.from(table).update({ payment_status: status }).eq("id", id);
      if (error) throw error;
      
      if (type === "internal") {
        setInternalRegs(prev => prev.map(r => r.id === id ? { ...r, payment_status: status } : r));
      } else {
        setPublicRegs(prev => prev.map(r => r.id === id ? { ...r, payment_status: status } : r));
      }
      toast({ title: `Payment ${status}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Filtering
  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInternalRegs = internalRegs.filter(r => {
    const matchesSearch =
      r.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.team_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === "all" || r.event_id === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  const filteredPublicRegs = publicRegs.filter(r => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === "all" || r.event_id === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  const paidRegistrations = [
    ...internalRegs.filter(r => r.events?.registration_fee && r.events.registration_fee > 0).map(r => ({ ...r, type: "internal" as const })),
    ...publicRegs.filter(r => r.events?.registration_fee && r.events.registration_fee > 0).map(r => ({ ...r, type: "public" as const })),
  ].filter(r => {
    const name = r.type === "public" ? r.full_name : r.profiles?.full_name;
    const email = r.type === "public" ? r.email : r.profiles?.email;
    const matchesSearch = name?.toLowerCase().includes(searchQuery.toLowerCase()) || email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = f.feedback?.toLowerCase().includes(searchQuery.toLowerCase()) || f.events?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === "all" || f.event_id === selectedEvent;
    const matchesRating = ratingFilter === "all" || f.rating === parseInt(ratingFilter);
    return matchesSearch && matchesEvent && matchesRating;
  });

  // Stats
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => e.status === "upcoming").length,
    totalInternalRegs: internalRegs.length,
    totalPublicRegs: publicRegs.length,
    pendingPayments: paidRegistrations.filter(r => r.payment_status === "pending").length,
    avgRating: feedbacks.length > 0 ? (feedbacks.reduce((a, f) => a + f.rating, 0) / feedbacks.length).toFixed(1) : "0",
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatDateTime = (date: string) => new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default: return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    }
  };

  // CSV Export functions
  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: "Exported successfully", description: `${filename} has been downloaded.` });
  };

  const escapeCSV = (value: string | null | undefined) => {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportInternalRegistrations = () => {
    const headers = ["Name", "Email", "Phone", "Event", "Event Date", "Team Name", "Payment Status", "Attended", "Registered At"];
    const rows = filteredInternalRegs.map(r => [
      escapeCSV(r.profiles?.full_name),
      escapeCSV(r.profiles?.email),
      escapeCSV(r.profiles?.phone),
      escapeCSV(r.events?.title),
      escapeCSV(r.events?.start_date ? formatDate(r.events.start_date) : ""),
      escapeCSV(r.team_name),
      escapeCSV(r.payment_status || "N/A"),
      r.attended ? "Yes" : "No",
      escapeCSV(formatDateTime(r.registered_at)),
    ].join(","));
    downloadCSV([headers.join(","), ...rows].join("\n"), `member-registrations-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportPublicRegistrations = () => {
    const headers = ["Name", "Email", "Phone", "Event", "Event Date", "Team Name", "Payment Status", "Message", "Registered At"];
    const rows = filteredPublicRegs.map(r => [
      escapeCSV(r.full_name),
      escapeCSV(r.email),
      escapeCSV(r.phone),
      escapeCSV(r.events?.title),
      escapeCSV(r.events?.start_date ? formatDate(r.events.start_date) : ""),
      escapeCSV(r.team_name),
      escapeCSV(r.payment_status || "N/A"),
      escapeCSV(r.message),
      escapeCSV(formatDateTime(r.created_at)),
    ].join(","));
    downloadCSV([headers.join(","), ...rows].join("\n"), `public-registrations-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportPayments = () => {
    const headers = ["Name", "Email", "Type", "Event", "Fee", "Payment Status", "Receipt URL"];
    const rows = paidRegistrations.map(r => {
      const name = r.type === "public" ? r.full_name : r.profiles?.full_name;
      const email = r.type === "public" ? r.email : r.profiles?.email;
      return [
        escapeCSV(name),
        escapeCSV(email),
        r.type === "public" ? "Public" : "Member",
        escapeCSV(r.events?.title),
        `₹${r.events?.registration_fee || 0}`,
        escapeCSV(r.payment_status || "pending"),
        escapeCSV(r.payment_receipt_url),
      ].join(",");
    });
    downloadCSV([headers.join(","), ...rows].join("\n"), `payments-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportFeedback = () => {
    const headers = ["Event", "Rating", "Feedback", "Anonymous", "Date"];
    const rows = filteredFeedbacks.map(f => [
      escapeCSV(f.events?.title),
      f.rating.toString(),
      escapeCSV(f.feedback),
      f.is_anonymous ? "Yes" : "No",
      escapeCSV(formatDateTime(f.created_at)),
    ].join(","));
    downloadCSV([headers.join(","), ...rows].join("\n"), `feedback-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Events Management</h1>
            <p className="text-muted-foreground">Manage events, registrations, payments & feedback</p>
          </div>
          <Button onClick={() => navigate("/admin/events/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalEvents}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalInternalRegs}</p>
                <p className="text-xs text-muted-foreground">Member Regs</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalPublicRegs}</p>
                <p className="text-xs text-muted-foreground">Public Regs</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-400">{stats.pendingPayments}</p>
                <p className="text-xs text-yellow-400/70">Pending Pay</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.upcomingEvents}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.avgRating}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4 hidden sm:inline" />Events
            </TabsTrigger>
            <TabsTrigger value="internal" className="gap-2">
              <Users className="w-4 h-4 hidden sm:inline" />Members
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-2">
              <ClipboardList className="w-4 h-4 hidden sm:inline" />Public
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4 hidden sm:inline" />Payments
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <Star className="w-4 h-4 hidden sm:inline" />Feedback
            </TabsTrigger>
          </TabsList>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {(activeTab === "internal" || activeTab === "public" || activeTab === "feedback") && (
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {activeTab === "payments" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
            {activeTab === "feedback" && (
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  {[5,4,3,2,1].map(r => <SelectItem key={r} value={r.toString()}>{r} Star{r > 1 && "s"}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {/* Export Buttons */}
            {activeTab === "internal" && filteredInternalRegs.length > 0 && (
              <Button variant="outline" onClick={exportInternalRegistrations}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
            {activeTab === "public" && filteredPublicRegs.length > 0 && (
              <Button variant="outline" onClick={exportPublicRegistrations}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
            {activeTab === "payments" && paidRegistrations.length > 0 && (
              <Button variant="outline" onClick={exportPayments}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
            {activeTab === "feedback" && filteredFeedbacks.length > 0 && (
              <Button variant="outline" onClick={exportFeedback}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event, idx) => (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-heading font-semibold text-foreground truncate">{event.title}</h3>
                          <Badge variant={event.status === "upcoming" ? "default" : event.status === "ongoing" ? "secondary" : "outline"}>{event.status}</Badge>
                          {event.is_featured && <Badge variant="secondary">Featured</Badge>}
                          {event.registration_fee && event.registration_fee > 0 && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">₹{event.registration_fee}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(event.start_date)}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.location}</span>
                          {event.max_attendees && <span className="flex items-center gap-1"><Users className="w-4 h-4" />{event.max_attendees} spots</span>}
                          <Badge variant="outline">{event.category}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/events/${event.id}`)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Internal Registrations Tab */}
          <TabsContent value="internal" className="space-y-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : filteredInternalRegs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No member registrations found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInternalRegs.map((reg, idx) => (
                  <motion.div key={reg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="bg-card rounded-xl border border-border p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold">{reg.profiles?.full_name || "Unknown User"}</h3>
                          <Badge variant={reg.attended ? "default" : "outline"}>{reg.attended ? "Attended" : "Registered"}</Badge>
                          {reg.team_name && <Badge variant="secondary">Team: {reg.team_name}</Badge>}
                        </div>
                        <p className="text-sm text-primary font-medium">{reg.events?.title || "Unknown Event"}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {reg.profiles?.email && <div className="flex items-center gap-1"><Mail className="w-4 h-4" />{reg.profiles.email}</div>}
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDateTime(reg.registered_at)}</div>
                        </div>
                      </div>
                      <Button variant={reg.attended ? "outline" : "default"} size="sm" onClick={() => handleToggleAttended(reg.id, reg.attended)}>
                        {reg.attended ? "Mark Absent" : "Mark Attended"}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Public Registrations Tab */}
          <TabsContent value="public" className="space-y-4">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : filteredPublicRegs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No public registrations found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPublicRegs.map((reg, idx) => (
                  <motion.div key={reg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="bg-card rounded-xl border border-border p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold">{reg.full_name}</h3>
                        <p className="text-sm text-primary font-medium">{reg.events?.title || "Unknown Event"}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1"><Mail className="w-4 h-4" />{reg.email}</div>
                          {reg.phone && <div className="flex items-center gap-1"><Phone className="w-4 h-4" />{reg.phone}</div>}
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDateTime(reg.created_at)}</div>
                        </div>
                        {reg.message && <p className="text-sm text-muted-foreground flex items-start gap-1"><MessageSquare className="w-4 h-4 mt-0.5" />{reg.message}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePublicReg(reg.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border text-center">
                <p className="text-2xl font-bold">{paidRegistrations.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                <p className="text-2xl font-bold text-green-400">{paidRegistrations.filter(r => r.payment_status === "approved").length}</p>
                <p className="text-sm text-green-400/70">Approved</p>
              </div>
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                <p className="text-2xl font-bold text-yellow-400">{paidRegistrations.filter(r => r.payment_status === "pending").length}</p>
                <p className="text-sm text-yellow-400/70">Pending</p>
              </div>
            </div>
            
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : paidRegistrations.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <IndianRupee className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No paid registrations found</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registrant</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidRegistrations.map(reg => {
                      const name = reg.type === "public" ? reg.full_name : reg.profiles?.full_name;
                      const email = reg.type === "public" ? reg.email : reg.profiles?.email;
                      const fee = reg.events?.registration_fee;
                      const receiptUrl = reg.payment_receipt_url;
                      return (
                        <TableRow key={reg.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{name || "N/A"}</p>
                                <p className="text-xs text-muted-foreground">{email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{reg.events?.title}</p>
                            <Badge variant="outline" className="text-xs">{reg.type === "public" ? "Public" : "Member"}</Badge>
                          </TableCell>
                          <TableCell><span className="font-medium">₹{fee}</span></TableCell>
                          <TableCell>
                            {receiptUrl ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" />View</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
                                  <div className="max-h-[70vh] overflow-auto">
                                    <img src={receiptUrl} alt="Receipt" className="w-full rounded-lg" />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : <span className="text-muted-foreground text-sm">No receipt</span>}
                          </TableCell>
                          <TableCell>{getStatusBadge(reg.payment_status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" className="text-green-500 hover:bg-green-500/10"
                                onClick={() => updatePaymentStatus(reg.id, reg.type, "approved")} disabled={reg.payment_status === "approved"}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-500/10"
                                onClick={() => updatePaymentStatus(reg.id, reg.type, "rejected")} disabled={reg.payment_status === "rejected"}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.avgRating}</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{feedbacks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Feedback</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="space-y-1">
                  <p className="text-sm font-medium mb-2">Rating Distribution</p>
                  {[5,4,3,2,1].map(star => {
                    const count = feedbacks.filter(f => f.rating === star).length;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3">{star}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0}%` }} />
                        </div>
                        <span className="w-6 text-right text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No feedback found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedbacks.map((fb, idx) => (
                  <motion.div key={fb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="bg-card rounded-xl border border-border p-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`w-5 h-5 ${star <= fb.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{fb.rating}/5</span>
                      </div>
                      <p className="text-sm text-primary font-medium">{fb.events?.title || "Unknown Event"}</p>
                      {fb.feedback && <p className="text-muted-foreground">{fb.feedback}</p>}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><User className="w-4 h-4" />{fb.is_anonymous ? "Anonymous" : "Attendee"}</div>
                        <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(fb.created_at)}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
