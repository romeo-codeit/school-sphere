import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, BookOpen, Award, Target, CheckCircle, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AdmissionTipsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sections = [
  { id: "pre-utme", title: "Pre-UTME", icon: Target },
  { id: "on-utme", title: "On-UTME", icon: Award },
  { id: "post-exam", title: "Post-Exam", icon: CheckCircle },
  { id: "without-utme", title: "Without UTME", icon: BookOpen },
  { id: "abroad", title: "Study Abroad", icon: GraduationCap },
];

export function AdmissionTipsModal({ open, onOpenChange }: AdmissionTipsModalProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("pre-utme");
  const [canClose, setCanClose] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
      
      // Enable close button when scrolled to bottom
      if (progress >= 95) {
        setCanClose(true);
      }

      // Update active section based on scroll position
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= clientHeight / 2) {
            setActiveSection(section.id);
          }
        }
      });
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && scrollRef.current) {
      const offsetTop = element.offsetTop - 100;
      scrollRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0" onInteractOutside={(e) => !canClose && e.preventDefault()}>
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted z-50">
          <div 
            className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-300"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 mb-2">
                <GraduationCap className="h-6 w-6 text-green-600" />
                Guarantee University Admission
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                A Comprehensive Guide by NWAMARIFE PATRICK (OHMAN)
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => canClose && onOpenChange(false)}
              disabled={!canClose}
              className={cn(
                "transition-all",
                !canClose && "opacity-30 cursor-not-allowed"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {!canClose && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              📖 Scroll to the bottom to close • Progress: {Math.round(scrollProgress)}%
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Side Navigation */}
          <div className="hidden md:flex flex-col gap-1 p-4 border-r bg-muted/30 w-48">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                    isActive 
                      ? "bg-green-600 text-white shadow-sm" 
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 h-[60vh]" ref={scrollRef as any}>
            <div className="p-6 space-y-12">
              {/* Pre-UTME Section */}
              <div id="pre-utme" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-600">
                  <Target className="h-6 w-6" />
                  Pre-UTME Preparation
                </h2>
                <div className="space-y-6">
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Correct O'level Result</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Achieving success in your WAEC or NECO examinations is imperative for gaining admission to Nigerian universities. 
                          Every institution mandates a minimum of five (5) credits in relevant subjects. For example, to pursue Radiography, 
                          you must secure credit passes in Mathematics, English Language, Biology, Chemistry, and Physics.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                          You are permitted to combine two O'level results for admission purposes. However, for prestigious courses such as 
                          Medicine and Surgery, the combination of O'level results is prohibited.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Select a Course that Resonates with Your Passion</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Possess a genuine passion for the course you wish to pursue in higher education. Passion is the driving force 
                          that propels you to excel and attain success. Avoid conforming to the crowd; dedicate time to self-discovery. 
                          Pursuing a course that does not align with your passion may lead to frustration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Pay Attention to Your Academic Prowess</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Having a passion for a course is one thing; meeting the academic criteria for the program is another. 
                          To study Law, for instance, you must attain a high score that surpasses the cut-off mark. Not every student 
                          can achieve the required cut-off score. You may need to compromise and settle for something adjacent to your 
                          dream course.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Identify Your Academic Strengths and Weaknesses</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Recognizing your academic strengths and weaknesses will significantly enhance your chances of securing admission. 
                          Do not shy away from your weaknesses; identify subjects in which you excel and pursue a course that encompasses 
                          those subjects.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Choose the Appropriate University</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
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
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-600">
                  <Award className="h-6 w-6" />
                  On-UTME Day
                </h2>
                <div className="space-y-6">
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Prepare, Excel, and Achieve a High Score in JAMB</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Thorough preparation and successful completion of your JAMB examination is the pathway to gaining admission in Nigeria. 
                      The fundamental principle is straightforward: the higher your JAMB score, the greater your chances of securing admission.
                    </p>
                    
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Strategies for Success:
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>Allot time for each question</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>Begin with subjects you find most familiar</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>Maintain a healthy mental and emotional state</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>Adhere to examination protocols</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post-Exam Section */}
              <div id="post-exam" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Post-Exam Actions
                </h2>
                <div className="space-y-6">
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Examine Your Course Competitors</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Investigate the number of candidates who selected your intended course at your chosen institution and their score ranges. 
                          JAMB typically allows CBT centers to provide UTME statistics to gauge how many candidates are vying for the same admission slot.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Link Your Email to JAMB CAPS</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Linking your email keeps you connected to the board. By linking your email to JAMB, you can access your JAMB Portal 
                          via your smartphone. Visit any JAMB office or nearby CBT center to complete this process.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Upload Your O'level Results</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Ensure that you have uploaded your O'level results to the board, as this is a prerequisite for gaining admission. 
                          Verify this through your phone after the upload.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Apply for Post-UTME</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          In some institutions, it is mandatory to submit an official application via the school's website regarding post-UTME. 
                          Register for post-UTME and consistently monitor your CAPS at https://efacility.jamb.gov.ng/Login to track your admission progress.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Create a JAMB Profile
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your JAMB Profile serves as a comprehensive account of all your information. This profile is your primary point of contact 
                      with JAMB for accepting/rejecting admission offers, checking admission status, and printing JAMB original results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Without UTME Section */}
              <div id="without-utme" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-600">
                  <BookOpen className="h-6 w-6" />
                  Admission Without UTME
                </h2>
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    While the UTME (JAMB) examination is the most prevalent method for securing university admission, 
                    it is by no means the only avenue available. You can gain admission through the following alternatives:
                  </p>

                  <div className="bg-card border-2 border-green-200 dark:border-green-800 rounded-lg p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Award className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      <h3 className="font-semibold text-lg">IJMB (Interim Joint Matriculation Board)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      IJMB facilitates students in securing direct admission into the second year (200 level) in various universities 
                      within Nigeria and abroad. The program mirrors JUPEB, and successful candidates can gain entry into the second year.
                    </p>
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded space-y-2 text-sm">
                      <p className="font-semibold">Highlights:</p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Secures 2nd year direct entry admission without JAMB-UTME</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Recognized by universities for 200-level direct entry admission</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Duration: 12 months (1 year)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Coordinated by ABU, Zaria since 1974</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">JUPEB</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Joint Universities Preliminary Examinations Board - Similar to IJMB, provides direct entry to 200 level 
                          in participating universities.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Pre-Degree/Pre-Science Programs</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          A pre-degree program offers a viable pathway to university admission, often referred to as a remedial program. 
                          This program typically spans one academic session (one year), during which students are instructed in fundamental subjects.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <Target className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Nursing Entrance Examination</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Specialized entrance exam for nursing programs at various institutions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Abroad Section */}
              <div id="abroad" className="scroll-mt-20">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-green-600">
                  <GraduationCap className="h-6 w-6" />
                  Study Abroad Opportunities
                </h2>
                <div className="space-y-6">
                  <div className="bg-card border rounded-lg p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      Exploring international education opportunities can open doors to world-class universities and diverse learning experiences.
                    </p>
                    
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-600" />
                        Key Considerations:
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Research scholarship opportunities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Check admission requirements for international students</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Prepare required standardized tests (SAT, TOEFL, IELTS)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Consider cost of living and tuition fees</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Explore student visa requirements</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Final padding to ensure last section can be scrolled to bottom */}
                  <div className="h-32"></div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
