import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ExamModeSelector({ value, onChange }: { value: 'practice' | 'exam'; onChange: (v: 'practice' | 'exam') => void }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as any)}>
      <ToggleGroupItem value="practice">Practice</ToggleGroupItem>
      <ToggleGroupItem value="exam">Exam</ToggleGroupItem>
    </ToggleGroup>
  );
}
