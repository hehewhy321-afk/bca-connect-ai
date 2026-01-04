import { useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface EventReminderFormProps {
  eventId: string;
  eventTitle: string;
}

export function EventReminderForm({ eventId, eventTitle }: EventReminderFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-event-reminder", {
        body: {
          event_id: eventId,
          email: email,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      setSubscribed(true);
      toast({
        title: "Reminder set!",
        description: `We'll send you a reminder email before "${eventTitle}" starts.`,
      });
    } catch (error: any) {
      console.error("Error setting reminder:", error);
      toast({
        title: "Failed to set reminder",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <BellRing className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-primary">Reminder Set!</p>
            <p className="text-sm text-muted-foreground">
              We'll email you before the event starts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-4 h-4 text-primary" />
        <Label className="font-medium">Get Event Reminder</Label>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Remind Me"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        We'll send you an email 24 hours before the event.
      </p>
    </form>
  );
}