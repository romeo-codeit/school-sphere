import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, BookOpen, Award, Target, CheckCircle } from "lucide-react";

interface AdmissionTipsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdmissionTipsModal({ open, onOpenChange }: AdmissionTipsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Guarantee University Admission
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            A Comprehensive University Admission Guide by NWAMARIFE PATRICK (OHMAN)
          </p>
        </DialogHeader>

        <Tabs defaultValue="pre-utme" className="w-full">
          <TabsList className="grid w-full grid-cols-5 px-6">
            <TabsTrigger value="pre-utme">Pre-UTME</TabsTrigger>
            <TabsTrigger value="on-utme">On-UTME</TabsTrigger>
            <TabsTrigger value="post-exam">Post-Exam</TabsTrigger>
            <TabsTrigger value="without-utme">Without UTME</TabsTrigger>
            <TabsTrigger value="abroad">Study Abroad</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] px-6 py-4">
            <TabsContent value="pre-utme" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
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

                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Select a Course that Resonates with Your Passion</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Possess a genuine passion for the course you wish to pursue in higher education. Passion is the driving force 
                      that propels you to excel and attain success. Avoid conforming to the crowd; dedicate time to self-discovery. 
                      Pursuing a course that does not align with your passion may lead to frustration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
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

                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Identify Your Academic Strengths and Weaknesses</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Recognizing your academic strengths and weaknesses will significantly enhance your chances of securing admission. 
                      Do not shy away from your weaknesses; identify subjects in which you excel and pursue a course that encompasses 
                      those subjects.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Choose the Appropriate University</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Selecting the right university is paramount to your admission success. Consider factors such as ELDA, 
                      ADMISSION BY MERIT, and CATCHMENT AREA, as they play crucial roles in the admission process.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="on-utme" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Prepare, Excel, and Achieve a High Score in JAMB</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Thorough preparation and successful completion of your JAMB examination is the pathway to gaining admission in Nigeria. 
                  The fundamental principle is straightforward: the higher your JAMB score, the greater your chances of securing admission.
                </p>
                
                <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Strategies for Success:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Allot time for each question</li>
                    <li>Begin with subjects you find most familiar</li>
                    <li>Maintain a healthy mental and emotional state</li>
                    <li>Adhere to examination protocols</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="post-exam" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Examine Your Course Competitors</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Investigate the number of candidates who selected your intended course at your chosen institution and their score ranges. 
                      JAMB typically allows CBT centers to provide UTME statistics to gauge how many candidates are vying for the same admission slot.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Link Your Email to JAMB CAPS</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Linking your email keeps you connected to the board. By linking your email to JAMB, you can access your JAMB Portal 
                      via your smartphone. Visit any JAMB office or nearby CBT center to complete this process.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Upload Your O'level Results</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ensure that you have uploaded your O'level results to the board, as this is a prerequisite for gaining admission. 
                      Verify this through your phone after the upload.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Apply for Post-UTME</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      In some institutions, it is mandatory to submit an official application via the school's website regarding post-UTME. 
                      Register for post-UTME and consistently monitor your CAPS at https://efacility.jamb.gov.ng/Login to track your admission progress.
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Create a JAMB Profile</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your JAMB Profile serves as a comprehensive account of all your information. This profile is your primary point of contact 
                    with JAMB for accepting/rejecting admission offers, checking admission status, and printing JAMB original results.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="without-utme" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  While the UTME (JAMB) examination is the most prevalent method for securing university admission, 
                  it is by no means the only avenue available. You can gain admission through the following alternatives:
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">IJMB (Interim Joint Matriculation Board)</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      IJMB facilitates students in securing direct admission into the second year (200 level) in various universities 
                      within Nigeria and abroad. The program mirrors JUPEB, and successful candidates can gain entry into the second year.
                    </p>
                    <div className="bg-primary/5 p-3 rounded space-y-1 text-sm">
                      <p className="font-semibold">Highlights:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Secures 2nd year direct entry admission without JAMB-UTME</li>
                        <li>Recognized by universities for 200-level direct entry admission</li>
                        <li>Duration: 12 months (1 year)</li>
                        <li>Coordinated by ABU, Zaria since 1974</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">JUPEB</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Joint Universities Preliminary Examinations Board - Similar to IJMB, provides direct entry to 200 level 
                      in participating universities.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Pre-Degree/Pre-Science Programs</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A pre-degree program offers a viable pathway to university admission, often referred to as a remedial program. 
                      This program typically spans one academic session (one year), during which students are instructed in fundamental subjects.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Nursing Entrance Examination</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Specialized entrance exam for nursing programs at various institutions.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="abroad" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Study Abroad Opportunities</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Exploring international education opportunities can open doors to world-class universities and diverse learning experiences.
                </p>
                
                <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Key Considerations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Research scholarship opportunities</li>
                    <li>Check admission requirements for international students</li>
                    <li>Prepare required standardized tests (SAT, TOEFL, IELTS)</li>
                    <li>Consider cost of living and tuition fees</li>
                    <li>Explore student visa requirements</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-6 pt-4 border-t flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            By NWAMARIFE PATRICK (OHMAN) - Ohman Creative Foundation
          </p>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
