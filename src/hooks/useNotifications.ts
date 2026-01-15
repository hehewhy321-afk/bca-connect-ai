import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "./usePushNotifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { showNotification, permission } = usePushNotifications();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();

    console.log('Setting up notification subscription for user:', user.id);

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New notification received via realtime:', payload);
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setLastNotificationId(newNotification.id);
          
          // Show browser notification if permission granted
          console.log('Permission status:', permission);
          if (permission === "granted") {
            // Use async function to handle the promise
            (async () => {
              try {
                console.log('Attempting to show browser notification:', newNotification);
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
                console.log('✅ Browser notification shown successfully');
              } catch (error) {
                console.error('❌ Error showing browser notification:', error);
              }
            })();
          } else {
            console.warn('⚠️ Cannot show notification - permission not granted. Current permission:', permission);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
          if (updatedNotification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log('Notification channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to notifications channel');
        }
      });

    // Fallback: Poll for new notifications every 10 seconds
    // This ensures notifications work even if realtime fails
    const pollInterval = setInterval(async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const latestNotification = data[0];
          
          // Use a ref to track last notification ID to avoid dependency issues
          setLastNotificationId((prevId) => {
            // Check if this is a new notification we haven't seen
            if (prevId !== latestNotification.id) {
              setNotifications((prev) => {
                const isNewNotification = !prev.some(n => n.id === latestNotification.id);
                
                if (isNewNotification) {
                  console.log('📬 New notification detected via polling:', latestNotification);
                  setUnreadCount((count) => count + 1);
                  
                  // Show browser notification
                  if (permission === "granted") {
                    (async () => {
                      try {
                        await showNotification(latestNotification.title, {
                          body: latestNotification.message,
                          tag: latestNotification.id,
                          requireInteraction: false,
                          vibrate: [200, 100, 200],
                          silent: false,
                          data: {
                            link: latestNotification.link,
                          },
                        });
                        console.log('✅ Browser notification shown via polling');
                      } catch (error) {
                        console.error('❌ Error showing notification via polling:', error);
                      }
                    })();
                  }
                  
                  return [latestNotification, ...prev];
                }
                return prev;
              });
            }
            return latestNotification.id;
          });
        }
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => {
      console.log('Cleaning up notification subscription and polling');
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]); // Removed notifications and lastNotificationId from dependencies

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
