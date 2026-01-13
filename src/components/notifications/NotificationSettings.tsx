import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function NotificationSettings() {
  const { permission, isSupported, requestPermission, disableNotifications } = usePushNotifications();
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    forum_replies: true,
    new_certificates: true,
    event_updates: true,
    announcements: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const savePreferences = async (newPreferences: typeof preferences) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: newPreferences })
        .eq("user_id", user.id);

      if (error) throw error;

      setPreferences(newPreferences);
      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPreferences);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground mb-2">Notification Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage how you receive notifications and updates
        </p>
      </div>

      {/* Browser Notifications */}
      <Card className="p-6 glass border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Browser Notifications</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get real-time notifications even when the website is closed
            </p>
            
            {!isSupported && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  Your browser doesn't support push notifications
                </p>
              </div>
            )}

            {isSupported && (
              <div className="flex items-center gap-3">
                {permission === "default" && (
                  <Button
                    onClick={requestPermission}
                    className="gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Enable Notifications
                  </Button>
                )}
                
                {permission === "granted" && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Enabled</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={disableNotifications}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <BellOff className="w-4 h-4 mr-2" />
                      Disable
                    </Button>
                  </div>
                )}
                
                {permission === "denied" && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">
                      Notifications are blocked. Please enable them in your browser settings.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6 glass border-white/10">
        <h3 className="font-bold text-foreground mb-4">Notification Types</h3>
        <div className="space-y-4">
          {[
            {
              key: "forum_replies" as const,
              title: "Forum Replies",
              description: "Get notified when someone replies to your forum posts",
            },
            {
              key: "new_certificates" as const,
              title: "New Certificates",
              description: "Receive notifications when you earn new certificates",
            },
            {
              key: "event_updates" as const,
              title: "Event Updates",
              description: "Stay updated about events you're registered for",
            },
            {
              key: "announcements" as const,
              title: "Announcements",
              description: "Get important announcements from admins",
            },
          ].map((item) => (
            <motion.div
              key={item.key}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <button
                onClick={() => togglePreference(item.key)}
                disabled={loading}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences[item.key] ? "bg-primary" : "bg-muted"
                }`}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
                  animate={{
                    x: preferences[item.key] ? 24 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
