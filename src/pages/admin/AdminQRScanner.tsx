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
import { Label } from "@/components/ui/label";
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
        () => { } // Ignore scan errors
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
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                Sentinel Protocol
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Scanning and validating entity access sequences
              </p>
            </div>
          </div>
        </div>

        {/* Global Hub Select & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-3 ml-1">Active Sector (Event)</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-bold">
                <SelectValue placeholder="Choose event" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/10">
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id} className="font-bold">
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1">Total Signals (Registrations)</p>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User className="w-5 h-5" />
              </div>
              <span className="text-3xl font-black text-foreground tracking-tight">{stats.total}</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-[2rem] border border-primary/20 bg-primary/5 relative overflow-hidden group">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Validated Nodes (Checked In)</p>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <Check className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-green-500 tracking-tight">{stats.checkedIn}</span>
                <span className="text-xs font-bold text-green-500/50 uppercase tracking-widest">/ {stats.total}</span>
              </div>
            </div>
            {/* Pulsing indicator */}
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Core */}
          <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-2 underline-offset-4">Sensor Array</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Visual code decryption field</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="relative aspect-square max-w-sm mx-auto">
                {/* Scanner Frame Decoration */}
                <div className="absolute -inset-4 border-2 border-primary/20 rounded-[2.5rem] pointer-events-none" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl z-20" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl z-20" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl z-20" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl z-20" />

                <div
                  id="qr-reader"
                  ref={scannerContainerRef}
                  className={`relative rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 w-full h-full shadow-inner ${isScanning ? "" : "flex flex-col items-center justify-center"
                    }`}
                >
                  {!isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center p-8"
                    >
                      <CameraOff className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Awaiting initialization...</p>
                    </motion.div>
                  )}
                  {isScanning && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                  )}
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2rem]">
                    <div className="text-center">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">DECRYPTING...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {!isScanning ? (
                  <Button
                    onClick={startScanner}
                    disabled={!selectedEvent}
                    className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    <Camera className="w-5 h-5 mr-3" />
                    INITIALIZE SENSORS
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanner}
                    variant="destructive"
                    className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                  >
                    <CameraOff className="w-5 h-5 mr-3" />
                    TERMINATE SENSORS
                  </Button>
                )}
              </div>

              <div className="pt-8 border-t border-white/5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-4 ml-1">Manual Signal Override (Check-in Code)</Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter alphanumeric sequence..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualCheckIn()}
                    className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleManualCheckIn}
                    disabled={!manualCode.trim() || isProcessing}
                    className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Log */}
          <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-2 underline-offset-4">Signal Integrity Log</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Latest 10 validated access events</p>
              </div>
            </div>

            <div className="space-y-4">
              {recentCheckIns.length === 0 ? (
                <div className="text-center py-24">
                  <Clock className="w-16 h-16 text-muted-foreground/10 mx-auto mb-6" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">No logs recorded in current session</p>
                </div>
              ) : (
                <div className="space-y-3 pr-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {recentCheckIns.map((checkIn, idx) => (
                    <motion.div
                      key={`${checkIn.id}-${idx}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-green-500/30 transition-all group/log flex items-center gap-5"
                    >
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-lg shadow-green-500/5">
                        <Check className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-base font-black text-foreground tracking-tight truncate">{checkIn.name}</p>
                          <Badge
                            className={`rounded-lg text-[8px] font-black uppercase px-2 py-0 border ${checkIn.type === "member"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-white/5 text-muted-foreground border-white/10"
                              }`}
                          >
                            {checkIn.type === "member" ? "PROTOCOL AGENT" : "EXTERNAL ENTITY"}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-widest">{checkIn.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-green-500 tracking-tight leading-none mb-1">
                          {formatTime(checkIn.checkedInAt)}
                        </p>
                        <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">VALIDATED</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
