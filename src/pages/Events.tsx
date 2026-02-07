import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Clock, Search, Filter, ExternalLink, Star, Eye, IndianRupee, FileText, ListOrdered, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EventFeedbackDialog } from "@/components/events/EventFeedbackDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  registration_fee: number | null;
  team_type: string | null;
  team_size_min: number | null;
  team_size_max: number | null;
  gallery_images: string[] | null;
  admin_notes: string | null;
}

interface Registration {
  event_id: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState<Event | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = ["all", "Workshop", "Seminar", "Competition", "Social"];

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchRegistrations();
      fetchFeedbackGiven();
    }
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

  const fetchFeedbackGiven = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("event_feedback")
        .select("event_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setFeedbackGiven((data || []).map((f) => f.event_id));
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const hasFeedback = (eventId: string) => {
    return feedbackGiven.includes(eventId);
  };

  const handleFeedback = (event: Event) => {
    setSelectedEventForFeedback(event);
    setFeedbackDialogOpen(true);
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEventForDetails(event);
    setDetailsDialogOpen(true);
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
      // Generate unique check-in code
      const checkInCode = `EVT-${eventId.substring(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: user.id,
        check_in_code: checkInCode,
        payment_status: "approved", // Internal registrations are auto-approved
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTeamTypeLabel = (teamType: string | null) => {
    switch (teamType) {
      case "solo": return "Individual Participation";
      case "duo": return "Duo (2 members)";
      case "squad": return "Squad (3-5 members)";
      case "any": return "Team Event";
      default: return "Individual Participation";
    }
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
                        className={`px-3 py-1 rounded-full text-xs font-medium ${event.category === "Workshop"
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
                      className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${event.status === "upcoming"
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

                    <div className="flex gap-2">
                      {event.status === "upcoming" && (
                        isRegistered(event.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleCancelRegistration(event.id)}
                          >
                            Cancel Registration
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRegister(event.id)}
                          >
                            Register Now
                          </Button>
                        )
                      )}

                      {event.status === "completed" && isRegistered(event.id) && (
                        <Button
                          variant={hasFeedback(event.id) ? "outline" : "default"}
                          size="sm"
                          className="flex-1"
                          onClick={() => handleFeedback(event)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {hasFeedback(event.id) ? "Update Feedback" : "Give Feedback"}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(event)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Feedback Dialog */}
        {selectedEventForFeedback && (
          <EventFeedbackDialog
            open={feedbackDialogOpen}
            onOpenChange={setFeedbackDialogOpen}
            eventId={selectedEventForFeedback.id}
            eventTitle={selectedEventForFeedback.title}
            onSuccess={fetchFeedbackGiven}
          />
        )}

        {/* Event Details Dialog */}
        {selectedEventForDetails && (
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">
                  {selectedEventForDetails.title}
                </DialogTitle>
                <DialogDescription>
                  Full event details and information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Event Image */}
                {selectedEventForDetails.image_url && (
                  <div className="relative h-64 rounded-xl overflow-hidden">
                    <img
                      src={selectedEventForDetails.image_url}
                      alt={selectedEventForDetails.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedEventForDetails.is_featured && (
                      <Badge className="absolute top-4 left-4 bg-primary">
                        Featured Event
                      </Badge>
                    )}
                    <Badge className="absolute top-4 right-4 bg-secondary">
                      {selectedEventForDetails.category}
                    </Badge>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">About this Event</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedEventForDetails.description}
                  </p>
                </div>

                <Separator />

                {/* Event Details Grid */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Event Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Start Date */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium text-sm">{formatFullDate(selectedEventForDetails.start_date)}</p>
                      </div>
                    </div>

                    {/* Start Time */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Start Time</p>
                        <p className="font-medium text-sm">{formatTime(selectedEventForDetails.start_date)}</p>
                      </div>
                    </div>

                    {/* End Date */}
                    {selectedEventForDetails.end_date && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <CalendarClock className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">End Date</p>
                          <p className="font-medium text-sm">{formatFullDate(selectedEventForDetails.end_date)}</p>
                        </div>
                      </div>
                    )}

                    {/* End Time */}
                    {selectedEventForDetails.end_date && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">End Time</p>
                          <p className="font-medium text-sm">{formatTime(selectedEventForDetails.end_date)}</p>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium text-sm">{selectedEventForDetails.location}</p>
                      </div>
                    </div>

                    {/* Participation Type */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Users className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Participation</p>
                        <p className="font-medium text-sm">{getTeamTypeLabel(selectedEventForDetails.team_type)}</p>
                      </div>
                    </div>

                    {/* Max Attendees */}
                    {selectedEventForDetails.max_attendees && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Max Attendees</p>
                          <p className="font-medium text-sm">{selectedEventForDetails.max_attendees} spots</p>
                        </div>
                      </div>
                    )}

                    {/* Registration Fee */}
                    {selectedEventForDetails.registration_fee !== null && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <IndianRupee className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Registration Fee</p>
                          <p className="font-medium text-sm">
                            {selectedEventForDetails.registration_fee > 0
                              ? `₹${selectedEventForDetails.registration_fee}`
                              : "Free"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rules & Regulations */}
                {selectedEventForDetails.admin_notes && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">Rules & Regulations</h3>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedEventForDetails.admin_notes}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Event Schedule */}
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ListOrdered className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Event Schedule</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="text-primary font-mono text-sm min-w-[80px]">
                        {formatTime(selectedEventForDetails.start_date)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Event Begins</p>
                        <p className="text-xs text-muted-foreground">Welcome and introduction</p>
                      </div>
                    </div>
                    {selectedEventForDetails.end_date && (
                      <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="text-primary font-mono text-sm min-w-[80px]">
                          {formatTime(selectedEventForDetails.end_date)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Event Ends</p>
                          <p className="text-xs text-muted-foreground">Closing remarks and networking</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Images */}
                {selectedEventForDetails.gallery_images && selectedEventForDetails.gallery_images.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Event Gallery</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedEventForDetails.gallery_images.map((img, idx) => (
                        <div key={idx} className="relative h-32 rounded-lg overflow-hidden">
                          <img
                            src={img}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedEventForDetails.status === "upcoming" && (
                    isRegistered(selectedEventForDetails.id) ? (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          handleCancelRegistration(selectedEventForDetails.id);
                          setDetailsDialogOpen(false);
                        }}
                      >
                        Cancel Registration
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={() => {
                          handleRegister(selectedEventForDetails.id);
                          setDetailsDialogOpen(false);
                        }}
                      >
                        Register Now
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
