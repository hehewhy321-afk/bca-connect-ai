import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Star, Calendar, User, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Feedback {
  id: string;
  rating: number;
  feedback: string | null;
  is_anonymous: boolean;
  created_at: string;
  event_id: string;
  user_id: string;
  events: {
    title: string;
  } | null;
}

interface Event {
  id: string;
  title: string;
}

export default function AdminEventFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feedbackResult, eventResult] = await Promise.all([
        supabase
          .from("event_feedback")
          .select(`
            *,
            events (title)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("id, title")
          .eq("status", "completed")
          .order("start_date", { ascending: false }),
      ]);

      if (feedbackResult.error) throw feedbackResult.error;
      if (eventResult.error) throw eventResult.error;

      setFeedbacks(feedbackResult.data || []);
      setEvents(eventResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAverageRating = () => {
    if (filteredFeedbacks.length === 0) return 0;
    const sum = filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredFeedbacks.forEach((f) => {
      dist[f.rating as keyof typeof dist]++;
    });
    return dist;
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      (f.feedback?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      f.events?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === "all" || f.event_id === selectedEvent;
    const matchesRating = ratingFilter === "all" || f.rating === parseInt(ratingFilter);
    return matchesSearch && matchesEvent && matchesRating;
  });

  const distribution = getRatingDistribution();

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
            <h1 className="font-heading text-2xl font-bold">Event Feedback</h1>
            <p className="text-muted-foreground text-sm">
              View feedback and ratings from event attendees
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{getAverageRating()}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredFeedbacks.length}</p>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium mb-2">Rating Distribution</p>
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{star}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{
                        width: `${filteredFeedbacks.length > 0 ? (distribution[star as keyof typeof distribution] / filteredFeedbacks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">
                    {distribution[star as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
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
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={r.toString()}>
                  {r} Star{r > 1 && "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No feedback found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((fb, index) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= fb.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{fb.rating}/5</span>
                    </div>
                    
                    <p className="text-sm text-primary font-medium">
                      {fb.events?.title || "Unknown Event"}
                    </p>
                    
                    {fb.feedback && (
                      <p className="text-muted-foreground">{fb.feedback}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>
                          {fb.is_anonymous ? "Anonymous" : "Attendee"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(fb.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}