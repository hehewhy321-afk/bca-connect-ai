import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Users, Send, UserPlus, Lock, Globe, Shield, Search, Filter, X, ChevronRight, IndianRupee, Upload, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  max_attendees: number | null;
  is_featured: boolean | null;
  status: string | null;
  visibility: string | null;
  team_type: string | null;
  team_size_min: number | null;
  team_size_max: number | null;
  gallery_images: string[] | null;
  registration_fee: number | null;
}

interface RegistrationCount {
  [eventId: string]: number;
}

const EVENT_CATEGORIES = ["All", "Workshop", "Seminar", "Hackathon", "Meetup", "Competition"];
const DATE_FILTERS = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
];
const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "solo", label: "Individual" },
  { value: "duo", label: "Duo" },
  { value: "squad", label: "Squad" },
  { value: "any", label: "Team" },
];

export default function PublicEvents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [memberEvents, setMemberEvents] = useState<Event[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<RegistrationCount>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: "",
    team_name: "",
    team_members: [] as { name: string; email: string }[],
    payment_receipt_url: "",
  });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Handle registration from URL param
  useEffect(() => {
    const registerEventId = searchParams.get("register");
    if (registerEventId && !loading) {
      const event = [...publicEvents, ...memberEvents].find(e => e.id === registerEventId);
      if (event && event.visibility === "public") {
        handleRegister(event);
      }
    }
  }, [searchParams, loading, publicEvents, memberEvents]);

  useEffect(() => {
    fetchEvents();

    // Set up realtime subscription for registration counts
    const channel = supabase
      .channel('public-registrations-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_event_registrations' },
        () => {
          fetchRegistrationCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch public events
      const { data: publicData, error: publicError } = await supabase
        .from("events")
        .select("*")
        .in("status", ["upcoming", "ongoing"])
        .eq("visibility", "public")
        .order("start_date", { ascending: true });

      if (publicError) throw publicError;
      setPublicEvents(publicData || []);

      // Fetch member-only events (internal visibility)
      const { data: memberData, error: memberError } = await supabase
        .from("events")
        .select("*")
        .in("status", ["upcoming", "ongoing"])
        .eq("visibility", "internal")
        .order("start_date", { ascending: true });

      if (memberError) throw memberError;
      setMemberEvents(memberData || []);
      
      // Fetch registration counts for public events
      const allEvents = [...(publicData || []), ...(memberData || [])];
      if (allEvents.length > 0) {
        await fetchRegistrationCounts(allEvents.map(e => e.id));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on search and filters
  const filterEvents = (events: Event[]) => {
    return events.filter((event) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === "All" || 
        event.category.toLowerCase() === categoryFilter.toLowerCase();

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const eventDate = new Date(event.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateFilter === "today") {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          matchesDate = eventDate >= today && eventDate < tomorrow;
        } else if (dateFilter === "this_week") {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          matchesDate = eventDate >= today && eventDate <= weekEnd;
        } else if (dateFilter === "this_month") {
          const monthEnd = new Date(today);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          matchesDate = eventDate >= today && eventDate <= monthEnd;
        }
      }

      // Type filter
      const matchesType = typeFilter === "all" || event.team_type === typeFilter;

      return matchesSearch && matchesCategory && matchesDate && matchesType;
    });
  };

  const filteredPublicEvents = useMemo(() => filterEvents(publicEvents), [publicEvents, searchQuery, categoryFilter, dateFilter, typeFilter]);
  const filteredMemberEvents = useMemo(() => filterEvents(memberEvents), [memberEvents, searchQuery, categoryFilter, dateFilter, typeFilter]);

  const hasActiveFilters = searchQuery !== "" || categoryFilter !== "All" || dateFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setDateFilter("all");
    setTypeFilter("all");
  };

  const fetchRegistrationCounts = async (eventIds?: string[]) => {
    try {
      const ids = eventIds || [...publicEvents, ...memberEvents].map(e => e.id);
      if (ids.length === 0) return;

      const { data, error } = await supabase
        .from("public_event_registrations")
        .select("event_id")
        .in("event_id", ids);

      if (error) throw error;

      const counts: RegistrationCount = {};
      (data || []).forEach((reg) => {
        counts[reg.event_id] = (counts[reg.event_id] || 0) + 1;
      });
      setRegistrationCounts(counts);
    } catch (error) {
      console.error("Error fetching registration counts:", error);
    }
  };

  const getAvailableSpots = (event: Event) => {
    if (!event.max_attendees) return null;
    const registered = registrationCounts[event.id] || 0;
    return Math.max(0, event.max_attendees - registered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTeamTypeLabel = (teamType: string | null) => {
    switch (teamType) {
      case "solo": return "Individual";
      case "duo": return "Duo (2 members)";
      case "squad": return "Squad (3-5 members)";
      case "any": return "Team";
      default: return "Individual";
    }
  };

  const handleRegister = (event: Event) => {
    const availableSpots = getAvailableSpots(event);
    if (availableSpots !== null && availableSpots <= 0) {
      toast({
        title: "Event Full",
        description: "Sorry, this event has reached maximum capacity.",
        variant: "destructive",
      });
      return;
    }

    setSelectedEvent(event);
    setFormOpen(true);
    
    // Initialize team members based on team type
    const teamSize = event.team_type === "duo" ? 1 : 
                     event.team_type === "squad" ? (event.team_size_min || 2) : 0;
    
    setFormData({ 
      full_name: "", 
      email: "", 
      phone: "", 
      message: "",
      team_name: "",
      team_members: Array(teamSize).fill({ name: "", email: "" }),
      payment_receipt_url: "",
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-receipts")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, payment_receipt_url: urlData.publicUrl }));
      toast({
        title: "Receipt uploaded",
        description: "Your payment receipt has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    // Check if paid event requires receipt
    const hasFee = selectedEvent.registration_fee && selectedEvent.registration_fee > 0;
    if (hasFee && !formData.payment_receipt_url) {
      toast({
        title: "Payment receipt required",
        description: "Please upload your payment receipt to complete registration.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Generate unique check-in code
      const checkInCode = `EVT-${selectedEvent.id.substring(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const payload: any = {
        event_id: selectedEvent.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message || null,
        payment_receipt_url: formData.payment_receipt_url || null,
        payment_status: hasFee ? "pending" : "approved",
        check_in_code: checkInCode,
      };

      // Add team info if applicable
      if (selectedEvent.team_type !== "solo") {
        payload.team_name = formData.team_name || null;
        payload.team_members = formData.team_members.filter(m => m.name.trim());
      }

      const { error } = await supabase
        .from("public_event_registrations")
        .insert(payload);

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: `You have been registered for "${selectedEvent.title}". We'll contact you with more details.`,
      });
      setFormOpen(false);
      fetchRegistrationCounts();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateTeamMember = (index: number, field: "name" | "email", value: string) => {
    setFormData((prev) => {
      const newMembers = [...prev.team_members];
      newMembers[index] = { ...newMembers[index], [field]: value };
      return { ...prev, team_members: newMembers };
    });
  };

  const addTeamMember = () => {
    if (!selectedEvent) return;
    const max = selectedEvent.team_size_max || 5;
    if (formData.team_members.length < max - 1) {
      setFormData((prev) => ({
        ...prev,
        team_members: [...prev.team_members, { name: "", email: "" }],
      }));
    }
  };

  const removeTeamMember = (index: number) => {
    if (!selectedEvent) return;
    const min = (selectedEvent.team_size_min || 2) - 1;
    if (formData.team_members.length > min) {
      setFormData((prev) => ({
        ...prev,
        team_members: prev.team_members.filter((_, i) => i !== index),
      }));
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      workshop: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      seminar: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      hackathon: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      meetup: "bg-green-500/20 text-green-400 border-green-500/30",
      competition: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[category.toLowerCase()] || "bg-primary/20 text-primary border-primary/30";
  };

  const renderEventCard = (event: Event, index: number, isMemberOnly: boolean = false) => {
    const availableSpots = getAvailableSpots(event);
    const isFull = availableSpots !== null && availableSpots <= 0;

    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="glass-card rounded-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300"
      >
        {/* Event Image - Clickable for detail */}
        <Link to={`/events/${event.id}`} className="block relative h-48 overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary/50" />
            </div>
          )}
          {event.is_featured && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
              Featured
            </span>
          )}
          <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-medium rounded-full border ${getCategoryColor(event.category)}`}>
            {event.category}
          </span>
        </Link>

        {/* Event Details */}
        <div className="p-5">
          <Link to={`/events/${event.id}`}>
            <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
          </Link>
          {event.description && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {getTeamTypeLabel(event.team_type)}
            </Badge>
            {isMemberOnly && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Members Only
              </Badge>
            )}
            {event.registration_fee && event.registration_fee > 0 ? (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                <IndianRupee className="w-3 h-3 mr-0.5" />
                {event.registration_fee}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                Free
              </Badge>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(event.start_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{formatTime(event.start_date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.max_attendees && !isMemberOnly && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className={availableSpots !== null && availableSpots <= 5 ? "text-orange-500 font-medium" : "text-muted-foreground"}>
                  {isFull ? (
                    <span className="text-destructive font-medium">Sold Out</span>
                  ) : (
                    <>
                      {availableSpots} spots left
                      <span className="text-muted-foreground"> of {event.max_attendees}</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isMemberOnly && !user ? (
              <Button
                className="flex-1"
                onClick={() => navigate("/auth")}
              >
                <Lock className="w-4 h-4 mr-2" />
                Login to Register
              </Button>
            ) : isMemberOnly && user ? (
              <Button
                className="flex-1"
                onClick={() => navigate("/dashboard/events")}
              >
                View in Dashboard
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => handleRegister(event)}
                disabled={isFull}
                variant={isFull ? "outline" : "default"}
              >
                {isFull ? (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Sold Out
                  </span>
                ) : (
                  "Register Now"
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <Link to={`/events/${event.id}`}>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  const totalEvents = filteredPublicEvents.length + filteredMemberEvents.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">Upcoming</span> Events
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join us for exciting events, workshops, and seminars. Register now to secure your spot!
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 rounded-2xl mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFilters}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Active filters:
                </span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                {categoryFilter !== "All" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryFilter}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setCategoryFilter("All")} />
                  </Badge>
                )}
                {dateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {DATE_FILTERS.find(f => f.value === dateFilter)?.label}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setDateFilter("all")} />
                  </Badge>
                )}
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {TYPE_FILTERS.find(f => f.value === typeFilter)?.label}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setTypeFilter("all")} />
                  </Badge>
                )}
              </div>
            )}
          </motion.div>

          {/* Events Tabs */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : totalEvents === 0 && hasActiveFilters ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Events Found</h2>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : totalEvents === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Upcoming Events</h2>
              <p className="text-muted-foreground">Check back later for new events!</p>
            </div>
          ) : (
            <Tabs defaultValue="public" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="public" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Public ({filteredPublicEvents.length})
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Members ({filteredMemberEvents.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public">
                {filteredPublicEvents.length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-2xl">
                    <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Public Events Found</h2>
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? "Try adjusting your filters" : "Check back later for public events!"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPublicEvents.map((event, index) => renderEventCard(event, index, false))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members">
                {filteredMemberEvents.length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-2xl">
                    <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Member Events Found</h2>
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? "Try adjusting your filters" : "Check back later for member-exclusive events!"}
                    </p>
                  </div>
                ) : (
                  <>
                    {!user && (
                      <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Shield className="w-6 h-6 text-primary" />
                          <div>
                            <h3 className="font-semibold text-foreground">Member-Only Events</h3>
                            <p className="text-sm text-muted-foreground">Sign up to register for these exclusive events</p>
                          </div>
                        </div>
                        <Button onClick={() => navigate("/auth")}>
                          Join Now
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMemberEvents.map((event, index) => renderEventCard(event, index, true))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {/* Registration Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title}
              {selectedEvent?.team_type !== "solo" && (
                <span className="block mt-1 text-primary">
                  {getTeamTypeLabel(selectedEvent?.team_type || null)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team Leader / Individual Info */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                {selectedEvent?.team_type !== "solo" ? "Team Leader Info" : "Your Info"}
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email *</label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone (Optional)</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Team Info */}
            {selectedEvent?.team_type !== "solo" && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Team Name *</label>
                  <Input
                    required
                    value={formData.team_name}
                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                    placeholder="Enter your team name"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Team Members</p>
                    {selectedEvent && formData.team_members.length < (selectedEvent.team_size_max || 5) - 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add Member
                      </Button>
                    )}
                  </div>

                  {formData.team_members.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        required
                        placeholder={`Member ${index + 1} name`}
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="email"
                        placeholder="Email (optional)"
                        value={member.email}
                        onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                        className="flex-1"
                      />
                      {formData.team_members.length > (selectedEvent?.team_size_min || 2) - 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMember(index)}
                          className="text-destructive"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Receipt Upload for Paid Events */}
            {selectedEvent?.registration_fee && selectedEvent.registration_fee > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Registration Fee: ₹{selectedEvent.registration_fee}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please make the payment and upload the receipt below. Your registration will be confirmed after payment verification.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">Payment Receipt *</label>
                  {formData.payment_receipt_url ? (
                    <div className="relative rounded-lg border border-border overflow-hidden">
                      <img 
                        src={formData.payment_receipt_url} 
                        alt="Payment Receipt" 
                        className="w-full h-40 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({ ...formData, payment_receipt_url: "" })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      {uploadingReceipt ? (
                        <>
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="text-sm text-muted-foreground">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Click to upload payment receipt</span>
                          <span className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                        disabled={uploadingReceipt}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Message (Optional)</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Any questions or comments?"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting || uploadingReceipt}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Registering...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Registration
                </span>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}