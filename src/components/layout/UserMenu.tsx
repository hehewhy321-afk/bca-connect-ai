import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isAdmin, isModerator } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setAvatarUrl(data?.avatar_url ?? null);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!user) return null;

  const fullName = user.user_metadata?.full_name || "Member";
  const initials = fullName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "See you soon." });
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Avatar className="h-11 w-11 border border-border">
          <AvatarImage src={avatarUrl || undefined} alt="" />
          <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background">
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
        </span>
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 rounded-lg">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        {(isAdmin || isModerator) && (
          <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2">
            <Shield className="h-4 w-4 text-primary" aria-hidden />
            Admin dashboard
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer gap-2">
          <LayoutDashboard className="h-4 w-4 text-primary" aria-hidden />
          User dashboard
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
