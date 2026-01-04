import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Trash2, Mail, Phone, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  event_id: string;
  events: {
    title: string;
    start_date: string;
  };
}

interface Event {
  id: string;
  title: string;
}

export default function AdminPublicRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [regResult, eventResult] = await Promise.all([
        supabase
          .from("public_event_registrations")
          .select(`
            *,
            events (title, start_date)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("id, title")
          .order("start_date", { ascending: false }),
      ]);

      if (regResult.error) throw regResult.error;
      if (eventResult.error) throw eventResult.error;

      setRegistrations(regResult.data || []);
      setEvents(eventResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {
      const { error } = await supabase
        .from("public_event_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Registration deleted" });
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === "all" || r.event_id === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold">Public Event Registrations</h1>
            <p className="text-muted-foreground text-sm">
              View registrations from the public events page
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Total Registrations: <span className="font-semibold text-foreground">{filteredRegistrations.length}</span>
          </p>
        </div>

        {/* Registrations List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <p className="text-muted-foreground">No registrations found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((reg, index) => (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="font-semibold text-lg">{reg.full_name}</h3>
                      <p className="text-sm text-primary font-medium">
                        {reg.events?.title || "Unknown Event"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${reg.email}`} className="hover:text-primary">
                          {reg.email}
                        </a>
                      </div>
                      {reg.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${reg.phone}`} className="hover:text-primary">
                            {reg.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(reg.created_at)}</span>
                      </div>
                    </div>
                    {reg.message && (
                      <div className="flex items-start gap-1.5 text-sm">
                        <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <p className="text-muted-foreground">{reg.message}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(reg.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}