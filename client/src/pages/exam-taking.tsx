import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Clock, Flag, ArrowLeft, ArrowRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  marks?: number;
  explanation?: string;
}

export default function ExamTaking() {
  const params = useParams();
  const examId = params.id;
  const { useExam } = useExams();
  const { data: exam, isLoading: isLoadingExam } = useExam(examId || "");
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

  // Start attempt when exam loads
  useEffect(() => {
    if (exam && !attemptId) {
      handleStartAttempt();
    }
  }, [exam, attemptId]);

  // Timer countdown
  useEffect(() => {
    if (exam?.duration && timeLeft === null) {
      setTimeLeft(exam.duration * 60); // Convert minutes to seconds
    }
  }, [exam, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleAutoSubmit();
    }
    if (!timeLeft || timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const handleStartAttempt = async () => {
    if (!examId) return;
    try {
      const attempt = await startAttempt(examId);
      setAttemptId(attempt.$id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start exam",
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
      toast({
        title: "Success",
        description: `Exam submitted! Score: ${result.score}/${result.totalQuestions}`,
      });
      setLocation("/exams");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit exam",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

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
          <Button onClick={() => setLocation("/exams")}>Back to Exams</Button>
        </div>
      </div>
    );
  }

  const questions: Question[] = exam.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
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
                  timeLeft && timeLeft < 300 ? "text-destructive" : "text-primary"
                )} />
                <span className={cn(
                  "text-lg font-semibold",
                  timeLeft && timeLeft < 300 ? "text-destructive" : ""
                )}>
                  {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </span>
              </div>
              <Badge variant="secondary">
                {answeredCount} / {questions.length} Answered
              </Badge>
            </div>
            <Button
              onClick={() => setShowSubmitDialog(true)}
              className="w-full sm:w-auto"
              variant="default"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Exam
            </Button>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigator - Mobile: Bottom, Desktop: Side */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const isAnswered = answers.hasOwnProperty(index);
                    const isMarked = markedForReview.has(index);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={cn(
                          "relative w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all",
                          isCurrent && "ring-2 ring-primary ring-offset-2",
                          isAnswered && !isCurrent && "bg-primary text-primary-foreground",
                          !isAnswered && !isCurrent && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                      >
                        {index + 1}
                        {isMarked && (
                          <Flag className="w-3 h-3 absolute -top-1 -right-1 text-destructive fill-destructive" />
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
                    >
                      {currentQuestion.options?.map((option: string, i: number) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent",
                            answers[currentQuestionIndex] === option && "border-primary bg-primary/5"
                          )}
                        >
                          <RadioGroupItem value={option} id={`option-${i}`} className="mt-1" />
                          <Label
                            htmlFor={`option-${i}`}
                            className="flex-1 cursor-pointer text-sm leading-relaxed"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={currentQuestionIndex === questions.length - 1}
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
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
    </div>
  );
}
