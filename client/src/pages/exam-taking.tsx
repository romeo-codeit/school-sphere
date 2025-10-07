import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useExams } from "@/hooks/useExams";
import { useExamAttempts } from "@/hooks/useExamAttempts";
import { useAutosaveAttempt } from "@/hooks/useCBT";
import { useToast } from "@/hooks/use-toast";
import { Clock, Flag, ArrowLeft, ArrowRight, Send, ShieldAlert, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  marks?: number;
  explanation?: string;
}

export default function ExamTaking() {
  const params = useParams();
  const examId = params.id || params.type; // Support both /exams/:id/take and /exams/practice/:type
  const practiceType = params.type; // Will be set for practice routes
  const [searchParams] = useState(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));
  const subjects = searchParams.get('subjects')?.split(',') || [];
  
  const { useExam } = useExams();
  // For practice sessions, pass subjects to fetch the right questions
  const examFetchId = practiceType ? `practice-${practiceType}` : (examId || '');
  const examUrl = practiceType && subjects.length > 0 
    ? `${examFetchId}?subjects=${subjects.join(',')}` 
    : examFetchId;
  const { data: exam, isLoading: isLoadingExam } = useExam(examUrl);
  
  const { startAttempt, submitAttempt } = useExamAttempts();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Phase 3: Security & Fullscreen
  const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false);
  const [isTabSwitchDialogOpen, setIsTabSwitchDialogOpen] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  // Phase 4: Advanced timer & autosave
  const [showTenMinuteWarning, setShowTenMinuteWarning] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const autosaveRef = useRef<number | null>(null);
  const hasRestoredRef = useRef(false);
  const autosaveMutation = useAutosaveAttempt();
  // Optional polish: Autosave retry/backoff + status indicator
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [retryDelay, setRetryDelay] = useState<number>(5000); // start 5s, max 2m
  const retryTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef<boolean>(false);

  // Read attemptId from URL if present (so we don't create a new attempt)
  useEffect(() => {
    try {
      const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const id = search?.get('attemptId');
      if (id) setAttemptId(id);
    } catch {}
  }, []);

  // Start attempt when exam loads (only if we don't already have one via URL)
  useEffect(() => {
    if (exam && !attemptId) {
      handleStartAttempt();
    }
  }, [exam, attemptId]);

  // Timer countdown
  useEffect(() => {
    if (!exam?.duration) return;
    if (timeLeft !== null) return;
    // Prefer restored timeLeft from localStorage if available
    try {
      const key = attemptId ? `cbt:attempt:${attemptId}` : (examId ? `cbt:exam:${examId}` : 'cbt:exam:unknown');
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw || '{}');
        if (typeof saved.timeLeft === 'number' && saved.timeLeft > 0) {
          setTimeLeft(saved.timeLeft);
          return;
        }
      }
    } catch {}
    setTimeLeft(exam.duration * 60); // Convert minutes to seconds
  }, [exam, timeLeft, attemptId, examId]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleAutoSubmit();
    }
    if (!timeLeft || timeLeft <= 0) return;
    if (timerPaused) return; // Pause timer during security events

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, timerPaused]);

  // Ten-minute warning (once)
  useEffect(() => {
    if (typeof timeLeft === 'number' && timeLeft <= 600 && timeLeft > 0 && !showTenMinuteWarning) {
      setShowTenMinuteWarning(true);
    }
  }, [timeLeft, showTenMinuteWarning]);

  const handleStartAttempt = async () => {
    if (!examId) return;
    try {
      const attempt = await startAttempt(examId);
      setAttemptId(attempt.$id);
      // Enforce fullscreen upon attempt start
      await enterFullscreen();
    } catch (error: any) {
      console.error('Failed to start exam attempt:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start exam. Please try again or contact support.",
        variant: "destructive",
      });
      setLocation("/exams");
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: value }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleNext = () => {
    if (exam && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmitConfirmed();
  };

  const handleSubmitConfirmed = async () => {
    if (!attemptId || !exam) return;

    setIsSubmitting(true);
    try {
      const result = await submitAttempt({ attemptId, answers });
      // Clear any local draft on successful submit
      try {
        const key = attemptId ? `cbt:attempt:${attemptId}` : (examId ? `cbt:exam:${examId}` : 'cbt:exam:unknown');
        localStorage.removeItem(key);
      } catch {}
      toast({
        title: "Submitted",
        description: `Your exam was submitted successfully.`,
      });
      // If backend returns the attempt id, prefer it; else fall back to local attemptId
      const id = (result && (result.$id || result.id)) || attemptId;
      if (id) setLocation(`/exams/attempts/${id}/results`);
    } catch (error: any) {
      console.error('Failed to submit exam:', error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit exam. Your answers are saved locally. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  // --- Phase 3: Fullscreen & Anti-cheat ---
  const isInFullscreen = () => {
    return Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
  };

  const enterFullscreen = async () => {
    const el: any = document.documentElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      setIsFullscreenDialogOpen(false);
      setIsTabSwitchDialogOpen(false);
      setTimerPaused(false);
    } catch {
      // If user blocks fullscreen, pause and show dialog
      setTimerPaused(true);
      setIsFullscreenDialogOpen(true);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      const active = isInFullscreen();
      if (!active && attemptId) {
        setTimerPaused(true);
        setIsFullscreenDialogOpen(true);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    // Vendor prefixes (best-effort)
    document.addEventListener('webkitfullscreenchange', onFsChange as any);
    document.addEventListener('mozfullscreenchange', onFsChange as any);
    document.addEventListener('MSFullscreenChange', onFsChange as any);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange as any);
      document.removeEventListener('mozfullscreenchange', onFsChange as any);
      document.removeEventListener('MSFullscreenChange', onFsChange as any);
    };
  }, [attemptId]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && attemptId) {
        setTimerPaused(true);
        setIsTabSwitchDialogOpen(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [attemptId]);

  useEffect(() => {
    // Block right-click and copy/paste/select
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('selectstart', block);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('selectstart', block);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // If any modal open, ignore shortcuts
      if (isFullscreenDialogOpen || isTabSwitchDialogOpen || showSubmitDialog) return;
      // Numbers 1-4 => pick option (if exists)
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1;
        const opts = (exam?.questions?.[currentQuestionIndex]?.options as string[] | undefined) || [];
        if (opts[idx]) {
          e.preventDefault();
          handleAnswerChange(String(opts[idx]));
        }
      }
      // Left/Right for navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      // F to flag
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleMarkForReview();
      }
      // S to submit (open dialog)
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowSubmitDialog(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exam, currentQuestionIndex, showSubmitDialog, isFullscreenDialogOpen, isTabSwitchDialogOpen]);

  // --- Phase 4: Offline detection & autosave ---
  // Warn on accidental unload while an attempt is active
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (attemptId && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [attemptId, isSubmitting]);

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      // Resume timer if no security dialogs are open
      if (!isFullscreenDialogOpen && !isTabSwitchDialogOpen) setTimerPaused(false);
    };
    const onOffline = () => {
      setIsOffline(true);
      setTimerPaused(true);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [isFullscreenDialogOpen, isTabSwitchDialogOpen]);

  const storageKey = attemptId ? `cbt:attempt:${attemptId}` : (examId ? `cbt:exam:${examId}` : 'cbt:exam:unknown');

  // Restore from localStorage once when exam is ready
  useEffect(() => {
    if (!exam) return;
    if (hasRestoredRef.current) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw || '{}');
        if (saved && typeof saved === 'object') {
          if (saved.answers && typeof saved.answers === 'object') {
            setAnswers((prev) => ({ ...prev, ...saved.answers }));
          }
          toast({ title: 'Restored progress', description: 'Recovered unsaved answers from this device.' });
        }
      }
    } catch {}
    hasRestoredRef.current = true;
  }, [exam, storageKey]);

  // One-minute remaining toast
  useEffect(() => {
    if (timeLeft === 60) {
      toast({ title: '1 minute remaining', description: 'The exam will auto-submit when time expires.' });
    }
  }, [timeLeft]);
  // Periodic autosave (local + backend)
  useEffect(() => {
    if (!attemptId) return; // Only autosave to backend when we have an attempt
    if (!timeLeft && timeLeft !== 0) return; // need timer
    if (autosaveRef.current) window.clearInterval(autosaveRef.current);
    const saveLocal = () => {
      // Local save
      try {
        localStorage.setItem(storageKey, JSON.stringify({ answers, timeLeft, updatedAt: Date.now() }));
      } catch {}
    };
    const triggerAutosave = () => {
      if (!attemptId || isOffline) return;
      if (isSavingRef.current) return; // avoid concurrent autosaves
      // Compute time spent from timer
      const totalSec = (exam?.duration ? exam.duration * 60 : 0);
      const timeSpent = totalSec && typeof timeLeft === 'number' ? Math.max(0, totalSec - timeLeft) : 0;
      isSavingRef.current = true;
      setAutosaveStatus('saving');
      setAutosaveError(null);
      autosaveMutation.mutate(
        { attemptId, answers, timeSpent },
        {
          onSuccess: () => {
            isSavingRef.current = false;
            setAutosaveStatus('saved');
            setLastSavedAt(Date.now());
            setAutosaveError(null);
            setRetryDelay(5000);
            // Clear any scheduled retry
            if (retryTimeoutRef.current) {
              window.clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
          },
          onError: (err: any) => {
            isSavingRef.current = false;
            setAutosaveStatus('error');
            setAutosaveError(err?.message || 'Autosave failed');
            // Schedule exponential backoff retry if still online
            if (!isOffline) {
              if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
              const nextDelay = Math.min(retryDelay * 2, 120000);
              retryTimeoutRef.current = window.setTimeout(() => {
                triggerAutosave();
              }, retryDelay);
              setRetryDelay(nextDelay);
            }
          },
        }
      );
    };
    // Save immediately and then every 30s
    saveLocal();
    triggerAutosave();
    autosaveRef.current = window.setInterval(() => {
      saveLocal();
      triggerAutosave();
    }, 30000);
    return () => {
      if (autosaveRef.current) window.clearInterval(autosaveRef.current);
      if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
      // Final local save on unmount
      try { localStorage.setItem(storageKey, JSON.stringify({ answers, timeLeft, updatedAt: Date.now() })); } catch {}
    };
  }, [attemptId, answers, timeLeft, isOffline, storageKey, autosaveMutation, exam?.duration]);

  if (isLoadingExam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Exam not found</p>
          <p className="text-sm text-muted-foreground mb-4">The exam you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/exams")}>Back to Exams</Button>
        </div>
      </div>
    );
  }

  const questions: Question[] = exam.questions || [];
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold mb-2">No questions available</p>
          <p className="text-sm text-muted-foreground mb-4">This exam has no questions. Please contact your administrator.</p>
          <Button onClick={() => setLocation("/exams")}>Back to Exams</Button>
        </div>
      </div>
    );
  }
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background select-none">
      <TopNav
        title={exam.title}
        subtitle={`${exam.subject} - ${exam.type.toUpperCase()}`}
        showGoBackButton={false}
      />

      {/* Timer and Progress Bar */}
      <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className={cn(
                  "w-5 h-5",
                  timeLeft && timeLeft <= 60 ? "text-destructive" : timeLeft && timeLeft < 600 ? "text-yellow-600" : "text-primary"
                )} />
                <span className={cn(
                  "text-lg font-semibold",
                  timeLeft && timeLeft <= 60 ? "text-destructive animate-pulse" : timeLeft && timeLeft < 600 ? "text-yellow-600" : ""
                )}>
                  {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </span>
              </div>
              <Badge variant="secondary">
                {answeredCount} / {questions.length} Answered
              </Badge>
            </div>
            {isOffline && (
              <div className="text-xs text-destructive flex items-center gap-1" role="alert" aria-live="assertive">
                <span className="inline-block w-2 h-2 bg-destructive rounded-full"></span>
                Offline: answers saved locally, timer paused.
              </div>
            )}
            <Button
              onClick={() => setShowSubmitDialog(true)}
              className="w-full sm:w-auto"
              variant="default"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Exam
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 sm:ml-2 mt-2 sm:mt-0 select-none">
                    {autosaveStatus === 'saving' && (
                      <Save className="w-4 h-4 text-muted-foreground animate-pulse" />
                    )}
                    {autosaveStatus === 'saved' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {autosaveStatus === 'error' && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {autosaveStatus === 'saving' && <span>Saving your progress…</span>}
                  {autosaveStatus === 'saved' && (
                    <span>Saved{lastSavedAt ? ` at ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}</span>
                  )}
                  {autosaveStatus === 'error' && (
                    <div>
                      <div className="font-medium text-destructive">Autosave failed</div>
                      <div className="text-xs opacity-80">Retrying in the background{autosaveError ? `: ${autosaveError}` : ''}</div>
                    </div>
                  )}
                  {autosaveStatus === 'idle' && <span>Autosave idle</span>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {showTenMinuteWarning && (
          <div className="mb-4 p-3 rounded-md border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950 text-sm text-yellow-800 dark:text-yellow-200" role="alert" aria-live="polite">
            <span className="font-medium">⏰ 10 minutes remaining.</span> Please review your answers and manage your time.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigator - Mobile: Bottom, Desktop: Side */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2" role="navigation" aria-label="Question navigation">
                  {questions.map((_, index) => {
                    const isAnswered = answers.hasOwnProperty(index);
                    const isMarked = markedForReview.has(index);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={cn(
                          "relative w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all touch-manipulation",
                          isCurrent && "ring-2 ring-primary ring-offset-2",
                          isAnswered && !isCurrent && "bg-primary text-primary-foreground",
                          !isAnswered && !isCurrent && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                        aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ''}${isMarked ? ', marked for review' : ''}${isCurrent ? ', current' : ''}`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {index + 1}
                        {isMarked && (
                          <Flag className="w-3 h-3 absolute -top-1 -right-1 text-destructive fill-destructive" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-secondary rounded"></div>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-destructive fill-destructive" />
                    <span>Marked for Review</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Display */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleMarkForReview}
                    className={cn(
                      markedForReview.has(currentQuestionIndex) && "bg-destructive/10 text-destructive"
                    )}
                  >
                    <Flag className={cn(
                      "w-4 h-4 mr-2",
                      markedForReview.has(currentQuestionIndex) && "fill-current"
                    )} />
                    {markedForReview.has(currentQuestionIndex) ? "Marked" : "Mark for Review"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentQuestion ? (
                  <>
                    <div className="prose max-w-none">
                      <p className="text-base leading-relaxed">{currentQuestion.question}</p>
                    </div>

                    <RadioGroup
                      value={answers[currentQuestionIndex] || ""}
                      onValueChange={handleAnswerChange}
                      className="space-y-3"
                      aria-label={`Answer options for question ${currentQuestionIndex + 1}`}
                    >
                      {currentQuestion.options?.map((option: string, i: number) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-start space-x-3 p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent touch-manipulation",
                            answers[currentQuestionIndex] === option && "border-primary bg-primary/5"
                          )}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleAnswerChange(String(option));
                            }
                          }}
                        >
                          <RadioGroupItem value={option} id={`option-${i}`} className="mt-1" aria-label={`Option ${i + 1}`} />
                          <Label
                            htmlFor={`option-${i}`}
                            className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t gap-2">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="flex-1 sm:flex-none touch-manipulation"
                        aria-label="Go to previous question"
                      >
                        <ArrowLeft className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="flex-1 sm:flex-none touch-manipulation"
                        aria-label="Go to next question"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ArrowRight className="w-4 h-4 sm:ml-2" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">No question available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Questions:</span>
              <span className="font-semibold">{questions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Answered:</span>
              <span className="font-semibold">{answeredCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Not Answered:</span>
              <span className="font-semibold text-destructive">{questions.length - answeredCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Marked for Review:</span>
              <span className="font-semibold">{markedForReview.size}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitConfirmed} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen required dialog */}
      <Dialog open={isFullscreenDialogOpen} onOpenChange={(open) => setIsFullscreenDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Fullscreen Required</DialogTitle>
            <DialogDescription>
              You exited fullscreen or blocked it. The exam is paused. Re-enter fullscreen to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleSubmitConfirmed}>
              Submit & Exit
            </Button>
            <Button onClick={enterFullscreen}>Re-enter Fullscreen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tab switch warning dialog */}
      <Dialog open={isTabSwitchDialogOpen} onOpenChange={(open) => setIsTabSwitchDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Focus Lost</DialogTitle>
            <DialogDescription>
              You switched tabs or minimized the window. The exam is paused. Resume in fullscreen to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleSubmitConfirmed}>
              Submit & Exit
            </Button>
            <Button onClick={enterFullscreen}>Resume Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
