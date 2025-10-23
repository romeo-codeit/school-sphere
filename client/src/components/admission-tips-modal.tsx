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
  GraduationCap,
  CheckCircle,
  Target,
  Award,
  BookOpen,
  AlertCircle,
  Lightbulb,
  Brain,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  FileText,
  Mail,
  Upload,
  Plane,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdmissionTipsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// All admission tips with icons and colors matching exam tips style
const admissionTips = [
  {
    title: "Correct O'level Result",
    description: "Achieving success in your WAEC or NECO examinations is imperative for gaining admission to Nigerian universities. Every institution mandates a minimum of five (5) credits in relevant subjects. For example, to pursue Radiography, you must secure credit passes in Mathematics, English Language, Biology, Chemistry, and Physics. You are permitted to combine two O'level results for admission purposes. However, for prestigious courses such as Medicine and Surgery, the combination of O'level results is prohibited.",
    icon: CheckCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Select a Course that Resonates with Your Passion",
    description: "Possess a genuine passion for the course you wish to pursue in higher education. Passion is the driving force that propels you to excel and attain success. Avoid conforming to the crowd; dedicate time to self-discovery. Pursuing a course that does not align with your passion may lead to frustration.",
    icon: Target,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Pay Attention to Your Academic Prowess",
    description: "Having a passion for a course is one thing; meeting the academic criteria for the program is another. To study Law, for instance, you must attain a high score that surpasses the cut-off mark. Not every student can achieve the required cut-off score. You may need to compromise and settle for something adjacent to your dream course.",
    icon: Brain,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Identify Your Academic Strengths and Weaknesses",
    description: "Recognizing your academic strengths and weaknesses will significantly enhance your chances of securing admission. Do not shy away from your weaknesses; identify subjects in which you excel and pursue a course that encompasses those subjects.",
    icon: TrendingUp,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    title: "Choose the Appropriate University",
    description: "Selecting the right university is paramount to your admission success. Consider factors such as ELDA, ADMISSION BY MERIT, and CATCHMENT AREA, as they play crucial roles in the admission process.",
    icon: MapPin,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Prepare, Excel, and Achieve a High Score in JAMB",
    description: "Thorough preparation and successful completion of your JAMB examination is the pathway to gaining admission in Nigeria. The fundamental principle is straightforward: the higher your JAMB score, the greater your chances of securing admission. Allot time for each question, begin with subjects you find most familiar, maintain a healthy mental and emotional state, and adhere to examination protocols.",
    icon: Award,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    title: "Examine Your Course Competitors",
    description: "Investigate the number of candidates who selected your intended course at your chosen institution and their score ranges. JAMB typically allows CBT centers to provide UTME statistics to gauge how many candidates are vying for the same admission slot.",
    icon: Users,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    title: "Link Your Email to JAMB CAPS",
    description: "Linking your email keeps you connected to the board. By linking your email to JAMB, you can access your JAMB Portal via your smartphone. Visit any JAMB office or nearby CBT center to complete this process.",
    icon: Mail,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "Upload Your O'level Results",
    description: "Ensure that you have uploaded your O'level results to the board, as this is a prerequisite for gaining admission. Verify this through your phone after the upload.",
    icon: Upload,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Apply for Post-UTME",
    description: "In some institutions, it is mandatory to submit an official application via the school's website regarding post-UTME. Register for post-UTME and consistently monitor your CAPS at https://efacility.jamb.gov.ng/Login to track your admission progress.",
    icon: FileText,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    title: "Create a JAMB Profile",
    description: "Your JAMB Profile serves as a comprehensive account of all your information. This profile is your primary point of contact with JAMB for accepting/rejecting admission offers, checking admission status, and printing JAMB original results.",
    icon: Calendar,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    title: "IJMB (Interim Joint Matriculation Board)",
    description: "IJMB facilitates students in securing direct admission into the second year (200 level) in various universities within Nigeria and abroad. The program mirrors JUPEB, and successful candidates can gain entry into the second year. Secures 2nd year direct entry admission without JAMB-UTME, recognized by universities for 200-level direct entry admission, duration is 12 months (1 year), coordinated by ABU, Zaria since 1974.",
    icon: GraduationCap,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "JUPEB & Pre-Degree Programs",
    description: "Joint Universities Preliminary Examinations Board (JUPEB) - Similar to IJMB, provides direct entry to 200 level in participating universities. Pre-degree programs offer a viable pathway to university admission, often referred to as remedial programs. This program typically spans one academic session (one year), during which students are instructed in fundamental subjects.",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
  {
    title: "Study Abroad Opportunities",
    description: "Exploring international education opportunities can open doors to world-class universities and diverse learning experiences. Research scholarship opportunities, check admission requirements for international students, prepare required standardized tests (SAT, TOEFL, IELTS), consider cost of living and tuition fees, and explore student visa requirements.",
    icon: Plane,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export function AdmissionTipsModal({ open, onOpenChange }: AdmissionTipsModalProps) {
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
                  Guarantee University Admission
                </DialogTitle>
                <DialogDescription className="mt-1 sm:mt-2 text-sm sm:text-base">
                  A Comprehensive Guide by NWAMARIFE PATRICK (OHMAN)
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="shrink-0 self-start">
                <GraduationCap className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Admission Guide</span>
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
                Gaining admission to a Nigerian university requires strategic planning and proper execution. 
                These 14 essential tips cover everything from O'level preparation to alternative admission pathways 
                like IJMB and study abroad opportunities. Follow these guidelines to maximize your chances of securing 
                admission into your dream institution and program.
              </p>
            </div>

            {/* Tips Grid */}
            <div className="grid gap-3 sm:gap-4">
              {admissionTips.map((tip, index) => {
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
              <h3 className="text-base sm:text-lg font-semibold mb-2">Ready for University Success?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 max-w-2xl mx-auto">
                Apply these strategies consistently in your admission journey. Start early, stay informed about deadlines,
                and maintain a positive mindset. Your university admission is achievable with the right preparation!
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-center">By NWAMARIFE PATRICK (OHMAN) - Ohman Creative Foundation</span>
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
