import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  image_url: string | null;
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

  const handleDeleteInternalReg = async (id: string) => {
    if (!confirm("Delete this member registration? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("event_registrations").delete().eq("id", id);
      if (error) throw error;
      setInternalRegs(prev => prev.filter(r => r.id !== id));
      toast({ title: "Registration deleted" });
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
      <div className="space-y-10">
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
              Event Hub
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Management of lifecycle, registrations, and feedback
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin/events/new")}
            className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            CREATE EVENT
          </Button>
        </div>

        {/* Dynamic Multi-State Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Inventory", val: stats.totalEvents, icon: Calendar, color: "text-primary" },
            { label: "Members", val: stats.totalInternalRegs, icon: Users, color: "text-accent" },
            { label: "Public", val: stats.totalPublicRegs, icon: ClipboardList, color: "text-primary" },
            { label: "Unpaid", val: stats.pendingPayments, icon: CreditCard, color: "text-red-500", highlight: stats.pendingPayments > 0 },
            { label: "Active", val: stats.upcomingEvents, icon: BarChart3, color: "text-green-500" },
            { label: "Rating", val: stats.avgRating, icon: Star, color: "text-yellow-400" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-[1.75rem] border transition-all ${stat.highlight ? 'bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/5' : 'glass-card border-white/5'}`}
            >
              <div className={`p-2.5 w-fit rounded-xl bg-white/5 mb-3 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-black text-foreground tracking-tighter">{stat.val}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Center - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-4">
            <TabsList className="bg-white/5 p-1.5 rounded-[1.25rem] h-auto flex-wrap justify-start border border-white/5">
              {[
                { val: "events", label: "Registry", icon: Calendar },
                { val: "internal", label: "Members", icon: Users },
                { val: "public", label: "Public", icon: ClipboardList },
                { val: "payments", label: "Ledger", icon: CreditCard },
                { val: "feedback", label: "Insights", icon: Star }
              ].map(t => (
                <TabsTrigger
                  key={t.val}
                  value={t.val}
                  className="px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <t.icon size={14} className="mr-2" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group min-w-[260px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Universal search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                />
              </div>

              {/* Context Specific Filters */}
              <AnimatePresence mode="wait">
                {(activeTab === "internal" || activeTab === "public" || activeTab === "feedback") && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl bg-white/5 border-white/10 text-xs font-bold">
                        <SelectValue placeholder="All Clusters" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="all">Global Scope</SelectItem>
                        {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic CSV Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 px-5 rounded-xl bg-white/5 border border-white/10 font-bold text-xs group">
                    <Download className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                    EXPORT
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card p-2 border-white/10">
                  <DropdownMenuItem onClick={exportInternalRegistrations} className="rounded-lg p-3 cursor-pointer">Member Data (CSV)</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPublicRegistrations} className="rounded-lg p-3 cursor-pointer">Public Data (CSV)</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPayments} className="rounded-lg p-3 cursor-pointer">Payment Ledger (CSV)</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportFeedback} className="rounded-lg p-3 cursor-pointer">Feedback Report (CSV)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tab Contents - Modernized */}
          <TabsContent value="events" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-48 glass rounded-[2rem] animate-pulse" />)
              ) : filteredEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card rounded-[2.5rem] border border-white/5 p-8 group relative overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 p-8 z-10">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-primary/90 hover:bg-primary text-primary-foreground border border-primary/20 hover:scale-105 transition-all" onClick={() => navigate(`/admin/events/${event.id}`)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-red-500/90 hover:bg-red-500 text-white border border-red-500/20 hover:scale-105 transition-all" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Event Thumbnail */}
                  <div className="mb-6 -mx-8 -mt-8">
                    {event.image_url ? (
                      <div className="relative h-40 overflow-hidden rounded-t-[2.5rem]">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                    ) : (
                      <div className="relative h-40 overflow-hidden rounded-t-[2.5rem] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <FileImage className="w-12 h-12 text-primary/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <Badge className={`uppercase tracking-tighter font-black text-[9px] px-3 py-1 rounded-full mb-4 ${event.status === "upcoming" ? "bg-primary text-primary-foreground" :
                      event.status === "ongoing" ? "bg-green-500 text-white" : "bg-white/10 text-muted-foreground"
                      }`}>
                      {event.status}
                    </Badge>
                    <h3 className="text-xl font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors decoration-primary/30 decoration-2 underline-offset-4 line-clamp-2">
                      {event.title}
                    </h3>
                  </div>

                  <div className="space-y-4 mt-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Date</p>
                        <div className="flex items-center gap-2 font-black text-xs text-foreground">
                          <Calendar size={14} className="text-primary" />
                          {formatDate(event.start_date)}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Category</p>
                        <div className="flex items-center gap-2 font-black text-xs text-foreground">
                          <Star size={14} className="text-accent" />
                          {event.category.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-1.5 font-black text-xs text-muted-foreground">
                        <MapPin size={14} className="text-primary" />
                        {event.location}
                      </div>
                      {event.registration_fee ? (
                        <div className="text-primary font-black text-lg tracking-tighter">₹{event.registration_fee}</div>
                      ) : <div className="text-green-500 font-black text-xs uppercase tracking-widest">Free Entry</div>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Members/Registrations View */}
          <TabsContent value="internal" className="mt-8 space-y-4">
            {filteredInternalRegs.map((reg, idx) => (
              <motion.div key={reg.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                className="glass-card rounded-3xl border border-white/5 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                    {reg.attended ? <Check className="text-primary w-6 h-6" /> : <User className="text-muted-foreground w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {reg.profiles?.full_name || "Nexus Node Member"}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-tighter">{reg.events?.title}</span>
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">• IN-RESIDENCE •</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="hidden xl:flex flex-col items-end">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Authenticated Email</span>
                    <span className="text-sm font-black text-foreground">{reg.profiles?.email}</span>
                  </div>
                  <div className="w-[1px] h-10 bg-white/5 hidden xl:block" />
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      className={`h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${reg.attended ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-white/5 border border-white/10 text-muted-foreground active:scale-95"
                        }`}
                      onClick={() => handleToggleAttended(reg.id, reg.attended)}
                    >
                      {reg.attended ? "PRESENT" : "MARK PRESENT"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      onClick={() => handleDeleteInternalReg(reg.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* Ledger - Payments */}
          <TabsContent value="payments" className="mt-8">
            <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5 border-b border-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operator</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Deployment Cluster</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Valuation</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Verification</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status Flag</TableHead>
                    <TableHead className="text-right px-8 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidRegistrations.map(reg => (
                    <TableRow key={reg.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                      <TableCell className="py-6 px-8 font-bold text-foreground">
                        <div className="flex flex-col">
                          <span className="text-sm group-hover:text-primary transition-colors">{reg.type === "public" ? reg.full_name : reg.profiles?.full_name}</span>
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{reg.type} user</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{reg.events?.title}</span>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-500/10 text-green-400 font-black text-sm border border-green-500/20">
                          <IndianRupee size={12} />
                          {reg.events?.registration_fee}
                        </div>
                      </TableCell>
                      <TableCell>
                        {reg.payment_receipt_url ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" className="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest">
                                <FileImage size={14} className="mr-2 text-primary" />
                                SCREENSHOT
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl glass border-white/10">
                              <img src={reg.payment_receipt_url} alt="Proof" className="w-full rounded-[2rem] border border-white/5 shadow-2xl" />
                            </DialogContent>
                          </Dialog>
                        ) : <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">NO PROOF</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`uppercase tracking-tighter font-black text-[8px] px-3 py-1 rounded-full ${reg.payment_status === "approved" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                          reg.payment_status === "rejected" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
                          }`}>
                          {reg.payment_status || "PENDING"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" className="w-10 h-10 rounded-xl bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white transition-all" onClick={() => updatePaymentStatus(reg.id, reg.type, "approved")}>
                            <Check size={18} />
                          </Button>
                          <Button size="icon" className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all" onClick={() => updatePaymentStatus(reg.id, reg.type, "rejected")}>
                            <X size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Insights - Feedback */}
          <TabsContent value="feedback" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Visual Analytics Summary */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-card rounded-[2.5rem] border border-white/5 p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Satisfaction Index</p>
                  <div className="text-7xl font-black text-primary tracking-tighter mb-4">{stats.avgRating}</div>
                  <div className="flex justify-center gap-1 mb-8">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={20} className={i <= Math.round(parseFloat(stats.avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-white/10"} />
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(r => {
                      const count = feedbacks.filter(f => f.rating === r).length;
                      const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                      return (
                        <div key={r} className="flex items-center gap-4 group/row">
                          <span className="text-[10px] font-black text-muted-foreground w-4">{r}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-primary" />
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground w-8 text-right opacity-40 group-hover/row:opacity-100">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Individual Reports */}
              <div className="lg:col-span-2 grid gap-4">
                {filteredFeedbacks.map((fb, idx) => (
                  <motion.div key={fb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                    className="glass-card rounded-[2rem] border border-white/5 p-8 relative group">
                    <div className="absolute top-8 right-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-30 group-hover:opacity-100 transition-opacity">
                      {formatDate(fb.created_at)}
                    </div>
                    <div className="flex items-center gap-1.5 mb-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={14} className={i <= fb.rating ? "fill-yellow-400 text-yellow-400" : "text-white/5"} />
                      ))}
                    </div>
                    <p className="text-sm font-black text-primary uppercase tracking-widest mb-3">{fb.events?.title}</p>
                    <p className="text-lg font-bold text-foreground leading-relaxed italic border-l-4 border-primary/20 pl-6 my-6">"{fb.feedback || "System reported optimal results without text commentary."}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <User size={12} className="text-muted-foreground" />
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{fb.is_anonymous ? "ANONYMOUS DATA POINT" : "VERIFIED ATTENDEE"}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Fallback for Public Registrations (Not listed above but exists in logic) */}
          <TabsContent value="public" className="mt-8 space-y-4">
            {filteredPublicRegs.map((reg, idx) => (
              <motion.div key={reg.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                className="glass-card rounded-3xl border border-white/5 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                    <ClipboardList className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{reg.full_name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      {reg.email}
                      {reg.phone && <span className="opacity-60">• {reg.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Assigned Cluster</span>
                    <span className="text-sm font-black text-foreground">{reg.events?.title}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all" onClick={() => handleDeletePublicReg(reg.id)}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
