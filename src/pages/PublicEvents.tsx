import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Send, UserPlus, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

interface RegistrationCount {
  [eventId: string]: number;
}

export default function PublicEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<RegistrationCount>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: "",
    team_name: "",
    team_members: [] as { name: string; email: string }[],
  });

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
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("status", ["upcoming", "ongoing"])
        .eq("visibility", "public")
        .order("start_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
      
      // Fetch registration counts
      if (data && data.length > 0) {
        await fetchRegistrationCounts(data.map(e => e.id));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationCounts = async (eventIds?: string[]) => {
    try {
      const ids = eventIds || events.map(e => e.id);
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
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setSubmitting(true);
    try {
      const payload: any = {
        event_id: selectedEvent.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message || null,
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-primary">Upcoming</span> Events
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join us for exciting events, workshops, and seminars. Register now to secure your spot!
            </p>
          </motion.div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Upcoming Events</h2>
              <p className="text-muted-foreground">Check back later for new events!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => {
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
                    {/* Event Image */}
                    <div className="relative h-48 overflow-hidden">
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
                    </div>

                    {/* Event Details */}
                    <div className="p-5">
                      <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {getTeamTypeLabel(event.team_type)}
                        </Badge>
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
                        {event.max_attendees && (
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

                      <Button
                        className="w-full"
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
                    </div>
                  </motion.div>
                );
              })}
            </div>
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

            <div>
              <label className="block text-sm font-medium mb-1.5">Message (Optional)</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Any questions or comments?"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
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