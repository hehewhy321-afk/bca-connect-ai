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
    // Mobile browsers require HTTPS for notifications
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';
    const hasNotificationAPI = "Notification" in window;
    const hasServiceWorker = "serviceWorker" in navigator;
    
    const supported = hasNotificationAPI && hasServiceWorker && isSecureContext;
    
    console.log('Notification Support Check:', {
      hasNotificationAPI,
      hasServiceWorker,
      isSecureContext,
      protocol: window.location.protocol,
      supported
    });
    
    setIsSupported(supported);
    
    if (hasNotificationAPI) {
      setPermission(Notification.permission);
      
      // Poll permission status every 2 seconds to catch changes
      const permissionCheckInterval = setInterval(() => {
        if (Notification.permission !== permission) {
          console.log('Permission changed:', Notification.permission);
          setPermission(Notification.permission);
        }
      }, 2000);
      
      return () => clearInterval(permissionCheckInterval);
    }

    // Register service worker only if supported
    if (supported) {
      registerServiceWorker();
    } else if (!isSecureContext) {
      console.warn('Notifications require HTTPS. Current protocol:', window.location.protocol);
    }
  }, [permission]);

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
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';
      
      if (!isSecureContext) {
        toast({
          title: "HTTPS Required",
          description: "Notifications require a secure connection (HTTPS). Please access the site via HTTPS.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Not Supported",
          description: "Your browser doesn't support push notifications.",
          variant: "destructive",
        });
      }
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
      const notificationOptions: NotificationOptions = {
        icon: "/pwa-192x192.png",
        badge: "/favicon.png",
        vibrate: [200, 100, 200], // Vibration pattern
        requireInteraction: false,
        silent: false, // Enable sound
        ...options,
      };

      // Use Service Worker to show notification for better reliability
      if (registration && registration.active) {
        console.log('Showing notification via Service Worker');
        await registration.showNotification(title, notificationOptions);
      } else {
        // Fallback to regular notification
        console.log('Showing notification via Notification API');
        const notification = new Notification(title, notificationOptions);
        
        // Add click handler for fallback notification
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (options?.data?.link) {
            window.location.href = options.data.link;
          }
          notification.close();
        };
      }
    } catch (error) {
      console.error("Error showing notification:", error);
      // Fallback to regular notification if service worker fails
      try {
        const notification = new Notification(title, {
          icon: "/pwa-192x192.png",
          badge: "/favicon.png",
          vibrate: [200, 100, 200],
          requireInteraction: false,
          silent: false,
          ...options,
        });
        
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          if (options?.data?.link) {
            window.location.href = options.data.link;
          }
          notification.close();
        };
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
