import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "member" as "admin" | "moderator" | "member",
  });
  const { toast } = useToast();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.fullName) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "User created",
        description: `${formData.fullName} has been created with ${formData.role} role.`,
      });

      // Reset form
      setFormData({
        email: "",
        password: "",
        fullName: "",
        role: "member",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-foreground underline decoration-primary/30 decoration-4 underline-offset-8 uppercase">
            Create User
          </h1>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateUser}
          className="w-full space-y-8"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Full Name *
              </Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Designate entity..."
                  className="h-11 rounded-md bg-white/5 border-white/10 pl-9 focus:ring-primary/20 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Transmission Port (Email) *
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hq@archive.core"
                  className="h-11 rounded-md bg-white/5 border-white/10 pl-9 focus:ring-primary/20 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Access Cipher (Password) *
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="h-11 rounded-md bg-white/5 border-white/10 pl-9 focus:ring-primary/20 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Privilege Protocol (Role) *
              </Label>
              <div className="relative group">
                <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <select
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "moderator" | "member",
                    })
                  }
                  className="h-11 w-full appearance-none rounded-md border border-white/10 bg-white/5 pl-9 pr-4 text-sm font-bold text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="member" className="bg-background text-foreground">Member</option>
                  <option value="moderator" className="bg-background text-foreground">Moderator</option>
                  <option value="admin" className="bg-background text-foreground">Administrator</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 rounded-md border border-white/5 bg-white/5 p-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                The account is created straight away with the email already confirmed — the
                person can sign in with the password you set here. Ask them to change it
                after their first sign in.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="h-12 px-8 rounded-md border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive font-black text-xs uppercase"
              onClick={() => navigate("/admin/members")}
            >
              ABORT
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-md bg-primary text-primary-foreground font-black text-xs uppercase"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  CREATING...
                </>
              ) : (
                "CREATE USER"
              )}
            </Button>
          </div>
        </motion.form>
      </div>

    </AdminLayout>
  );
}
