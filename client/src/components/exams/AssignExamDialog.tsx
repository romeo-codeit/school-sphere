import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/use-toast';
import { useExamAssignments } from '@/hooks/useExamAssignments';

type Props = {
  examId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssignExamDialog({ examId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { assign } = useExamAssignments(examId);
  const [classIds, setClassIds] = useState<string>('');
  const [studentIds, setStudentIds] = useState<string>('');
  const [classOpen, setClassOpen] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const { classes } = useClasses();
  const { students } = useStudents({ limit: 50, page: 1, enabled: open });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onAssign = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        classIds: classIds.split(',').map(s => s.trim()).filter(Boolean),
        studentIds: studentIds.split(',').map(s => s.trim()).filter(Boolean),
      };
      await assign(payload);
      toast({ title: 'Assigned', description: 'Exam assignment updated.' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to assign exam', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setClassIds('');
      setStudentIds('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Exam</DialogTitle>
          <DialogDescription>
            Enter comma-separated IDs to assign this exam to classes and/or specific students.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Assign to Classes</div>
            <Popover open={classOpen} onOpenChange={setClassOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={classOpen} className="w-full justify-between">
                  {classIds ? `${classIds.split(',').length} selected` : 'Select classes...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search classes..." />
                  <CommandList>
                    <CommandEmpty>No classes found.</CommandEmpty>
                    <CommandGroup>
                      {(classes || []).map((c: any) => {
                        const selected = classIds.split(',').includes(c.$id);
                        return (
                          <CommandItem key={c.$id} value={c.$id} onSelect={() => {
                            const parts = classIds ? classIds.split(',').filter(Boolean) : [];
                            const next = selected ? parts.filter((p: string) => p !== c.$id) : [...parts, c.$id];
                            setClassIds(next.join(','));
                          }}>
                            <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{c.name || c.$id}</div>
                              <div className="text-xs text-muted-foreground">{c.$id}</div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {classIds && (
              <div className="flex flex-wrap gap-2 mt-2">
                {classIds.split(',').filter(Boolean).map((id) => (
                  <Badge key={id} variant="secondary">{id}</Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Assign to Students</div>
            <Popover open={studentOpen} onOpenChange={setStudentOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={studentOpen} className="w-full justify-between">
                  {studentIds ? `${studentIds.split(',').length} selected` : 'Select students...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search students..." />
                  <CommandList>
                    <CommandEmpty>No students found.</CommandEmpty>
                    <CommandGroup>
                      {(students || []).map((s: any) => {
                        const label = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.$id;
                        const selected = studentIds.split(',').includes(s.$id);
                        return (
                          <CommandItem key={s.$id} value={s.$id} onSelect={() => {
                            const parts = studentIds ? studentIds.split(',').filter(Boolean) : [];
                            const next = selected ? parts.filter((p: string) => p !== s.$id) : [...parts, s.$id];
                            setStudentIds(next.join(','));
                          }}>
                            <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{label}</div>
                              <div className="text-xs text-muted-foreground">{s.$id}</div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {studentIds && (
              <div className="flex flex-wrap gap-2 mt-2">
                {studentIds.split(',').filter(Boolean).map((id) => (
                  <Badge key={id} variant="secondary">{id}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onAssign} disabled={isSubmitting}>{isSubmitting ? 'Assigning…' : 'Assign'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
