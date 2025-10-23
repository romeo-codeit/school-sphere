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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdmissionTipsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sections = [
  { id: "pre-utme", title: "Pre-UTME" },
  { id: "on-utme", title: "On-UTME" },
  { id: "post-exam", title: "Post-Exam" },
  { id: "without-utme", title: "Without UTME" },
  { id: "abroad", title: "Study Abroad" },
];

export function AdmissionTipsModal({ open, onOpenChange }: AdmissionTipsModalProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [activeSection, setActiveSection] = useState("pre-utme");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setScrollProgress(0);
      setCanClose(false);
      setActiveSection("pre-utme");
    }
  }, [open]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    setScrollProgress(Math.min(progress, 100));
    if (progress >= 95 && !canClose) {
      setCanClose(true);
    }

    // Update active section
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const offset = window.innerHeight / 3;
        if (rect.top <= offset && rect.bottom > offset) {
          setActiveSection(section.id);
        }
      }
    });
  };

  const handleClose = () => {
    if (canClose) {
      onOpenChange(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && scrollAreaRef.current) {
      const offsetTop = element.offsetTop - 100;
      scrollAreaRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
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
              <span>Scroll to read complete guide</span>
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

        {/* Content with floating side navigation */}
        <div className="relative flex-1">
          <div 
            className="h-full overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 modern-scrollbar"
            onScroll={handleScroll}
            ref={scrollAreaRef as any}
          >
            <div className="space-y-8 sm:space-y-12 max-w-4xl">
              {/* Pre-UTME Section */}
              <div id="pre-utme" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Pre-UTME Preparation
                </h2>
                <div className="space-y-4">
                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Correct O'level Result</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Achieving success in your WAEC or NECO examinations is imperative for gaining admission to Nigerian universities. 
                          Every institution mandates a minimum of five (5) credits in relevant subjects. For example, to pursue Radiography, 
                          you must secure credit passes in Mathematics, English Language, Biology, Chemistry, and Physics.
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
                          You are permitted to combine two O'level results for admission purposes. However, for prestigious courses such as 
                          Medicine and Surgery, the combination of O'level results is prohibited.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Select a Course that Resonates with Your Passion</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Possess a genuine passion for the course you wish to pursue in higher education. Passion is the driving force 
                          that propels you to excel and attain success. Avoid conforming to the crowd; dedicate time to self-discovery. 
                          Pursuing a course that does not align with your passion may lead to frustration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Pay Attention to Your Academic Prowess</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Having a passion for a course is one thing; meeting the academic criteria for the program is another. 
                          To study Law, for instance, you must attain a high score that surpasses the cut-off mark. Not every student 
                          can achieve the required cut-off score. You may need to compromise and settle for something adjacent to your 
                          dream course.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-rose-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Identify Your Academic Strengths and Weaknesses</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Recognizing your academic strengths and weaknesses will significantly enhance your chances of securing admission. 
                          Do not shy away from your weaknesses; identify subjects in which you excel and pursue a course that encompasses 
                          those subjects.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Choose the Appropriate University</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Selecting the right university is paramount to your admission success. Consider factors such as ELDA, 
                          ADMISSION BY MERIT, and CATCHMENT AREA, as they play crucial roles in the admission process.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* On-UTME Section */}
              <div id="on-utme" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  On-UTME Day
                </h2>
                <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base mb-3">Prepare, Excel, and Achieve a High Score in JAMB</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                        Thorough preparation and successful completion of your JAMB examination is the pathway to gaining admission in Nigeria. 
                        The fundamental principle is straightforward: the higher your JAMB score, the greater your chances of securing admission.
                      </p>
                      
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-sm">Strategies for Success:</h4>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Allot time for each question</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Begin with subjects you find most familiar</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Maintain a healthy mental and emotional state</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Adhere to examination protocols</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post-Exam Section */}
              <div id="post-exam" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  Post-Exam Actions
                </h2>
                <div className="space-y-4">
                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Examine Your Course Competitors</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Investigate the number of candidates who selected your intended course at your chosen institution and their score ranges. 
                          JAMB typically allows CBT centers to provide UTME statistics to gauge how many candidates are vying for the same admission slot.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Link Your Email to JAMB CAPS</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Linking your email keeps you connected to the board. By linking your email to JAMB, you can access your JAMB Portal 
                          via your smartphone. Visit any JAMB office or nearby CBT center to complete this process.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-amber-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Upload Your O'level Results</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Ensure that you have uploaded your O'level results to the board, as this is a prerequisite for gaining admission. 
                          Verify this through your phone after the upload.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-teal-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Apply for Post-UTME</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          In some institutions, it is mandatory to submit an official application via the school's website regarding post-UTME. 
                          Register for post-UTME and consistently monitor your CAPS at https://efacility.jamb.gov.ng/Login to track your admission progress.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-5">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Create a JAMB Profile
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Your JAMB Profile serves as a comprehensive account of all your information. This profile is your primary point of contact 
                      with JAMB for accepting/rejecting admission offers, checking admission status, and printing JAMB original results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Without UTME Section */}
              <div id="without-utme" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  Admission Without UTME
                </h2>
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    While the UTME (JAMB) examination is the most prevalent method for securing university admission, 
                    it is by no means the only avenue available. You can gain admission through the following alternatives:
                  </p>

                  <div className="group relative bg-card border-2 border-primary/30 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-pink-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">IJMB (Interim Joint Matriculation Board)</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                          IJMB facilitates students in securing direct admission into the second year (200 level) in various universities 
                          within Nigeria and abroad. The program mirrors JUPEB, and successful candidates can gain entry into the second year.
                        </p>
                        <div className="bg-primary/5 p-3 sm:p-4 rounded space-y-2">
                          <p className="font-semibold text-xs sm:text-sm">Highlights:</p>
                          <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>Secures 2nd year direct entry admission without JAMB-UTME</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>Recognized by universities for 200-level direct entry admission</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>Duration: 12 months (1 year)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>Coordinated by ABU, Zaria since 1974</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-violet-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">JUPEB</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Joint Universities Preliminary Examinations Board - Similar to IJMB, provides direct entry to 200 level 
                          in participating universities.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Pre-Degree/Pre-Science Programs</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          A pre-degree program offers a viable pathway to university admission, often referred to as a remedial program. 
                          This program typically spans one academic session (one year), during which students are instructed in fundamental subjects.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-2">Nursing Entrance Examination</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Specialized entrance exam for nursing programs at various institutions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Abroad Section */}
              <div id="abroad" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  Study Abroad Opportunities
                </h2>
                <div className="group relative bg-card border border-border hover:border-primary/50 rounded-lg p-4 sm:p-5 transition-all duration-300 hover:shadow-lg">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                        Exploring international education opportunities can open doors to world-class universities and diverse learning experiences.
                      </p>
                      
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Key Considerations:
                        </h4>
                        <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Research scholarship opportunities</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Check admission requirements for international students</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Prepare required standardized tests (SAT, TOEFL, IELTS)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Consider cost of living and tuition fees</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Explore student visa requirements</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
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

          {/* Floating Side Navigation */}
          <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <div className="bg-background/95 backdrop-blur-xl border rounded-2xl shadow-2xl p-2">
              <div className="flex flex-col gap-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 text-left whitespace-nowrap",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "hover:bg-muted text-muted-foreground hover:scale-105"
                    )}
                    title={section.title}
                  >
                    {section.title}
                  </button>
                ))}
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
                  <span className="hidden xs:inline">You've read the complete guide!</span>
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
