import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function BanCheck({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Call the check_user_ban_status RPC function
        const { data: banStatus, error } = await supabase
          .rpc('check_user_ban_status', { user_id_param: user.id });

        if (error) {
          console.error('Error checking ban status:', error);
          setChecking(false);
          return;
        }

        if (banStatus && banStatus.length > 0) {
          const status = banStatus[0];
          
          if (status.is_banned) {
            toast({
              title: "Account Banned",
              description: "Your account has been banned. Please contact administration for more information.",
              variant: "destructive",
              duration: 10000,
            });

            await signOut();
            navigate('/auth');
            return;
          }
        }

        setChecking(false);
      } catch (err) {
        console.error('Error in ban check:', err);
        setChecking(false);
      }
    };

    checkBanStatus();

    // Set up a periodic check every 30 seconds
    const interval = setInterval(checkBanStatus, 30000);

    return () => clearInterval(interval);
  }, [user, signOut, navigate, toast]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
