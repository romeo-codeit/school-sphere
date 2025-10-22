import { useState, useEffect, useRef, useCallback } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useExams } from "@/hooks/useExams";
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { LocalCache } from '@/lib/localCache';
import { getAnswers, setAnswers as setAnswersCache, getMeta, setMeta } from '@/lib/idbCache';
import { useExamAttempts } from "@/hooks/useExamAttempts";
import { useAutosaveAttempt } from "@/hooks/useCBT";
import { useToast } from "@/hooks/use-toast";
import { Clock, Flag, ArrowLeft, ArrowRight, Send, ShieldAlert, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamTakingSkeleton } from "@/components/skeletons/exam-taking-skeleton";
import { Loader2, BookOpen } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  marks?: number;
  explanation?: string;
  imageUrl?: string;
  answerUrl?: string;
}

export default function ExamTaking() {
  const params = useParams();
  const examId = params.id || params.type; // Support both /exams/:id/take and /exams/practice/:type
  const practiceType = params.type; // Will be set for practice routes
  const [searchParams] = useState(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));
  const subjects = searchParams.get('subjects')?.split(',') || [];
  const year = searchParams.get('year') || undefined;
  const rawPaperType = searchParams.get('paperType');
  const paperType = (rawPaperType === 'obj' ? 'objective' : rawPaperType) as ('objective' | 'theory' | undefined);

  // Progressive loading state
  const [loadedQuestions, setLoadedQuestions] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const QUESTIONS_BATCH_SIZE = 20; // Load 20 questions at a time

  const { useExam } = useExams();
  // For practice sessions, pass subjects to fetch the right questions
  const examFetchId = practiceType ? `practice-${practiceType}` : (examId || '');
  const examUrl = practiceType && subjects.length > 0
    ? `${examFetchId}?subjects=${subjects.join(',')}${year ? `&year=${encodeURIComponent(year)}` : ''}${paperType ? `&paperType=${encodeURIComponent(paperType)}` : ''}`
    : examFetchId;
  const { data: exam, isLoading: isLoadingExam } = useExam(examUrl);

  // In-memory cache helps to avoid rehydrating from localStorage many times
  const examCache = useRef<LocalCache<any> | null>(null);
  if (!examCache.current) examCache.current = new LocalCache<any>(20);
  
  const { startAttempt, submitAttempt } = useExamAttempts();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Simplified Security & Fullscreen
  const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false);
  const [isTabSwitchDialogOpen, setIsTabSwitchDialogOpen] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState(0);
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
  // Reduce backend writes on free tier: only autosave when answers changed or heartbeat interval elapses
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const heartbeatLastSentRef = useRef<number>(0);
  const HEARTBEAT_INTERVAL_MS = 120000; // 2 minutes
  const [showReference, setShowReference] = useState(false);
  const [referenceHtml, setReferenceHtml] = useState<string | null>(null);
  const [loadingReference, setLoadingReference] = useState(false);
  const SCHEMA_VERSION = 1;
  const { debounced: debouncedSave, cancel: cancelDebounced } = useDebouncedCallback(async (payload: any) => {
    await setMeta('answers_version', SCHEMA_VERSION);
    await setAnswersCache(storageKey, payload);
  }, 2000);

  // Progressive loading: Initialize loaded questions when exam loads
  useEffect(() => {
    if (!exam) return;
    const key = storageKey;
    const hydrate = async () => {
      // Try in-memory cache first, then IndexedDB
      const inMem = examCache.current?.get(key);
      if (inMem && Array.isArray(inMem.loadedQuestions)) {
        setLoadedQuestions(inMem.loadedQuestions);
        setHasMoreQuestions(inMem.hasMoreQuestions ?? (exam.questions?.length > (inMem.loadedQuestions?.length || 0)));
        return;
      }
      const meta = await getMeta('answers_version');
      if (meta === SCHEMA_VERSION) {
        const saved = await getAnswers(key);
        if (saved && Array.isArray(saved.loadedQuestions) && saved.loadedQuestions.length > 0) {
          setLoadedQuestions(saved.loadedQuestions.slice(0, QUESTIONS_BATCH_SIZE));
          setHasMoreQuestions((exam.questions?.length || 0) > QUESTIONS_BATCH_SIZE);
          examCache.current?.set(key, { loadedQuestions: saved.loadedQuestions, hasMoreQuestions: saved.hasMoreQuestions });
          return;
        }
      }
      if (exam?.questions && exam.questions.length > 0) {
        const initialBatch = exam.questions.slice(0, QUESTIONS_BATCH_SIZE);
        setLoadedQuestions(initialBatch);
        setHasMoreQuestions(exam.questions.length > QUESTIONS_BATCH_SIZE);
        examCache.current?.set(key, { loadedQuestions: initialBatch, hasMoreQuestions: exam.questions.length > QUESTIONS_BATCH_SIZE });
      }
    };
    hydrate();
  }, [exam]);

  // Function to load more questions progressively
  const loadMoreQuestions = useCallback(async () => {
    if (!exam?.questions || isLoadingMore || !hasMoreQuestions) return;

    setIsLoadingMore(true);

    // Simulate async loading (in real implementation, this could fetch from server)
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentLoaded = loadedQuestions.length;
    const nextBatch = exam.questions.slice(currentLoaded, currentLoaded + QUESTIONS_BATCH_SIZE);

    const newLoaded = [...loadedQuestions, ...nextBatch];
    setLoadedQuestions(newLoaded);
    const more = currentLoaded + nextBatch.length < exam.questions.length;
    setHasMoreQuestions(more);
    // update in-memory + localStorage cache with combined loaded questions
    try {
      const key = storageKey;
      examCache.current?.set(key, { loadedQuestions: newLoaded, hasMoreQuestions: more });
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(key, JSON.stringify({ ...parsed, loadedQuestions: newLoaded, hasMoreQuestions: more, updatedAt: Date.now() }));
    } catch {}
    setIsLoadingMore(false);
  }, [exam, loadedQuestions.length, isLoadingMore, hasMoreQuestions]);

  // Auto-load more questions when approaching the end of current batch
  useEffect(() => {
    if (!exam?.questions || !hasMoreQuestions || isLoadingMore) return;

    const remainingInBatch = loadedQuestions.length - currentQuestionIndex;
    if (remainingInBatch <= 5) { // Load more when 5 or fewer questions remain
      loadMoreQuestions();
    }
  }, [currentQuestionIndex, loadedQuestions.length, hasMoreQuestions, isLoadingMore, loadMoreQuestions, exam]);

  // Subject filtering state - must be declared before any conditional returns
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // Calculate subjects in exam - safe to do early since it handles undefined/empty
  const questions: Question[] = loadedQuestions;
  const subjectsInExam = Array.from(new Set(questions.map((q: any) => String(q.subject || '').trim()).filter(Boolean)));

  // Set initial active subject if not already set - must be at top level
  useEffect(() => {
    if (subjectsInExam.length > 0 && !activeSubject) {
      setActiveSubject(subjectsInExam[0]);
    }
  }, [subjectsInExam.join(','), activeSubject]); // Use join to avoid array reference changes

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
    // Prefer restored timeLeft from IndexedDB if available
    const restore = async () => {
      try {
        const meta = await getMeta('answers_version');
        if (meta === SCHEMA_VERSION) {
          const key = attemptId ? `cbt:attempt:${attemptId}` : (examId ? `cbt:exam:${encodeURIComponent(String(examId))}` : 'cbt:exam:unknown');
          const saved = await getAnswers(key);
          if (saved && typeof saved.timeLeft === 'number' && saved.timeLeft > 0) {
            setTimeLeft(saved.timeLeft);
            return;
          }
        }
      } catch {}
      setTimeLeft(Math.max(1, Math.floor(Number(exam.duration) || 0) * 60)); // Convert minutes to seconds, guard
    };
    restore();
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
    if (!examId && !practiceType) return;
    try {
      // For practice sessions, pass subjects and other parameters
      const attemptExamId = practiceType ? `practice-${practiceType}` : String(examId);
      const attemptData: any = { examId: attemptExamId };
      if (practiceType && subjects.length > 0) {
        attemptData.subjects = subjects;
        if (year) attemptData.year = year;
        if (paperType) attemptData.paperType = paperType;
      }
      
      const attempt = await startAttempt(attemptData);
      setAttemptId(attempt.$id);
      // Enforce fullscreen upon attempt start
      await enterFullscreen();
    } catch (error: any) {
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
    if (currentQuestionIndex < loadedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (hasMoreQuestions && !isLoadingMore) {
      // Load more questions if we're at the end of current batch
      loadMoreQuestions().then(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      });
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

  const fetchReference = async (url?: string) => {
    if (!url) return;
    setLoadingReference(true);
    setShowReference(true);
    try {
      const res = await fetch(`/api/answers/fetch?u=${encodeURIComponent(url)}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data?.html) {
        setReferenceHtml(data.html);
      } else {
        setReferenceHtml('<div class="text-sm text-muted-foreground">Reference not available.</div>');
      }
    } catch {
      setReferenceHtml('<div class="text-sm text-muted-foreground">Failed to load reference.</div>');
    } finally {
      setLoadingReference(false);
    }
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
        setSecurityWarnings(prev => prev + 1);
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
        setSecurityWarnings(prev => prev + 1);
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
      
      const currentQ = exam?.questions?.[currentQuestionIndex];
      const opts = (currentQ?.options as string[] | undefined) || [];
      const isTheory = !opts || opts.length === 0;
      
      // Numbers 1-4 => pick option (if exists and not theory)
      if (e.key >= '1' && e.key <= '4') {
        if (!isTheory && opts[parseInt(e.key, 10) - 1]) {
          const idx = parseInt(e.key, 10) - 1;
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

  const storageKey = attemptId ? `cbt:attempt:${attemptId}` : (examId ? `cbt:exam:${encodeURIComponent(String(examId))}` : 'cbt:exam:unknown');

  // Restore from localStorage once when exam is ready
  useEffect(() => {
    if (!exam) return;
    if (hasRestoredRef.current) return;
    const hydrate = async () => {
      const meta = await getMeta('answers_version');
      if (meta === SCHEMA_VERSION) {
        const saved = await getAnswers(storageKey);
        if (saved && typeof saved === 'object') {
          if (saved.answers && typeof saved.answers === 'object') {
            setAnswers((prev) => ({ ...prev, ...saved.answers }));
          }
          if (saved.answers && Object.keys(saved.answers).length > 0) {
            toast({ title: 'Restored progress', description: 'Recovered unsaved answers from this device.' });
          }
        }
      }
      hasRestoredRef.current = true;
    };
    hydrate();
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
      // Local save (debounced)
      try {
        debouncedSave({ answers, timeLeft, updatedAt: Date.now(), loadedQuestions });
      } catch {}
    };
    const stableStringify = (obj: any) => {
      try {
        const keys = Object.keys(obj || {}).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const out: Record<string, any> = {};
        for (const k of keys) out[k] = (obj as any)[k];
        return JSON.stringify(out);
      } catch {
        return JSON.stringify(obj || {});
      }
    };

    const triggerAutosave = () => {
      if (!attemptId || isOffline) return;
      if (isSavingRef.current) return; // avoid concurrent autosaves
      // Compute time spent from timer
      const totalSec = (exam?.duration ? exam.duration * 60 : 0);
      const timeSpent = totalSec && typeof timeLeft === 'number' ? Math.max(0, totalSec - timeLeft) : 0;

      // Only autosave when answers changed since last save, or at heartbeat interval
      const signature = stableStringify(answers);
      const now = Date.now();
      const heartbeatDue = now - (heartbeatLastSentRef.current || 0) >= HEARTBEAT_INTERVAL_MS;
      const answersChanged = signature !== lastSavedSnapshotRef.current;
      if (!answersChanged && !heartbeatDue) return;

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
            // Update change signature and heartbeat
            lastSavedSnapshotRef.current = signature;
            heartbeatLastSentRef.current = now;
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
      // Final local save on unmount (IndexedDB)
  try { cancelDebounced(); setAnswersCache(storageKey, { answers, timeLeft, updatedAt: Date.now(), loadedQuestions }); } catch {}
    };
  }, [attemptId, answers, timeLeft, isOffline, storageKey, autosaveMutation, exam?.duration]);

  if (isLoadingExam) {
    return <ExamTakingSkeleton />;
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
  
  // Questions are already defined at the top, now we can safely use them
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
  
  const filteredQuestions = activeSubject ? questions.filter((q: any) => String(q.subject || '') === activeSubject) : questions;
  const currentFilteredQuestion = filteredQuestions[currentQuestionIndex] || null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background select-none">
      <TopNav
        title={exam.title}
        subtitle={`${exam.subject} - ${exam.type.toUpperCase()}`}
        showGoBackButton={false}
      />

      {/* Timer and Progress Bar - Mobile Optimized */}
      <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
            {/* Top Row: Timer and Stats */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Clock className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5",
                    timeLeft && timeLeft <= 60 ? "text-destructive" : timeLeft && timeLeft < 600 ? "text-yellow-600" : "text-primary"
                  )} />
                  <span className={cn(
                    "text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap",
                    timeLeft && timeLeft <= 60 ? "text-destructive animate-pulse" : timeLeft && timeLeft < 600 ? "text-yellow-600" : ""
                  )}>
                    {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs sm:text-sm whitespace-nowrap">
                  {answeredCount} / {questions.length}
                </Badge>
              </div>

              {/* Alert Messages */}
              <div className="flex flex-col gap-1 items-end">
                {isOffline && (
                  <div className="text-xs text-destructive flex items-center gap-1" role="alert" aria-live="assertive">
                    <span className="inline-block w-2 h-2 bg-destructive rounded-full"></span>
                    Offline - Saving locally
                  </div>
                )}
                {securityWarnings > 0 && (
                  <div className="text-xs text-yellow-600 flex items-center gap-1" role="alert" aria-live="assertive">
                    <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full"></span>
                    {securityWarnings} warning{securityWarnings > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Row - Mobile full width */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                onClick={() => setShowExitDialog(true)}
                className="w-full sm:w-auto sm:flex-1 text-xs sm:text-sm h-8 sm:h-10"
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Exit
              </Button>
              <Button
                onClick={() => setShowSubmitDialog(true)}
                className="w-full sm:w-auto sm:flex-1 text-xs sm:text-sm h-8 sm:h-10"
                variant="default"
                size="sm"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Submit Exam
              </Button>
              
              {/* Autosave Status */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 select-none">
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
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {showTenMinuteWarning && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-md border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950 text-xs sm:text-sm text-yellow-800 dark:text-yellow-200" role="alert" aria-live="polite">
            <span className="font-medium">⏰ 10 minutes remaining.</span> Please review your answers.
          </div>
        )}
        <div className="max-w-4xl mx-auto">
          {/* Subject Switcher (JAMB) - Mobile Optimized */}
          {practiceType === 'jamb' && subjectsInExam.length > 0 && (
            <Card className="mb-3 sm:mb-4 shadow-sm">
              <CardContent className="p-2 sm:p-3">
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {subjectsInExam.map((subj) => (
                    <button
                      key={subj}
                      onClick={() => { setActiveSubject(subj); setCurrentQuestionIndex(0); }}
                      className={cn(
                        "px-2 sm:px-3 py-1 rounded border text-xs sm:text-sm whitespace-nowrap touch-manipulation",
                        activeSubject === subj ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 border-border"
                      )}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Display - Mobile-First CBT Layout */}
          <div>
            <Card className="shadow-sm">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <CardTitle className="text-sm sm:text-base md:text-lg">
                    Question {currentQuestionIndex + 1} of {exam?.questionCount || filteredQuestions.length}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Question Type Badge */}
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {Array.isArray(currentFilteredQuestion?.options) && currentFilteredQuestion.options.length > 0 ? 'Objective' : 'Theory'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleMarkForReview}
                      className={cn(
                        "text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 touch-manipulation",
                        markedForReview.has(currentQuestionIndex) && "bg-destructive/10 text-destructive"
                      )}
                    >
                      <Flag className={cn(
                        "w-3 h-3 sm:w-4 sm:h-4 sm:mr-1",
                        markedForReview.has(currentQuestionIndex) && "fill-current"
                      )} />
                      <span className="hidden sm:inline">
                        {markedForReview.has(currentQuestionIndex) ? "Marked" : "Mark"}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                {currentFilteredQuestion ? (
                  <>
                    <div className="text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium text-foreground">{currentFilteredQuestion.question}</div>

                    {/* Question Image - Responsive */}
                    {currentFilteredQuestion.imageUrl && (
                      <div className="my-3 sm:my-4 flex justify-center">
                        <img
                          src={currentFilteredQuestion.imageUrl}
                          alt="Question illustration"
                          className="w-full max-w-full sm:max-w-md md:max-w-lg max-h-48 sm:max-h-64 object-contain rounded-lg border shadow-sm"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Objective (options) vs Theory (no options) - Mobile Touch Optimized */}
                    {Array.isArray(currentFilteredQuestion.options) && currentFilteredQuestion.options.length > 0 ? (
                      <RadioGroup
                        value={answers[currentQuestionIndex] || ""}
                        onValueChange={handleAnswerChange}
                        className="space-y-2 sm:space-y-3"
                        aria-label={`Answer options for question ${currentQuestionIndex + 1}`}
                      >
                        {currentFilteredQuestion.options.map((option: string, i: number) => (
                          <div
                            key={i}
                            className={cn(
                              "flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent touch-manipulation active:scale-[0.98]",
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
                            <RadioGroupItem value={option} id={`option-${i}`} className="mt-0.5 sm:mt-1 shrink-0" aria-label={`Option ${i + 1}`} />
                            <Label
                              htmlFor={`option-${i}`}
                              className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed text-foreground"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2" aria-live="polite">
                        <div className="text-xs sm:text-sm text-muted-foreground">Theory response</div>
                        <textarea
                          value={String(answers[currentQuestionIndex] ?? '')}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          className="w-full min-h-[120px] sm:min-h-[150px] p-2 sm:p-3 border rounded-md bg-background resize-y text-sm sm:text-base"
                          placeholder="Type your answer here..."
                        />
                      </div>
                    )}

                    {/* Answer reference: inline viewer - Mobile Optimized */}
                    {currentFilteredQuestion.answerUrl && (
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchReference(currentFilteredQuestion.answerUrl)}
                          disabled={loadingReference}
                          className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 touch-manipulation"
                        >
                          {loadingReference ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />}
                          <span className="hidden sm:inline">{showReference ? 'Reload Reference' : 'View Reference'}</span>
                          <span className="sm:hidden">{showReference ? 'Reload' : 'Reference'}</span>
                        </Button>
                      </div>
                    )}

                    {/* Navigation Buttons - Mobile Full Width */}
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="flex-1 sm:flex-none touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
                        aria-label="Go to previous question"
                        size="sm"
                      >
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={currentQuestionIndex === filteredQuestions.length - 1 && !hasMoreQuestions}
                        className="flex-1 sm:flex-none touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
                        aria-label="Go to next question"
                        size="sm"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Loading...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Next</span>
                            <span className="sm:hidden">Next</span>
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">No question available</p>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Inline Reference Panel - Mobile Optimized */}
          {showReference && (
            <div className="mt-3 sm:mt-4">
              <Card className="shadow-sm">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base">Reference Answer</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  {loadingReference ? (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      Loading reference...
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert overflow-auto modern-scrollbar text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: referenceHtml || '<div class="text-sm text-muted-foreground">No reference content.</div>' }} />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog - Mobile Optimized */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Submit Exam?</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to submit your exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 sm:py-4 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Total Questions:</span>
              <span className="font-semibold">{questions.length}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Answered:</span>
              <span className="font-semibold">{answeredCount}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Not Answered:</span>
              <span className="font-semibold text-destructive">{questions.length - answeredCount}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Marked for Review:</span>
              <span className="font-semibold">{markedForReview.size}</span>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={isSubmitting} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
              Cancel
            </Button>
            <Button onClick={handleSubmitConfirmed} disabled={isSubmitting} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Exam Dialog - Mobile Optimized */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Exit Exam?</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to exit the exam? Your progress will be saved, but you may lose remaining time.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 sm:py-4 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Progress:</span>
              <span className="font-semibold">{answeredCount} / {questions.length} answered</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Time Remaining:</span>
              <span className="font-semibold">{formatTime(timeLeft || 0)}</span>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowExitDialog(false)} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
              Continue Exam
            </Button>
            <Button variant="destructive" onClick={() => setLocation('/exams')} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
              Exit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen required dialog - Mobile Optimized */}
      <Dialog open={isFullscreenDialogOpen} onOpenChange={(open) => setIsFullscreenDialogOpen(open)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg"><ShieldAlert className="w-4 h-4" /> Fullscreen Required</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              You exited fullscreen or blocked it. The exam is paused. Re-enter fullscreen to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSubmitConfirmed} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
              Submit & Exit
            </Button>
            <Button onClick={enterFullscreen} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">Re-enter Fullscreen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tab switch warning dialog - Mobile Optimized */}
      <Dialog open={isTabSwitchDialogOpen} onOpenChange={(open) => setIsTabSwitchDialogOpen(open)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg"><ShieldAlert className="w-4 h-4" /> Focus Lost</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              You switched tabs or minimized the window. The exam is paused. Resume in fullscreen to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSubmitConfirmed} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
              Submit & Exit
            </Button>
            <Button onClick={enterFullscreen} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">Resume Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
