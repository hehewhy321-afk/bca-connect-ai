import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications
    const supported = "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive real-time notifications.",
        });

        // Save preference to database
        if (user) {
          await supabase
            .from("profiles")
            .update({ push_notifications_enabled: true } as any)
            .eq("user_id", user.id);
        }

        return true;
      } else if (result === "denied") {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error requesting notification permission:", error);
      }
      return false;
    }
    return false;
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (permission !== "granted" || !isSupported) {
      return;
    }

    try {
      // Use regular notification
      new Notification(title, {
        icon: "/favicon.png",
        badge: "/favicon.png",
        requireInteraction: false,
        ...options,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error showing notification:", error);
      }
    }
  };

  const disableNotifications = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ push_notifications_enabled: false } as any)
        .eq("user_id", user.id);

      toast({
        title: "Notifications Disabled",
        description: "You won't receive browser notifications anymore.",
      });
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    disableNotifications,
  };
}
