import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, UserPlus } from "lucide-react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { Navbar } from "@/components/layout/Navbar";
import logoImg from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute records where it bounced the user from.
  const redirectTo =
    (location.state as { from?: string } | null)?.from || "/dashboard";
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const { data: settings } = useWebsiteSettings();
  const signupEnabled = settings?.signup_enabled !== "false";

  const validateForm = () => {
    try {
      if (isSignUp) {
        signUpSchema.parse(formData);
      } else {
        signInSchema.parse({ email: formData.email, password: formData.password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome to BCA Association!",
            description: "Your account has been created successfully.",
          });
          navigate(redirectTo, { replace: true });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message || "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have signed in successfully.",
          });
          navigate(redirectTo, { replace: true });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-6 pb-16 pt-28 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex overflow-hidden rounded-lg border border-border bg-card lg:min-h-[580px]"
        >
          {/* Left: artwork */}
          <div className="relative hidden w-1/2 shrink-0 lg:block">
            <img
              src="/1.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-10">
              <p className="font-heading text-2xl font-bold leading-snug text-white">
                Everything the association runs, in one place.
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
                Events, the study library, certificates and the community — sign in to pick up
                where you left off.
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2">
            <div className="mx-auto w-full max-w-[380px]">
          {/* Logo */}
              <div className="mb-6 flex flex-col items-center gap-3">
                <img
                  src={logoImg}
                  alt=""
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
                <div className="text-center">
                  <p className="font-heading text-sm font-bold text-foreground">BCA Association</p>
                  <p className="text-xs text-muted-foreground">MMAMC Nepal</p>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-center font-heading text-xl font-bold text-foreground">
                {isSignUp ? "Create your account" : "Sign in"}
              </h1>
              <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
                {isSignUp
                  ? "Use your college email so we can verify you"
                  : "Enter your email and password to continue"}
              </p>

              {/* Form or Contact Admin Message */}
              {isSignUp && !signupEnabled ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    Registration Restricted
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    New user registration is currently managed by the administration. Please contact the admin team to request an account.
                  </p>
                  <Link to="/contact">
                    <Button variant="outline" className="mt-2">
                      Contact Administration
                    </Button>
                  </Link>
                </div>
              ) : showForgotPassword ? (
                <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          className="h-10 rounded-md pl-9"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="h-10 rounded-md pl-9"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="h-10 rounded-md pl-9 pr-10"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-10 w-full rounded-md font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
                  </Button>
                </form>
              )}

              {/* Toggle */}
              <div className="mt-6 border-t border-border pt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrors({});
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    {isSignUp ? "Sign in" : "Create one"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
