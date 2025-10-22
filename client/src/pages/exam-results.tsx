import { useParams, useLocation } from "wouter";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAttemptResults } from "@/hooks/useCBT";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";

export default function ExamResultsPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const { data, isLoading, error } = useAttemptResults(attemptId);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Show error toast once
  useEffect(() => {
    if (error) {
      const message = (error as any)?.message || 'Failed to load results';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  }, [error, toast]);

  const percent = Math.round((Number((data as any)?.summary?.percentage ?? (data as any)?.summary?.percent ?? 0)));

  return (
    <div className="min-h-screen bg-background">
      <TopNav title="Exam Results" subtitle={`Attempt ${attemptId}`} showGoBackButton={true} />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
              </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                <div>
                  <div className="text-4xl font-bold">{percent}%</div>
                  <div className="text-sm text-muted-foreground">Percent</div>
                </div>
                <div>
                  <div className="text-lg font-medium">
                    {data?.summary?.correct} / {data?.summary?.total} correct
                  </div>
                  <Progress value={Math.min(100, Math.max(0, Number(data?.summary?.percent || 0) ))} className="mt-2" />
                </div>
                <div className="flex gap-3 sm:justify-end items-center">
                  { (data?.summary as any)?.standardized && (
                    <Badge variant="secondary">
                      {((data?.summary as any).standardized as any).system}: {((data?.summary as any).standardized as any).score}/{((data?.summary as any).standardized as any).total}
                    </Badge>
                  )}
                  <Button variant="outline" onClick={() => navigate('/exams')}>Back to Exams</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Per-question breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 w-full bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.perQuestion?.length ? (
                  data.perQuestion.map((q: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <div className="text-sm">
                          <div className="font-medium">Question {q.questionNumber ?? idx + 1}</div>
                          <div className="text-xs text-muted-foreground">
                            Your answer: <Badge variant={q.isCorrect ? 'secondary' : 'destructive'}>{String(q.selected ?? '—')}</Badge>
                            <span className="mx-2">•</span>
                            Correct: <Badge variant="secondary">{String(q.correctAnswer)}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No question details available.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
