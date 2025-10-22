import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/ohman-no-bg.png";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Mail, Lock } from "lucide-react";
import { z } from "zod";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useToast } from "@/hooks/use-toast";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { login, getJWT } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const { toast } = useToast();

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Rate limiting protection
  useEffect(() => {
    if (attemptCount >= 5) {
      const timer = setTimeout(() => {
        setAttemptCount(0);
        setError(null);
      }, 60000); // Reset after 1 minute
      return () => clearTimeout(timer);
    }
  }, [attemptCount]);

  const validateForm = (): boolean => {
    try {
      loginSchema.parse({ email, password });
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === "email") errors.email = error.message;
          if (error.path[0] === "password") errors.password = error.message;
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (attemptCount >= 5) {
      setError("Too many failed attempts. Please wait a minute before trying again.");
      return;
    }

    setError(null);
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password });
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
        variant: "default",
      });
      // Decide landing route based on canonical role from backend
      let userRole: string | null = null;
      try {
        const jwt = await getJWT();
        const res = await fetch('/api/users/me', { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}, credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          userRole = data?.role || null;
        }
      } catch {}
      if (userRole === 'guest') {
        setLocation('/exams');
      } else {
        setLocation('/');
      }
    } catch (err: any) {
      setAttemptCount((prev) => prev + 1);
      const remainingAttempts = 5 - (attemptCount + 1);
      
      if (remainingAttempts > 0) {
        setError(
          `Invalid email or password. ${remainingAttempts} ${
            remainingAttempts === 1 ? "attempt" : "attempts"
          } remaining.`
        );
      } else {
        setError("Too many failed attempts. Please wait a minute before trying again.");
      }
      
      toast({
        title: "Authentication Failed",
        description: err.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isBlocked = attemptCount >= 5;

  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-2xl rounded-2xl border-2 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-col items-center gap-3 pb-4 pt-8">
            {/* Logo */}
            <div className="mb-2 w-16 h-16">
              <img src={logo} alt="OhmanFoundations Logo" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`h-11 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  disabled={isLoading || isBlocked}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs sm:text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                    tabIndex={isLoading ? -1 : 0}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`h-11 pr-12 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLoading || isBlocked}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading || isBlocked}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading || isBlocked}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Remember me
                </Label>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading || isBlocked || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Signup Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-primary hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                    tabIndex={isLoading ? -1 : 0}
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}