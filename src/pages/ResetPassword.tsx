import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tokenError, setTokenError] = useState(false);

  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has a valid session (came from reset link)
    // Supabase automatically handles the token from the URL hash
    const checkSession = async () => {
      // Give Supabase a moment to process the URL hash
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!session) {
        setTokenError(true);
      }
    };
    
    checkSession();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate passwords
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Password updated",
          description: "Your password has been successfully reset.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent/80 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-card rounded-3xl shadow-2xl p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Invalid or Expired Link
              </h2>
              <p className="text-muted-foreground text-sm">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/auth">
                <Button className="mt-4">Back to Sign In</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent/80 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-card rounded-3xl shadow-2xl p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Password Reset Successful
              </h2>
              <p className="text-muted-foreground text-sm">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent/80 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hero-pattern opacity-20" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <div className="bg-card rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src={logoImg} alt="BCA Association Logo" className="w-12 h-12 rounded-xl object-cover" />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-foreground">
                BCA Association
              </span>
              <span className="text-xs text-muted-foreground">MMAMC Nepal</span>
            </div>
          </div>

          <h1 className="font-heading text-2xl font-bold text-center text-foreground mb-2">
            Reset Password
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
