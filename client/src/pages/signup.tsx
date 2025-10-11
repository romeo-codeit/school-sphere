import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, User, Mail, Lock, Info } from "lucide-react";
import { z } from "zod";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useToast } from "@/hooks/use-toast";

// Password strength validation
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// Full signup validation schema
const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
});

// Calculate password strength
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
  return Math.min(strength, 100);
};

const getStrengthColor = (strength: number): string => {
  if (strength < 40) return "bg-destructive";
  if (strength < 70) return "bg-yellow-500";
  return "bg-green-500";
};

const getStrengthText = (strength: number): string => {
  if (strength < 40) return "Weak";
  if (strength < 70) return "Medium";
  return "Strong";
};

export default function SignUpPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const { toast } = useToast();

  const passwordRequirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "One lowercase letter", met: /[a-z]/.test(password) },
    { text: "One uppercase letter", met: /[A-Z]/.test(password) },
    { text: "One number", met: /[0-9]/.test(password) },
    { text: "One special character", met: /[^a-zA-Z0-9]/.test(password) },
  ];

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      signupSchema.parse({ name, email, password });
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: { name?: string; email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === "name") errors.name = error.message;
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
    setError(null);
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // All public sign-ups are for students by default
      await register({ email, password, name, role: "student" });

      toast({
        title: "Account Created Successfully!",
        description: "Welcome to OhmanFoundations. Redirecting to your dashboard...",
        variant: "default",
      });

      // Redirect to dashboard after successful registration
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create account. Please try again.";
      setError(errorMessage);

      // Handle specific error cases
      if (errorMessage.includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: "This email is already registered" }));
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-2xl rounded-2xl border-2 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-col items-center gap-3 pb-4 pt-8">
            {/* Logo */}
            <div className="mb-2 w-16 h-16">
              <img src="/src/assets/ohman-no-bg.png" alt="OhmanFoundations Logo" className="w-full h-full object-contain" />
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Join OhmanFoundations to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`h-11 ${fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                {fieldErrors.name && (
                  <p id="name-error" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`h-11 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  disabled={isLoading}
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
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    className={`h-11 pr-12 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? "password-error" : "password-requirements"}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password Strength:</span>
                      <span className={`font-medium ${
                        passwordStrength < 40 ? "text-destructive" :
                        passwordStrength < 70 ? "text-yellow-600" : "text-green-600"
                      }`}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className={`h-2 ${getStrengthColor(passwordStrength)}`} />
                  </div>
                )}

                {/* Password Requirements */}
                {showPasswordRequirements && password && (
                  <Alert className="py-3">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <p className="text-xs font-medium mb-2">Password must contain:</p>
                      <ul id="password-requirements" className="space-y-1 text-xs">
                        {passwordRequirements.map((req, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            {req.met ? (
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                              {req.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {fieldErrors.password && (
                  <p id="password-error" className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.password}
                  </p>
                )}
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
                disabled={isLoading || !name || !email || !password || passwordStrength < 40}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Terms Notice */}
              <p className="text-xs text-center text-muted-foreground px-4">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                    tabIndex={isLoading ? -1 : 0}
                  >
                    Sign In
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