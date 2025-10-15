import React, { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useStartAttempt, useAssignedExams } from "@/hooks/useCBT";
import { useLocation } from "wouter";
import { UploadExamForm } from "@/components/upload-exam-form";
import { Loading } from "@/components/ui/loading";
import { useQuery } from '@tanstack/react-query';
import { SubjectSelectionDialog } from "@/components/exams/SubjectSelectionDialog";
import { useToast } from "@/hooks/use-toast";
import { AssignExamDialog } from "@/components/exams/AssignExamDialog";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useExamsPerformanceTest, logExamsPerformanceMetrics } from '@/hooks/useExamsPerformanceTest';

// Helper hook to fetch question count for an exam
function useExamQuestionCount(examId: string) {
  const { getJWT } = useAuth();
  return useQuery({
    queryKey: ['exam-questions-count', examId],
    queryFn: async () => {
      const jwt = await getJWT();
      const res = await fetch(`/api/cbt/exams/${examId}` , { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
      if (!res.ok) throw new Error('Failed to fetch exam');
      const data = await res.json();
      return Array.isArray(data.questions) ? data.questions.length : 0;
    },
    enabled: !!examId,
  });
}

// Small child component so we can use hooks per-row without breaking Rules of Hooks
function ExamQuestionCount({ examId }: { examId: string }) {
  const { data: count, isLoading } = useExamQuestionCount(examId);
  if (isLoading) return <>…</>;
  return <>{typeof count === 'number' ? count : '…'}</>;
}

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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Exam Preview</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Review exam details before taking or managing
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Type:</span>
                <Badge variant="outline">{type}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                <Badge variant="secondary">{subject}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Duration:</span>
                <span className="text-sm font-semibold">{duration} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Questions:</span>
                <span className="text-sm font-semibold">{isLoading ? '…' : (typeof qCount === 'number' ? qCount : '…')}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ExamsPage() {
  const { role, getJWT } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [selectedExamForPreview, setSelectedExamForPreview] = useState<any | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [subjectSelectionExam, setSubjectSelectionExam] = useState<any | null>(null);
  const [assignExamId, setAssignExamId] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const startAttemptMutation = useStartAttempt();
  const { data: assignedData } = useAssignedExams();

  // Guests: fetch subscription state to gate UI
  const [guestSubActive, setGuestSubActive] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const checkGuestSubscription = async () => {
      if (role !== 'guest') { setGuestSubActive(true); return; }
      try {
        const jwt = await getJWT();
        const res = await fetch('/api/users/subscription', { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} });
        if (!res.ok) { setGuestSubActive(false); return; }
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

  const handleSubjectSelectionConfirm = async (selectedSubjects: string[], extras?: { year?: string }) => {
    if (!subjectSelectionExam) return;
    
    // For practice hub sessions, we create a synthetic practice exam attempt
    // The backend will handle generating questions from multiple subjects
    const practiceType = subjectSelectionExam.type; // 'jamb' | 'waec' | 'neco'
    
    startAttemptMutation.mutate(
      { 
        examId: 'practice-' + practiceType, // Synthetic ID for practice sessions
        subjects: selectedSubjects 
      },
      {
        onSuccess: (attempt) => {
          setSubjectSelectionExam(null);
          // Navigate to a practice session route
          const yearQuery = extras?.year ? `&year=${encodeURIComponent(extras.year)}` : '';
          navigate(`/exams/practice/${practiceType}?attemptId=${attempt.$id}&subjects=${selectedSubjects.join(',')}${yearQuery}`);
        },
        onError: (err: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: err?.message || 'Failed to start practice session',
          });
        },
      }
    );
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
    <div className="space-y-6">
      <TopNav title="Exams" subtitle="Practice standardized tests or take school exams" showGoBackButton={true} />
      {role === 'guest' && guestSubActive === false && (
        <div className="mx-4 sm:mx-6 lg:mx-8 -mb-4">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">Activation required</div>
              <div className="text-sm">Enter your activation code to unlock practice exams.</div>
            </div>
            <Button variant="outline" onClick={() => navigate('/activate')}>Activate</Button>
          </div>
        </div>
      )}
      <ErrorBoundary>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
  {/* Practice Hub for JAMB/WAEC/NECO */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Practice Hub</CardTitle>
            <p className="text-sm text-muted-foreground">Select subjects and start practice sessions for standardized exams</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
                onClick={() => role === 'guest' && guestSubActive === false ? navigate('/activate') : setSubjectSelectionExam({ type: 'jamb', title: 'JAMB Practice' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-primary text-2xl" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">JAMB</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {examStats.jamb} question sets available
                  </p>
                  <Badge variant="outline" className="text-xs">4 subjects required</Badge>
                </CardContent>
              </Card>
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-secondary"
                onClick={() => role === 'guest' && guestSubActive === false ? navigate('/activate') : setSubjectSelectionExam({ type: 'waec', title: 'WAEC Practice' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-secondary text-2xl" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">WAEC</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {examStats.waec} question sets available
                  </p>
                  <Badge variant="outline" className="text-xs">Multi-subject</Badge>
                </CardContent>
              </Card>
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-accent"
                onClick={() => role === 'guest' && guestSubActive === false ? navigate('/activate') : setSubjectSelectionExam({ type: 'neco', title: 'NECO Practice' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-accent text-2xl" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">NECO</h4>
                  <p className="text-sm text-muted-foreground mb-2">
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
  <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">School Exams</CardTitle>
              {(role === 'admin' || role === 'teacher') && (
                <Button onClick={() => setIsUploadFormOpen(true)} data-testid="button-upload-exam" className="w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Questions
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="relative w-full sm:flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                  data-testid="input-search-exams"
                />
              </div>
            </div>

            {/* Exam Types Tabs */}
            <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
              <div className="overflow-x-auto">
                <TabsList>
                  <TabsTrigger value="all">All School Exams</TabsTrigger>
                  <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
                  <TabsTrigger value="internal">Internal</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
            {selectedType === 'assigned' && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Assigned Exams</CardTitle>
                </CardHeader>
                <CardContent>
                  {!assignedData ? (
                    <div className="text-center py-8"><Loading text="Loading assigned exams..." /></div>
                  ) : assignedData.exams.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No assigned exams yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignedData.exams.map((exam: any) => (
                        <Card key={exam.$id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold text-base">{exam.title}</div>
                              <div className="text-xs text-muted-foreground">{exam.subject}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{String(exam.type).toUpperCase()}</Badge>
                          </div>
                          <div className="text-sm mb-1"><span className="font-medium">Duration:</span> {exam.duration || 0} mins</div>
                          <div className="flex gap-2 mt-2 justify-end">
                            <Button size="sm" onClick={() => handleStartExam(exam)}><Play className="w-3 h-3 mr-1" />Start</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Exams List: Mobile Card view and Desktop Table view */}
            {isAllLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : paginatedExams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No exams found matching your search." : "No exams available."}
              </div>
            ) : (
              <>
                {/* Mobile: Card view */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {paginatedExams.map((exam: any) => {
                    return (
                      <Card key={exam.$id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-base">{exam.title}</div>
                            <div className="text-xs text-muted-foreground">{exam.subject}</div>
                          </div>
                          <Badge variant={exam.isActive ? 'primary' : 'secondary'} className="text-xs">
                            {exam.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="text-sm mb-1"><span className="font-medium">Type:</span> {exam.type.toUpperCase()}</div>
                        <div className="text-sm mb-1"><span className="font-medium">Questions:</span> <ExamQuestionCount examId={exam.$id} /></div>
                        <div className="text-sm mb-1"><span className="font-medium">Duration:</span> {exam.duration || 0} mins</div>
                        <div className="flex gap-2 mt-2 justify-end">
                          <Button size="icon" variant="outline" onClick={() => handlePreviewExam(exam)} className="p-2"><FileText className="w-4 h-4" /></Button>
                          <Button size="icon" onClick={() => handleStartExam(exam)} className="p-2"><Play className="w-4 h-4" /></Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {/* Desktop: Table view */}
                <div className="rounded-md border hidden sm:block">
                  <Table className="w-full min-w-full">
                    <TableHeader className="table-header-group">
                      <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExams.map((exam: any) => {
                        return (
                          <TableRow key={exam.$id}>
                            <TableCell>
                              <div className="font-medium text-sm sm:text-base">{exam.title}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">{exam.subject}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={'text-xs sm:text-sm ' + (exam.type === 'jamb' ? 'border-primary text-primary' : exam.type === 'waec' ? 'border-secondary text-secondary' : exam.type === 'neco' ? 'border-accent text-accent' : 'border-muted-foreground text-muted-foreground')}>
                                {exam.type.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{exam.subject}</TableCell>
                            <TableCell className="text-xs sm:text-sm"><ExamQuestionCount examId={exam.$id} /> questions</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1 text-xs sm:text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                <span>{exam.duration || 0} mins</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={exam.isActive ? 'primary' : 'secondary'} className={'text-xs sm:text-sm ' + (exam.isActive ? 'bg-secondary/10 text-secondary' : 'bg-muted/10 text-muted-foreground')}>
                                {exam.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => handlePreviewExam(exam)}><FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Preview</Button>
                                {(role === 'admin' || role === 'teacher') && (
                                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => setAssignExamId(exam.$id)}><Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Assign</Button>
                                )}
                                <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => handleStartExam(exam)}><Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Start</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-4 my-6">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev}>
                    Previous
                  </Button>
                  <span className="text-sm">Page {page + 1} of {totalPages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={!canNext}>
                    Next
                  </Button>
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
        {assignExamId && (
          <AssignExamDialog examId={assignExamId} open={!!assignExamId} onOpenChange={(open) => !open && setAssignExamId(null)} />
        )}
        <Dialog open={isUploadFormOpen} onOpenChange={setIsUploadFormOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Upload New Exam</DialogTitle>
              <DialogDescription>
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