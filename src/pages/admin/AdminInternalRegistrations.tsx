import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Trash2, Mail, Calendar, Users, User } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  registered_at: string;
  attended: boolean;
  team_name: string | null;
  team_members: any;
  events: {
    title: string;
    start_date: string;
    max_attendees: number | null;
    team_type: string;
  } | null;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface Event {
  id: string;
  title: string;
}

export default function AdminInternalRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel('internal-registrations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch registrations without profiles join (no FK exists)
      const { data: regData, error: regError } = await supabase
        .from("event_registrations")
        .select(`*, events (title, start_date, max_attendees, team_type)`)
        .order("registered_at", { ascending: false });

      if (regError) throw regError;

      // Fetch profiles separately
      const userIds = [...new Set((regData || []).map(r => r.user_id))];
      let profilesMap: Record<string, { full_name: string; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string; email: string }>);
        }
      }

      // Merge profiles into registrations
      const registrationsWithProfiles = (regData || []).map(r => ({
        ...r,
        profiles: profilesMap[r.user_id] || null,
      })) as Registration[];

      setRegistrations(registrationsWithProfiles);

      // Fetch events
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id, title")
        .order("start_date", { ascending: false });

      if (eventError) throw eventError;
      setEvents(eventData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttended = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({ attended: !currentValue })
        .eq("id", id);

      if (error) throw error;
      
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, attended: !currentValue } : r))
      );
      toast({ title: `Marked as ${!currentValue ? "attended" : "not attended"}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const getRegistrationCount = (eventId: string) => {
    return registrations.filter((r) => r.event_id === eventId).length;
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.team_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === "all" || r.event_id === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  // Group by event for stats
  const eventStats = events.map((event) => {
    const count = getRegistrationCount(event.id);
    const eventData = registrations.find((r) => r.event_id === event.id)?.events;
    return {
      ...event,
      registrations: count,
      maxAttendees: eventData?.max_attendees,
    };
  }).filter((e) => e.registrations > 0);

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
            <h1 className="font-heading text-2xl font-bold">Internal Member Registrations</h1>
            <p className="text-muted-foreground text-sm">
              View registrations from logged-in members
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{registrations.length}</p>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
              </div>
            </div>
          </div>
          {eventStats.slice(0, 3).map((event) => (
            <div key={event.id} className="glass-card rounded-xl p-5">
              <p className="text-sm font-medium truncate">{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold">{event.registrations}</span>
                {event.maxAttendees && (
                  <span className="text-muted-foreground">/ {event.maxAttendees}</span>
                )}
                <span className="text-xs text-muted-foreground">registered</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or team..."
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

        {/* Registrations List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {reg.profiles?.full_name || "Unknown User"}
                      </h3>
                      <Badge variant={reg.attended ? "default" : "outline"}>
                        {reg.attended ? "Attended" : "Registered"}
                      </Badge>
                      {reg.team_name && (
                        <Badge variant="secondary">
                          Team: {reg.team_name}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-primary font-medium">
                      {reg.events?.title || "Unknown Event"}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {reg.profiles?.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${reg.profiles.email}`} className="hover:text-primary">
                            {reg.profiles.email}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(reg.registered_at)}</span>
                      </div>
                    </div>

                    {reg.team_members && Array.isArray(reg.team_members) && reg.team_members.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">Team Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {reg.team_members.map((member: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {typeof member === 'string' ? member : member.name || 'Member'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant={reg.attended ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleAttended(reg.id, reg.attended)}
                  >
                    {reg.attended ? "Mark Absent" : "Mark Attended"}
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