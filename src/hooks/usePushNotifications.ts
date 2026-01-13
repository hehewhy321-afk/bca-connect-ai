import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications and service workers
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);
    
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Register service worker
    if (supported) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('Service Worker registered:', reg);
      setRegistration(reg);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support push notifications.",
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
      console.error("Error requesting notification permission:", error);
      return false;
    }
    return false;
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (permission !== "granted" || !isSupported) {
      console.log('Cannot show notification: permission not granted or not supported');
      return;
    }

    try {
      // Use Service Worker to show notification for better reliability
      if (registration) {
        await registration.showNotification(title, {
          icon: "/pwa-192x192.png",
          badge: "/favicon.png",
          requireInteraction: false,
          ...options,
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: "/pwa-192x192.png",
          badge: "/favicon.png",
          requireInteraction: false,
          ...options,
        });
      }
    } catch (error) {
      console.error("Error showing notification:", error);
      // Fallback to regular notification if service worker fails
      try {
        new Notification(title, {
          icon: "/pwa-192x192.png",
          badge: "/favicon.png",
          requireInteraction: false,
          ...options,
        });
      } catch (fallbackError) {
        console.error("Fallback notification also failed:", fallbackError);
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
