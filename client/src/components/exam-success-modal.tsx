import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Brain,
  Target,
  Heart,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Calendar,
  Award,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { examTips as examTipsRaw } from './exam-success-tips-content';

interface ExamSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExamSuccessModal({ open, onOpenChange }: ExamSuccessModalProps) {
  // Map icons and colors to each tip by index
  const tipIcons = [
    BookOpen, // 1. Preparation
    Target,   // 2. Syllabus
    AlertCircle, // 3. Exam Format
    Heart,    // 4. Anxiety
    TrendingUp, // 5. Self-Confidence
    Brain,    // 6. Weak Areas
    Zap,      // 7. CBT
    Clock,    // 8. Time Management
    Lightbulb, // 9. Exam Strategy
    Calendar, // 10. Exam Conditions
    Heart,    // 11. Rest & Health
    Award,    // 12. Motivation
  ];
  const tipColors = [
    { color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { color: "text-rose-500", bgColor: "bg-rose-500/10" },
    { color: "text-green-500", bgColor: "bg-green-500/10" },
    { color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    { color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
    { color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { color: "text-teal-500", bgColor: "bg-teal-500/10" },
    { color: "text-pink-500", bgColor: "bg-pink-500/10" },
    { color: "text-violet-500", bgColor: "bg-violet-500/10" },
  ];
  const examTips = examTipsRaw.map((tip, i) => ({
    title: tip.title,
    description: tip.description,
    icon: tipIcons[i],
    color: tipColors[i].color,
    bgColor: tipColors[i].bgColor,
  }));

  const [scrollProgress, setScrollProgress] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setScrollProgress(0);
      setCanClose(false);
    }
  }, [open]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    setScrollProgress(Math.min(progress, 100));
    if (progress >= 90 && !canClose) {
      setCanClose(true);
    }
  };

  const handleClose = () => {
    if (canClose) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent
        className="max-w-5xl h-[90vh] p-0 gap-0 w-[95vw] sm:w-[90vw] flex flex-col overflow-hidden"
        onPointerDownOutside={e => { if (!canClose) e.preventDefault(); }}
        onEscapeKeyDown={e => { if (!canClose) e.preventDefault(); }}
      >
        {/* Header */}
        <div className="flex-none bg-background/95 backdrop-blur-xl border-b px-4 sm:px-6 py-3 sm:py-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight">
                  12 Proven Strategies for Exam Success
                </DialogTitle>
                <DialogDescription className="mt-1 sm:mt-2 text-sm sm:text-base">
                  Essential tips to help you excel in JAMB, WAEC, and other major examinations
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="shrink-0 self-start">
                <BookOpen className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Study Guide</span>
                <span className="sm:hidden">Guide</span>
              </Badge>
            </div>
          </DialogHeader>
          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Scroll to read all tips</span>
              <span className="font-medium">{Math.round(scrollProgress)}%</span>
            </div>
            <Progress value={scrollProgress} className="h-1.5" />
            {!canClose && scrollProgress > 0 && (
              <p className="text-xs text-muted-foreground animate-pulse">
                Keep scrolling to unlock the close button...
              </p>
            )}
          </div>
        </div>
        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 modern-scrollbar"
          onScroll={handleScroll}
          ref={scrollAreaRef as any}
        >
          <div className="space-y-4 sm:space-y-6">
            {/* Introduction */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Why This Matters
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Many students fail exams not due to lack of intelligence, but because of inadequate preparation,
                poor exam strategies, and preventable mistakes. These 12 strategies address the most common pitfalls
                and give you a proven framework for success. Aim for scores above 200 in JAMB to secure admission
                into competitive programs like Medicine, Law, or Engineering.
              </p>
            </div>
            {/* Tips Grid */}
            <div className="grid gap-3 sm:gap-4">
              {examTips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-3 sm:p-5 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex gap-3 sm:gap-4 flex-col xs:flex-row">
                      <div className={cn(
                        "shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 self-start",
                        tip.bgColor
                      )}>
                        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", tip.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2 flex-wrap">
                          <h4 className="font-semibold text-sm sm:text-base leading-tight">
                            {index + 1}. {tip.title}
                          </h4>
                          <Badge variant="outline" className="shrink-0 text-xs h-5">
                            Tip {index + 1}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Call to Action */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg p-4 sm:p-6 text-center">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-2 sm:mb-3" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Ready to Excel?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 max-w-2xl mx-auto">
                Apply these strategies consistently in your preparation. Start with a study plan, practice regularly
                with past questions, and maintain a positive mindset. Success in exams is achievable with the right approach!
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-center">From OhmanFoundations - Empowering Student Success</span>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="flex-none bg-background/95 backdrop-blur-xl border-t px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="text-xs text-muted-foreground">
              {canClose ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden xs:inline">You've read all the tips!</span>
                  <span className="xs:hidden">All done!</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="hidden xs:inline">Scroll to the end to close</span>
                  <span className="xs:hidden">Keep scrolling...</span>
                </span>
              )}
            </div>
            <Button
              onClick={handleClose}
              disabled={!canClose}
              size="sm"
              className={cn(
                "transition-all text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4",
                canClose && "bg-primary hover:bg-primary/90"
              )}
            >
              <span className="hidden xs:inline">{canClose ? "Got it, Thanks!" : "Keep Reading..."}</span>
              <span className="xs:hidden">{canClose ? "Done!" : "Reading..."}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
