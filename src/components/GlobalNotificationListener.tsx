import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Global notification listener that works across all pages
 * This ensures notifications are received even when NotificationsDropdown isn't rendered
 */
export function GlobalNotificationListener() {
  const { user } = useAuth();
  const { showNotification, permission } = usePushNotifications();

  useEffect(() => {
    if (!user) {
      console.log('GlobalNotificationListener: No user, skipping setup');
      return;
    }

    console.log('🌍 GlobalNotificationListener: Setting up for user:', user.id);
    console.log('🌍 Current permission:', permission);

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("global-notifications-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🌍🔔 GlobalNotificationListener: New notification received!', payload);
          const newNotification = payload.new as Notification;
          
          // Show browser notification if permission granted
          if (permission === "granted") {
            try {
              console.log('🌍 Showing browser notification...');
              await showNotification(newNotification.title, {
                body: newNotification.message,
                tag: newNotification.id,
                requireInteraction: false,
                vibrate: [200, 100, 200],
                silent: false,
                data: {
                  link: newNotification.link,
                },
              });
              console.log('🌍✅ Browser notification shown successfully!');
            } catch (error) {
              console.error('🌍❌ Error showing browser notification:', error);
            }
          } else {
            console.warn('🌍⚠️ Cannot show notification - permission:', permission);
          }
        }
      )
      .subscribe((status) => {
        console.log('🌍 GlobalNotificationListener subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('🌍✅ Successfully subscribed to global notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('🌍❌ Error subscribing to global notifications');
        }
      });

    return () => {
      console.log('🌍 GlobalNotificationListener: Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  // This component doesn't render anything
  return null;
}
