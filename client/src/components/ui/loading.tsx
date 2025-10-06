import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function Loading({ size = "md", text, className }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div
          className={cn(
            "rounded-full border-4 border-primary/20 border-t-primary animate-spin",
            sizeClasses[size]
          )}
        />
        {/* Inner pulsing dot */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary animate-pulse",
            size === "sm" ? "w-1 h-1" : size === "md" ? "w-2 h-2" : "w-3 h-3"
          )}
        />
      </div>
      {text && (
        <p className={cn(
          "text-muted-foreground font-medium animate-pulse",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

// Dots loading animation (alternative style)
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

// Bars loading animation (alternative style)
export function LoadingBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="w-1 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
      <div className="w-1 h-10 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
      <div className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
      <div className="w-1 h-10 bg-primary rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
      <div className="w-1 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
    </div>
  );
}

// Full page loading overlay
export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg border">
        <Loading size="lg" text={text} />
      </div>
    </div>
  );
}
