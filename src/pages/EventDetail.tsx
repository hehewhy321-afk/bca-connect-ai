import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowLeft, 
  User,
  ListOrdered,
  Info,
  Lock,
  Globe,
  Shield,
  IndianRupee,
  CalendarClock,
  FileText,
  QrCode
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { EventGallery } from "@/components/events/EventGallery";
import { SocialShareButtons } from "@/components/events/SocialShareButtons";
import { EventReminderForm } from "@/components/events/EventReminderForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  gallery_images: string[] | null;
  registration_fee: number | null;
  admin_notes: string | null;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [userRegistration, setUserRegistration] = useState<any>(null);

  const fetchUserRegistration = async () => {
    if (!user || !id) return;
    
    try {
      // Check internal registrations first
      const { data: internalReg } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (internalReg) {
        setUserRegistration(internalReg);
        return;
      }
      
      // Check public registrations by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile?.email) {
        const { data: publicReg } = await supabase
          .from("public_event_registrations")
          .select("*")
          .eq("event_id", id)
          .eq("email", profile.email)
          .maybeSingle();
        
        if (publicReg) {
          setUserRegistration(publicReg);
        }
      }
    } catch (error) {
      console.error("Error fetching user registration:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchRegistrationCount();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      fetchUserRegistration();
    }
  }, [user, id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data as Event);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Event not found",
        description: "The event you're looking for doesn't exist.",
        variant: "destructive",
      });
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationCount = async () => {
    try {
      const { count, error } = await supabase
        .from("public_event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", id);

      if (error) throw error;
      setRegistrationCount(count || 0);
    } catch (error) {
      console.error("Error fetching registration count:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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
      case "solo": return "Individual Participation";
      case "duo": return "Duo (2 members)";
      case "squad": return "Squad (3-5 members)";
      case "any": return "Team Event";
      default: return "Individual Participation";
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

  const getAvailableSpots = () => {
    if (!event?.max_attendees) return null;
    return Math.max(0, event.max_attendees - registrationCount);
  };

  const handleRegisterClick = () => {
    if (event?.visibility === "internal") {
      if (user) {
        navigate("/dashboard/events");
      } else {
        navigate("/auth");
      }
    } else {
      navigate(`/events?register=${event?.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-32 bg-muted rounded" />
              <div className="h-64 md:h-96 bg-muted rounded-2xl" />
              <div className="h-10 w-2/3 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) return null;

  const availableSpots = getAvailableSpots();
  const isFull = availableSpots !== null && availableSpots <= 0;
  const isMemberOnly = event.visibility === "internal";
  const hasGallery = event.gallery_images && event.gallery_images.length > 0;
  const hasFee = event.registration_fee && event.registration_fee > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/events")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-4 sm:space-y-6"
            >
              {/* Event Image */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-video">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Calendar className="w-16 h-16 sm:w-24 sm:h-24 text-primary/50" />
                  </div>
                )}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-wrap gap-1 sm:gap-2">
                  {event.is_featured && (
                    <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                  )}
                  <Badge className={`${getCategoryColor(event.category)} text-xs`}>
                    {event.category}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs">
                    {isMemberOnly ? (
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span className="hidden xs:inline">Members Only</span>
                        <span className="xs:hidden">Members</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Event Gallery */}
              {hasGallery && (
                <div className="glass-card p-6 rounded-2xl">
                  <EventGallery 
                    images={event.gallery_images || []} 
                    mainImage={event.image_url}
                  />
                </div>
              )}

              {/* Event Title & Description */}
              <div className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                  {event.title}
                </h1>
                
                {event.description && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {event.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Event Details Sections */}
              <div className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4 sm:space-y-6">
                {/* About Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h2 className="font-heading text-lg sm:text-xl font-semibold">About This Event</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Start Date */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium text-sm sm:text-base truncate">{formatDate(event.start_date)}</p>
                      </div>
                    </div>
                    {/* Start Time */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Start Time</p>
                        <p className="font-medium text-sm sm:text-base">{formatTime(event.start_date)}</p>
                      </div>
                    </div>
                    {/* End Date */}
                    {event.end_date && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground">End Date</p>
                          <p className="font-medium text-sm sm:text-base truncate">{formatDate(event.end_date)}</p>
                        </div>
                      </div>
                    )}
                    {/* End Time */}
                    {event.end_date && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">End Time</p>
                          <p className="font-medium text-sm sm:text-base">{formatTime(event.end_date)}</p>
                        </div>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground">Location</p>
                          <p className="font-medium text-sm sm:text-base truncate">{event.location}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Participation</p>
                        <p className="font-medium text-sm sm:text-base truncate">{getTeamTypeLabel(event.team_type)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rules & Regulations (Admin Notes) */}
                {event.admin_notes && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="font-heading text-xl font-semibold">Rules & Regulations</h2>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground whitespace-pre-wrap">{event.admin_notes}</p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Agenda/Schedule Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ListOrdered className="w-5 h-5 text-primary" />
                    <h2 className="font-heading text-xl font-semibold">Event Schedule</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="text-primary font-mono text-sm min-w-[80px]">
                        {formatTime(event.start_date)}
                      </div>
                      <div>
                        <p className="font-medium">Event Begins</p>
                        <p className="text-sm text-muted-foreground">Welcome and introduction</p>
                      </div>
                    </div>
                    {event.end_date && (
                      <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="text-primary font-mono text-sm min-w-[80px]">
                          {formatTime(event.end_date)}
                        </div>
                        <div>
                          <p className="font-medium">Event Ends</p>
                          <p className="text-sm text-muted-foreground">Closing remarks and networking</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Speaker/Organizer Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="font-heading text-xl font-semibold">Organized By</h2>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Association Team</p>
                      <p className="text-sm text-muted-foreground">Event Organizers</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 order-first lg:order-last"
            >
              {/* Registration Card */}
              <div className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl lg:sticky lg:top-24">
                <div className="space-y-4">
                  {event.max_attendees && !isMemberOnly && (
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      {isFull ? (
                        <p className="text-destructive font-semibold text-lg">Sold Out</p>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-primary">{availableSpots}</p>
                          <p className="text-sm text-muted-foreground">spots remaining</p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="text-center">
                    {hasFee ? (
                      <>
                        <div className="flex items-center justify-center gap-1">
                          <IndianRupee className="w-6 h-6 text-primary" />
                          <p className="text-3xl font-bold">{event.registration_fee}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Registration Fee</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-green-500">Free</p>
                        <p className="text-sm text-muted-foreground">Registration</p>
                      </>
                    )}
                  </div>

                  {isMemberOnly && !user ? (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => navigate("/auth")}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Login to Register
                    </Button>
                  ) : isMemberOnly && user ? (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => navigate("/dashboard/events")}
                    >
                      Register in Dashboard
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={isFull}
                      onClick={handleRegisterClick}
                    >
                      {isFull ? "Event Full" : "Register Now"}
                    </Button>
                  )}

                  {/* Event Reminder */}
                  <EventReminderForm eventId={event.id} eventTitle={event.title} />
                </div>

                <Separator className="my-4" />

                {/* Social Share */}
                <SocialShareButtons 
                  title={event.title} 
                  description={event.description} 
                />

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium capitalize">{event.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className="capitalize">{event.status}</Badge>
                  </div>
                  {hasFee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee</span>
                      <span className="font-medium flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />
                        {event.registration_fee}
                      </span>
                    </div>
                  )}
                  {event.team_type && event.team_type !== "solo" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Team Size</span>
                        <span className="font-medium">{event.team_size_min || 2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Team Size</span>
                        <span className="font-medium">{event.team_size_max || 5}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* QR Code for registered users */}
                {userRegistration?.check_in_code && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Your Check-in QR Code</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full gap-2">
                            <QrCode className="w-4 h-4" />
                            View QR Code
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-center">Event Check-in QR Code</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center justify-center p-6 space-y-4">
                            <div className="bg-white p-4 rounded-lg">
                              <QRCodeSVG 
                                value={userRegistration.check_in_code}
                                size={200}
                                level="H"
                                includeMargin
                              />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                              Show this QR code at the event venue for quick check-in
                            </p>
                            <p className="text-xs font-mono bg-muted px-3 py-1 rounded">
                              {userRegistration.check_in_code}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}