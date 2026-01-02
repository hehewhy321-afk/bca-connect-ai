import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Clock, Search, Filter, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string | null;
  location: string;
  image_url: string;
  max_attendees: number | null;
  is_featured: boolean;
  status: string;
}

interface Registration {
  event_id: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = ["all", "Workshop", "Seminar", "Competition", "Social"];

  useEffect(() => {
    fetchEvents();
    if (user) fetchRegistrations();
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to register for events.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
      });

      if (error) throw error;

      setRegistrations((prev) => [...prev, { event_id: eventId }]);
      toast({
        title: "Registered!",
        description: "You have successfully registered for this event.",
      });
    } catch (error: any) {
      if (error.code === "23505") {
        toast({
          title: "Already registered",
          description: "You are already registered for this event.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to register. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;

      setRegistrations((prev) => prev.filter((r) => r.event_id !== eventId));
      toast({
        title: "Registration cancelled",
        description: "Your registration has been cancelled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel registration.",
        variant: "destructive",
      });
    }
  };

  const isRegistered = (eventId: string) => {
    return registrations.some((r) => r.event_id === eventId);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Events
            </h1>
            <p className="text-muted-foreground">
              Discover and register for upcoming workshops, seminars, and more.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "All" : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-foreground mb-2">
              No events found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"
              >
                <div className="h-full rounded-2xl bg-card border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop"}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.category === "Workshop"
                            ? "bg-primary text-primary-foreground"
                            : event.category === "Seminar"
                            ? "bg-accent text-accent-foreground"
                            : event.category === "Competition"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {event.category}
                      </span>
                      {event.is_featured && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          Featured
                        </span>
                      )}
                    </div>
                    <div
                      className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === "upcoming"
                          ? "bg-accent/90 text-accent-foreground"
                          : event.status === "ongoing"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {event.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{event.location}</span>
                      </div>
                      {event.max_attendees && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>{event.max_attendees} spots</span>
                        </div>
                      )}
                    </div>

                    {event.status === "upcoming" && (
                      isRegistered(event.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleCancelRegistration(event.id)}
                        >
                          Cancel Registration
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => handleRegister(event.id)}
                        >
                          Register Now
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
