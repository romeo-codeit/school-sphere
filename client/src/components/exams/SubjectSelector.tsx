import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type SubjectSelectorProps = {
  type: 'jamb' | 'waec' | 'neco';
  available: string[];
  value: string[];
  onChange: (subjects: string[]) => void;
  onConfirm?: () => void;
};

export function SubjectSelector({ type, available, value, onChange, onConfirm }: SubjectSelectorProps) {
  const toggle = (s: string) => {
    // Case-insensitive check
    const exists = value.some(v => v.toLowerCase() === s.toLowerCase());
    if (exists) {
      onChange(value.filter((x) => x.toLowerCase() !== s.toLowerCase()));
    } else {
      onChange([...value, s]);
    }
  };

  const normalizedAvailable = Array.from(new Set(available)).sort();

  const selectedCount = value.filter((v) => v.toLowerCase() !== 'english').length;
  const jambValid = type === 'jamb' ? value.some(v => v.toLowerCase() === 'english') && selectedCount === 3 : true;
  const otherValid = type !== 'jamb' ? value.length >= 1 : true;
  const isValid = type === 'jamb' ? jambValid : otherValid;

  return (
    <div className="space-y-3">
      {type === 'jamb' && (
        <div className="text-sm text-muted-foreground">English is mandatory and pre-selected.</div>
      )}
      <div className="flex flex-wrap gap-2">
        {normalizedAvailable.map((s) => {
          const selected = value.some(v => v.toLowerCase() === s.toLowerCase());
          const disabled = type === 'jamb' && s.toLowerCase() === 'english';
          return (
            <Badge
              key={s}
              variant={selected ? 'primary' : 'outline'}
              className={disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
              onClick={() => !disabled && toggle(s)}
            >
              {s}
            </Badge>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {type === 'jamb' ? (
          <span>
            Selected {selectedCount}/3 other subjects
          </span>
        ) : (
          <span>
            Selected {value.length} subject(s)
          </span>
        )}
        {onConfirm && <Button size="sm" disabled={!isValid} onClick={onConfirm}>Confirm</Button>}
      </div>
    </div>
  );
}
