import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator" | "member";

// The layouts that call this hook are rendered inside each page, so they
// remount on every navigation. Without a cache that means a fresh
// `loading: true` and another round trip to user_roles per route change —
// the layout flashes its loading state and reads as a full page reload.
const roleCache = new Map<string, AppRole>();

export function useUserRole() {
  const { user } = useAuth();
  const cached = user ? roleCache.get(user.id) : null;
  const [role, setRole] = useState<AppRole | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const known = roleCache.get(user.id);
    if (known) {
      setRole(known);
      setLoading(false);
    }

    let active = true;

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        const resolved = (data?.role as AppRole) || "member";
        roleCache.set(user.id, resolved);
        if (active) setRole(resolved);
      } catch (error) {
        console.error("Error fetching user role:", error);
        if (active && !known) setRole("member");
      } finally {
        if (active) setLoading(false);
      }
    };

    // A cached role renders immediately; this call just revalidates it.
    fetchRole();

    return () => {
      active = false;
    };
  }, [user]);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || role === "admin";

  return { role, isAdmin, isModerator, loading };
}
