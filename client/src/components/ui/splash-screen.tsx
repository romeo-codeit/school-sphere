import { useEffect, useState } from "react";
import logoImage from "@/assets/ohman-no-bg.png";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Minimum display time of 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 animate-fade-in">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow-delay"></div>
      </div>

      {/* Logo container with pulse animation */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          {/* Outer glow rings */}
          <div className="absolute inset-0 -m-8 rounded-full bg-primary/20 animate-ping-slow"></div>
          <div className="absolute inset-0 -m-4 rounded-full bg-primary/30 animate-ping-slow-delay"></div>
          
          {/* Logo */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 animate-pulse-logo">
            <img 
              src={logoImage} 
              alt="OhmanFoundations Logo" 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground animate-fade-in-up">
            OhmanFoundations
          </h1>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce-dot"></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce-dot-delay-1"></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce-dot-delay-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
