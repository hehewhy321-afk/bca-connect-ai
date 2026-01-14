import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Check if user is banned whenever auth state changes
          try {
            const { data: banStatus } = await supabase
              .rpc('check_user_ban_status', { user_id_param: session.user.id });

            if (banStatus && banStatus.length > 0 && banStatus[0].is_banned) {
              // User is banned, sign them out
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }
          } catch (err) {
            // If check fails, allow login (fail open for safety)
            console.error('Error checking ban status:', err);
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Check if user is banned on initial load
        try {
          const { data: banStatus } = await supabase
            .rpc('check_user_ban_status', { user_id_param: session.user.id });

          if (banStatus && banStatus.length > 0 && banStatus[0].is_banned) {
            // User is banned, sign them out
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (err) {
          // If check fails, allow login (fail open for safety)
          console.error('Error checking ban status:', err);
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { 
          error: new Error('Invalid email or password. Please try again.') 
        };
      }

      // Check if user is banned after successful authentication
      if (data.user) {
        try {
          const { data: banStatus, error: banCheckError } = await supabase
            .rpc('check_user_ban_status', { user_id_param: data.user.id });

          if (banCheckError) {
            // If ban check fails, allow login (fail open for safety)
            return { error: null };
          }

          if (banStatus && banStatus.length > 0) {
            const status = banStatus[0];
            
            if (status.is_banned) {
              // Sign out the user immediately
              await supabase.auth.signOut();
              
              return { 
                error: new Error('Your account has been banned. Please contact administration for more information.') 
              };
            }
          }
        } catch (banCheckErr) {
          // If ban check fails, allow login (fail open for safety)
          console.error('Error checking ban status:', banCheckErr);
        }
      }
      
      return { error: null };
    } catch (err) {
      return { 
        error: new Error('Sign in failed. Invalid email or password. Please try again.') 
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
