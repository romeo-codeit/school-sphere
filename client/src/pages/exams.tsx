import React, { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, Search, FileText, Play, Clock, Users } from "lucide-react";
import { useExams } from "@/hooks/useExams";
import { useStartAttempt } from "@/hooks/useCBT";
import { useLocation } from "wouter";
import { UploadExamForm } from "@/components/upload-exam-form";
import { Loading } from "@/components/ui/loading";
import { useQuery } from '@tanstack/react-query';
import { SubjectSelectionDialog } from "@/components/exams/SubjectSelectionDialog";
import { useToast } from "@/hooks/use-toast";
// Assigned exams feature removed
import { AssignExamDialog } from "@/components/exams/AssignExamDialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useExamsPerformanceTest, logExamsPerformanceMetrics } from '@/hooks/useExamsPerformanceTest';

// Removed per-row question count fetch to avoid N expensive reads on lists.
// Show placeholder in list; fetch full details only in preview dialog.

// ExamPreviewDialog should only render the preview dialog
function ExamPreviewDialog({ exam, open, onOpenChange }: { exam: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { useExam } = useExams();
  const { data: fullExam, isLoading } = useExam(open && exam?.$id ? String(exam.$id) : '');
  if (!exam) return null;
  const title = fullExam?.title ?? exam.title;
  const type = fullExam?.type ?? exam.type;
  const subject = fullExam?.subject ?? exam.subject;
  const duration = fullExam?.duration ?? exam.duration;
  const qCount = Array.isArray(fullExam?.questions) ? fullExam.questions.length : undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto modern-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl md:text-2xl">Exam Preview</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Review exam details before taking or managing
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Type:</span>
                <Badge variant="outline" className="text-xs">{type}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Subject:</span>
                <Badge variant="secondary" className="text-xs">{subject}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Duration:</span>
                <span className="text-xs sm:text-sm font-semibold">{duration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Questions:</span>
                <span className="text-xs sm:text-sm font-semibold">{isLoading ? '…' : (typeof qCount === 'number' ? qCount : '…')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ExamsPage() {
  const { role } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [selectedExamForPreview, setSelectedExamForPreview] = useState<any | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [subjectSelectionExam, setSubjectSelectionExam] = useState<any | null>(null);
  // Assigned exams feature removed
  const [assignExamId, setAssignExamId] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const startAttemptMutation = useStartAttempt();
  // Assigned exams feature removed

  // Guests: fetch subscription state to gate UI
  const [guestSubActive, setGuestSubActive] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const checkGuestSubscription = async () => {
      if (role !== 'guest') { setGuestSubActive(true); return; }
      try {
        const res = await apiRequest('GET', '/api/users/subscription');
        const data = await res.json();
        setGuestSubActive(data?.subscriptionStatus === 'active');
      } catch { setGuestSubActive(false); }
    };
    checkGuestSubscription();
  }, [role]);

  // Fetch ALL exams for table and stats (no questions, no type filter)
  const { exams: allExams, isLoading: isAllLoading } = useExams({ limit: 'all', withQuestions: false });

  // Filter by search and type (exclude jamb/waec/neco from school exams list)
  const filteredExams = (allExams || []).filter((exam: any) => {
    const examType = String(exam.type || '').toLowerCase();
    // Hide standardized exams from school exams list
    if (['jamb', 'waec', 'neco'].includes(examType)) return false;
    const matchesSearch = String(exam.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || examType === selectedType;
    return matchesSearch && matchesType;
  });

  // Paginate filtered exams on the frontend
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0); // zero-based
  const paginatedExams = filteredExams.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredExams.length / PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const { testPerformance, clearCache } = useExamsPerformanceTest();

  // Performance test handlers (only used in development)
  const handlePerformanceTest = async () => {
    const metrics = await testPerformance();
    if (metrics) {
      logExamsPerformanceMetrics('Performance Test Completed', metrics.totalTime, metrics);
    }
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Make performance testing available in development console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).examsPerfTest = {
        testPerformance: handlePerformanceTest,
        clearCache: handleClearCache,
      };
    }
  }, []);

  // Persist filters and pagination across refreshes
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('exams:list:state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.searchQuery === 'string') setSearchQuery(parsed.searchQuery);
        if (typeof parsed.selectedType === 'string') setSelectedType(parsed.selectedType);
        if (typeof parsed.page === 'number') setPage(parsed.page);
      }
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      const state = { searchQuery, selectedType, page };
      localStorage.setItem('exams:list:state', JSON.stringify(state));
    } catch {}
  }, [searchQuery, selectedType, page]);

  const handleStartExam = (exam: any) => {
    // Guests: block starting internal/school exams entirely
    if (role === 'guest') {
      toast({ variant: 'destructive', title: 'Not allowed', description: 'Guests can only access practice exams.' });
      return;
    }
    const examType = String(exam.type || '').toLowerCase();
    // For internal/school exams, start directly
    startAttemptMutation.mutate(
      { examId: exam.$id },
      {
        onSuccess: (attempt) => {
          navigate(`/exams/${exam.$id}/take?attemptId=${attempt.$id}`);
        },
        onError: (err: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: err?.message || 'Failed to start exam',
          });
        },
      }
    );
  };

  const handleSubjectSelectionConfirm = async (selectedSubjects: string[], extras?: { year?: string; paperType?: 'objective' | 'theory' }) => {
    if (!subjectSelectionExam) return;
    
    // For practice hub sessions, we create a synthetic practice exam attempt
    // The backend will handle generating questions from multiple subjects
    const practiceType = subjectSelectionExam.type; // 'jamb' | 'waec' | 'neco'
    
    try {
      startAttemptMutation.mutate(
        { 
          examId: 'practice-' + practiceType, // Synthetic ID for practice sessions
          subjects: selectedSubjects,
          year: extras?.year,
          paperType: extras?.paperType
        },
        {
          onSuccess: (attempt) => {
            setSubjectSelectionExam(null);
            // Navigate to a practice session route
            const yearQuery = extras?.year ? `&year=${encodeURIComponent(extras.year)}` : '';
            const typeSlug = extras?.paperType === 'objective' ? 'obj' : extras?.paperType; // map to Appwrite values
            const typeQuery = typeSlug ? `&paperType=${encodeURIComponent(typeSlug)}` : '';
            navigate(`/exams/practice/${practiceType}?attemptId=${attempt.$id}&subjects=${selectedSubjects.join(',')}${yearQuery}${typeQuery}`);
          },
          onError: (err: any) => {
            console.error('Failed to start practice session:', err);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: err?.message || 'Failed to start practice session. Please try again.',
            });
          },
        }
      );
    } catch (error) {
      console.error('Error in subject selection confirm:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handlePreviewExam = (exam: any) => {
    setSelectedExamForPreview(exam);
    setIsPreviewDialogOpen(true);
  };

  // Stats (always use allExams - all types, no filters)
  const examStats = {
    jamb: (allExams || []).filter((e: any) => String(e.type || '').toLowerCase() === "jamb").length,
    waec: (allExams || []).filter((e: any) => String(e.type || '').toLowerCase() === "waec").length,
    neco: (allExams || []).filter((e: any) => String(e.type || '').toLowerCase() === "neco").length,
    internal: (allExams || []).filter((e: any) => String(e.type || '').toLowerCase() === "internal").length,
  };

  return (
    <div className="min-h-screen space-y-4 sm:space-y-6">
      <TopNav title="Exams" subtitle="Practice standardized tests or take school exams" showGoBackButton={true} />
      {role === 'guest' && guestSubActive === false && (
        <div className="mx-4 sm:mx-6 lg:mx-8 -mb-4">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <div className="font-semibold text-sm sm:text-base">Activation required</div>
              <div className="text-xs sm:text-sm">Enter your activation code to unlock practice exams.</div>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate('/activate')}>Activate</Button>
          </div>
        </div>
      )}
      <ErrorBoundary>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
  {/* Practice Hub for JAMB/WAEC/NECO */}
        <Card className="mb-6 sm:mb-8 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">Practice Hub</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Select subjects and start practice sessions for standardized exams</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary active:scale-95"
                onClick={() => role === 'guest' && guestSubActive === false ? navigate('/activate') : setSubjectSelectionExam({ type: 'jamb', title: 'JAMB Practice' })}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">JAMB</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {examStats.jamb} question sets available
                  </p>
                  <Badge variant="outline" className="text-xs">4 subjects required</Badge>
                </CardContent>
              </Card>
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-secondary active:scale-95"
                onClick={() => role === 'guest' && guestSubActive === false ? navigate('/activate') : setSubjectSelectionExam({ type: 'waec', title: 'WAEC Practice' })}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="text-secondary w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">WAEC</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {examStats.waec} question sets available
                  </p>
                  <Badge variant="outline" className="text-xs">Multi-subject</Badge>
                </CardContent>
              </Card>
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-accent active:scale-95 sm:col-span-2 lg:col-span-1"
                onClick={() => role === 'guest' && guestSubActive === false ? navigate('/activate') : setSubjectSelectionExam({ type: 'neco', title: 'NECO Practice' })}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="text-accent w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">NECO</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {examStats.neco} question sets available
                  </p>
                  <Badge variant="outline" className="text-xs">Multi-subject</Badge>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

  {/* Internal Exams & Assigned Exams (hidden for guests) */}
  {role !== 'guest' && (
  <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <CardTitle className="text-base sm:text-lg md:text-xl">School Exams</CardTitle>
              {(role === 'admin' || role === 'teacher') && (
                <Button onClick={() => setIsUploadFormOpen(true)} data-testid="button-upload-exam" className="w-full sm:w-auto text-sm" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Questions
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full text-sm sm:text-base"
                  data-testid="input-search-exams"
                />
              </div>
            </div>

            {/* Exam Types Tabs */}
            <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-4 sm:mb-6">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">All School Exams</TabsTrigger>
                  <TabsTrigger value="internal" className="flex-1 sm:flex-none text-xs sm:text-sm">Internal</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
            {/* Assigned exams section removed */}

            {/* Exams List: Mobile Card view and Desktop Table view */}
            {isAllLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : paginatedExams.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Exams Found"
                description={searchQuery ? "No exams found matching your search. Try adjusting your filters." : "No exams are currently available. Check back later or contact your teacher."}
              />
            ) : (
              <>
                {/* Mobile: Card view */}
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                  {paginatedExams.map((exam: any) => (
                    <Card key={exam.$id} className="p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="font-semibold text-sm truncate">{exam.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{exam.subject}</div>
                        </div>
                        <Badge variant={exam.isActive ? 'primary' : 'secondary'} className="text-xs shrink-0">
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-xs mb-1"><span className="font-medium">Type:</span> {exam.type.toUpperCase()}</div>
                      <div className="text-xs mb-1"><span className="font-medium">Questions:</span> —</div>
                      <div className="text-xs mb-1"><span className="font-medium">Duration:</span> {exam.duration || 0} mins</div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => handlePreviewExam(exam)} className="flex-1 text-xs h-8">
                          <FileText className="w-3 h-3 mr-1" />Preview
                        </Button>
                        <Button size="sm" onClick={() => handleStartExam(exam)} className="flex-1 text-xs h-8">
                          <Play className="w-3 h-3 mr-1" />Start
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop: Table view with horizontal scroll on smaller screens */}
                <div className="rounded-md border hidden sm:block overflow-x-auto">
                  <Table className="w-full min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Exam Title</TableHead>
                        <TableHead className="min-w-[100px]">Type</TableHead>
                        <TableHead className="min-w-[120px]">Subject</TableHead>
                        <TableHead className="min-w-[100px]">Questions</TableHead>
                        <TableHead className="min-w-[100px]">Duration</TableHead>
                        <TableHead className="min-w-[90px]">Status</TableHead>
                        <TableHead className="min-w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExams.map((exam: any) => (
                        <TableRow key={exam.$id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium text-sm">{exam.title}</div>
                            <div className="text-xs text-muted-foreground">{exam.subject}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={'text-xs whitespace-nowrap ' + (exam.type === 'jamb' ? 'border-primary text-primary' : exam.type === 'waec' ? 'border-secondary text-secondary' : exam.type === 'neco' ? 'border-accent text-accent' : 'border-muted-foreground text-muted-foreground')}>
                              {exam.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{exam.subject}</TableCell>
                          <TableCell className="text-sm">—</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm whitespace-nowrap">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{exam.duration || 0} mins</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={exam.isActive ? 'primary' : 'secondary'} className="text-xs whitespace-nowrap">
                              {exam.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="text-xs whitespace-nowrap" onClick={() => handlePreviewExam(exam)}>
                                <FileText className="w-3 h-3 mr-1" />Preview
                              </Button>
                              <Button size="sm" className="text-xs whitespace-nowrap" onClick={() => handleStartExam(exam)}>
                                <Play className="w-3 h-3 mr-1" />Start
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev}>Previous</Button>
                  <span className="text-xs sm:text-sm font-medium">Page {page + 1} of {totalPages || 1}</span>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={!canNext}>Next</Button>
                </div>
              </>
            )}
          </CardContent>
  </Card>
  )}
        <ExamPreviewDialog
          exam={selectedExamForPreview}
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
        />
        <SubjectSelectionDialog
          open={!!subjectSelectionExam}
          onOpenChange={(open) => !open && setSubjectSelectionExam(null)}
          examType={(subjectSelectionExam?.type || 'internal') as any}
          onConfirm={handleSubjectSelectionConfirm}
        />
        <Dialog open={isUploadFormOpen} onOpenChange={setIsUploadFormOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto modern-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Upload New Exam</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Fill in the details below to create a new exam.
              </DialogDescription>
            </DialogHeader>
            <UploadExamForm onFinished={() => setIsUploadFormOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default ExamsPage;