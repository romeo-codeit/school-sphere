import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useExams } from "@/hooks/useExams";
import { useExamAttempts } from "@/hooks/useExamAttempts";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ExamTaking() {
  const params = useParams();
  const examId = params.id;
  const { useExam } = useExams();
  const { data: exam, isLoading: isLoadingExam } = useExam(examId);
  const { createExamAttempt } = useExamAttempts();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    if (exam?.duration && !examStarted) {
      setTimeLeft(exam.duration * 60);
    }
  }, [exam, examStarted]);

  useEffect(() => {
    if (!examStarted || timeLeft === 0) {
      if (timeLeft === 0) handleSubmit();
      return;
    }
    if (!timeLeft) return;
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, examStarted]);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = async () => {
    if (!exam || !user) return;

    let score = 0;
    let correctAnswers = 0;
    exam.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correctAnswer) {
        score += q.marks || 1;
        correctAnswers++;
      }
    });

    try {
      await createExamAttempt({
        examId: exam.$id,
        studentId: user.$id,
        answers,
        score,
        totalQuestions: exam.questions.length,
        correctAnswers,
        timeSpent: exam.duration - Math.floor(timeLeft / 60),
        completedAt: new Date().toISOString(),
      });
      toast({ title: "Success", description: "Exam submitted successfully." });
      setLocation("/exams");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoadingExam) {
    return <div className="p-6">Loading exam...</div>;
  }

  if (!exam) {
    return <div className="p-6">Exam not found.</div>;
  }

  if (!examStarted) {
    return (
      <div className="space-y-6">
        <TopNav title={exam.title} subtitle={exam.subject} />
        <div className="p-6 flex items-center justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Exam Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><strong>Subject:</strong> {exam.subject}</p>
              <p><strong>Duration:</strong> {exam.duration} minutes</p>
              <p><strong>Total Questions:</strong> {exam.questions.length}</p>
              <p className="pt-4">Please read all questions carefully. The timer will start as soon as you click the "Start Exam" button. Good luck!</p>
              <Button onClick={() => setExamStarted(true)} className="w-full mt-4">Start Exam</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopNav title={exam.title} subtitle={exam.subject}>
        {timeLeft !== null && (
          <div className="text-lg font-medium">
            Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </TopNav>

      <div className="p-6 space-y-6">
        {exam.questions.map((q: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Question {index + 1} ({q.marks || 1} Marks)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{q.question}</p>
              <RadioGroup onValueChange={(value) => handleAnswerChange(index, value)}>
                {q.options.map((option: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`q${index}o${i}`} />
                    <Label htmlFor={`q${index}o${i}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <Button onClick={handleSubmit} className="w-full">
          Submit Exam
        </Button>
      </div>
    </div>
  );
}
