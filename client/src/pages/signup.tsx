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

export default function SignupPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [registerAsGuest, setRegisterAsGuest] = useState(() => {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('guest') === '1';
    } catch {
      return false;
    }
  });

  const passwordStrength = calculatePasswordStrength(password);

  // Redirect if already logged in
  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const validateForm = () => {
    try {
      signupSchema.parse({ name, email, password });
      return true;
    } catch (error: any) {
      const errors: { [key: string]: string } = {};
      error.errors.forEach((err: any) => {
        if (error.path[0] === "name") errors.name = error.message;
        if (error.path[0] === "email") errors.email = error.message;
        if (error.path[0] === "password") errors.password = error.message;
      });
      setFieldErrors(errors);
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
      // Use the new registration endpoint that creates user profiles with pending status
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role: registerAsGuest ? 'guest' : 'student' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      if (registerAsGuest) {
        toast({
          title: "Guest Account Created",
          description: "You can now sign in. Subscription is required to access practice exams.",
          variant: "default",
        });
      } else {
        toast({
          title: "Account Created Successfully!",
          description: "Your account is pending admin approval. Please sign in to check your status.",
          variant: "default",
        });
      }

      // Redirect to login page after successful registration
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
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

      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Join OhmanFoundations to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
              <div className="mb-4 p-3 rounded-md bg-muted/40 text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={registerAsGuest} onChange={(e) => setRegisterAsGuest(e.target.checked)} />
                  <span>Register as Guest (limited access; subscription required for practice exams)</span>
                </label>
              </div>
            {/* Registration Form */}
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
                    placeholder="Emeka Chukwu"
                    required
                    autoComplete="name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
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
                    placeholder="emeka@email.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
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
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength</span>
                        <span className={`font-medium ${
                          passwordStrength < 40 ? "text-destructive" :
                          passwordStrength < 70 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {passwordStrength < 40 ? "Weak" :
                           passwordStrength < 70 ? "Medium" : "Strong"}
                        </span>
                      </div>
                      <Progress value={passwordStrength} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>

                {/* Terms and Login Links */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:underline font-semibold"
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