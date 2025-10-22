import React from 'react';

export function ExamResults({ summary, perQuestion }: { summary: { total: number; correct: number; score: number; percent: number }; perQuestion: any[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-md border">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-xl font-semibold">{summary.total}</div>
        </div>
        <div className="p-3 rounded-md border">
          <div className="text-xs text-muted-foreground">Correct</div>
          <div className="text-xl font-semibold">{summary.correct}</div>
        </div>
        <div className="p-3 rounded-md border">
          <div className="text-xs text-muted-foreground">Score</div>
          <div className="text-xl font-semibold">{summary.score}</div>
        </div>
        <div className="p-3 rounded-md border">
          <div className="text-xs text-muted-foreground">Percent</div>
          <div className="text-xl font-semibold">{summary.percent.toFixed(1)}%</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="font-medium">Per-question</div>
        <ul className="text-sm space-y-1 max-h-64 overflow-auto modern-scrollbar">
          {perQuestion.map((q) => (
            <li key={q.questionNumber} className={`flex items-center justify-between p-2 rounded ${q.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <span>Q{q.questionNumber}</span>
              <span className="text-xs">Selected: {String(q.selected ?? '-')}, Correct: {String(q.correctAnswer ?? '-')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
