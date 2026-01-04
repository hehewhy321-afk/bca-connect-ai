import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Camera,
  CameraOff,
  Check,
  X,
  User,
  Calendar,
  Clock,
  Search,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  start_date: string;
}

interface CheckInRecord {
  id: string;
  name: string;
  email: string;
  eventTitle: string;
  checkedInAt: Date;
  type: "member" | "public";
}

export default function AdminQRScanner() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchStats();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date")
      .in("status", ["upcoming", "ongoing"])
      .order("start_date", { ascending: true });
    setEvents(data || []);
    if (data && data.length > 0) {
      setSelectedEvent(data[0].id);
    }
  };

  const fetchStats = async () => {
    if (!selectedEvent) return;

    // Count internal registrations
    const { count: internalTotal } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", selectedEvent);

    const { count: internalCheckedIn } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", selectedEvent)
      .eq("attended", true);

    // Count public registrations
    const { count: publicTotal } = await supabase
      .from("public_event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", selectedEvent);

    // For public registrations, we'll check based on check_in_code being used
    // Since there's no attended field, we'll count those with payment_status = 'approved' as potential attendees

    setStats({
      total: (internalTotal || 0) + (publicTotal || 0),
      checkedIn: internalCheckedIn || 0,
    });
  };

  const startScanner = async () => {
    if (!scannerContainerRef.current) return;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => {} // Ignore scan errors
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    await processCheckIn(decodedText);
  };

  const processCheckIn = async (code: string) => {
    if (!selectedEvent || isProcessing) return;

    setIsProcessing(true);

    try {
      // First, try to find in internal registrations
      const { data: internalReg, error: internalError } = await supabase
        .from("event_registrations")
        .select(`
          id, user_id, attended, check_in_code,
          events (title)
        `)
        .eq("event_id", selectedEvent)
        .eq("check_in_code", code)
        .single();

      if (internalReg && !internalError) {
        if (internalReg.attended) {
          toast({
            title: "Already Checked In",
            description: "This attendee has already been checked in.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", internalReg.user_id)
          .single();

        // Update attendance
        await supabase
          .from("event_registrations")
          .update({ attended: true })
          .eq("id", internalReg.id);

        const checkIn: CheckInRecord = {
          id: internalReg.id,
          name: profile?.full_name || "Unknown",
          email: profile?.email || "",
          eventTitle: internalReg.events?.title || "",
          checkedInAt: new Date(),
          type: "member",
        };

        setRecentCheckIns((prev) => [checkIn, ...prev.slice(0, 9)]);
        setStats((prev) => ({ ...prev, checkedIn: prev.checkedIn + 1 }));

        toast({
          title: "Check-in Successful!",
          description: `${checkIn.name} has been checked in.`,
        });

        setIsProcessing(false);
        return;
      }

      // Try public registrations
      const { data: publicReg, error: publicError } = await supabase
        .from("public_event_registrations")
        .select(`
          id, full_name, email, check_in_code,
          events (title)
        `)
        .eq("event_id", selectedEvent)
        .eq("check_in_code", code)
        .single();

      if (publicReg && !publicError) {
        const checkIn: CheckInRecord = {
          id: publicReg.id,
          name: publicReg.full_name,
          email: publicReg.email,
          eventTitle: publicReg.events?.title || "",
          checkedInAt: new Date(),
          type: "public",
        };

        setRecentCheckIns((prev) => [checkIn, ...prev.slice(0, 9)]);

        toast({
          title: "Check-in Successful!",
          description: `${checkIn.name} (Public) has been checked in.`,
        });

        setIsProcessing(false);
        return;
      }

      // Code not found
      toast({
        title: "Invalid Code",
        description: "This QR code is not valid for the selected event.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Check-in error:", error);
      toast({
        title: "Error",
        description: "Failed to process check-in. Please try again.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const handleManualCheckIn = async () => {
    if (!manualCode.trim()) return;
    await processCheckIn(manualCode.trim());
    setManualCode("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Event Check-in Scanner
          </h1>
          <p className="text-muted-foreground">
            Scan QR codes to mark attendee presence
          </p>
        </div>

        {/* Event Selection & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Select Event</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-400">
                Checked In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">
                  {stats.checkedIn}
                </span>
                <span className="text-sm text-green-400/70">
                  / {stats.total}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Point camera at attendee's QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scanner Container */}
              <div
                id="qr-reader"
                ref={scannerContainerRef}
                className={`relative rounded-xl overflow-hidden bg-muted ${
                  isScanning ? "aspect-square" : "h-64"
                }`}
              >
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Camera is off
                      <br />
                      Click "Start Scanner" to begin
                    </p>
                  </div>
                )}
              </div>

              {/* Scanner Controls */}
              <div className="flex gap-3">
                {!isScanning ? (
                  <Button
                    onClick={startScanner}
                    className="flex-1"
                    disabled={!selectedEvent}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanner
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanner}
                    variant="destructive"
                    className="flex-1"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop Scanner
                  </Button>
                )}
              </div>

              {/* Manual Code Entry */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">Manual Code Entry</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter check-in code..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualCheckIn()}
                  />
                  <Button
                    onClick={handleManualCheckIn}
                    disabled={!manualCode.trim() || isProcessing}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-muted-foreground">
                    Processing...
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Check-ins
              </CardTitle>
              <CardDescription>Last 10 successful check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No check-ins yet
                    <br />
                    Scan a QR code to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.map((checkIn, idx) => (
                    <motion.div
                      key={`${checkIn.id}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{checkIn.name}</p>
                          <Badge
                            variant="outline"
                            className={
                              checkIn.type === "member"
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-secondary/10 text-secondary border-secondary/30"
                            }
                          >
                            {checkIn.type === "member" ? "Member" : "Public"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {checkIn.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-400">
                          {formatTime(checkIn.checkedInAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
