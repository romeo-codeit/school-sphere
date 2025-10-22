import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SubjectSelector } from './SubjectSelector';
import { useAvailableSubjects, useAvailableYears, useYearAvailability, useValidateSubjects } from '@/hooks/useCBT';
import { AlertCircle, Loader2, Calendar, CheckCircle, Info, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SubjectSelectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examType: 'jamb' | 'waec' | 'neco' | 'internal';
  onConfirm: (selectedSubjects: string[], extras?: { year?: string; paperType?: 'objective' | 'theory' }) => void;
};

export function SubjectSelectionDialog({ open, onOpenChange, examType, onConfirm }: SubjectSelectionDialogProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [year, setYear] = useState<string>('');
  const [paperType, setPaperType] = useState<'objective' | 'theory'>('objective');

  const { data: subjectsData, isLoading: loadingSubjects } = useAvailableSubjects(examType, (examType === 'waec' || examType === 'neco') ? paperType : undefined, open);
  // For standardized exams we want years available across all selected subjects (union)
  const subjParam = selectedSubjects.join(',');
  const { data: yearsData, isLoading: loadingYears } = useAvailableYears(
    examType,
    subjParam,
    open && ['jamb', 'waec', 'neco'].includes(examType),
    (examType === 'waec' || examType === 'neco') ? paperType : undefined
  );
  const { data: yearAvailabilityData, isLoading: loadingAvailability } = useYearAvailability(
    examType, 
    subjParam, 
    open && ['jamb', 'waec', 'neco'].includes(examType) && selectedSubjects.length > 0,
    (examType === 'waec' || examType === 'neco') ? paperType : undefined
  );
  const validateMutation = useValidateSubjects();

  const available: string[] = Array.isArray(subjectsData?.subjects)
    ? (typeof subjectsData!.subjects[0] === 'string'
      ? (subjectsData!.subjects as unknown as string[])
      : (subjectsData!.subjects as any[]).map((x) => x.subject))
    : [];

  // Auto-select English for JAMB when dialog opens and subjects load
  useEffect(() => {
    
    if (open && examType === 'jamb' && available.length > 0 && !initialized) {
      // Look for English with flexible matching
      // Database has: "English Language" or "EnglishLanguage"
      let english = available.find(s => {
        const lower = s.toLowerCase();
        return lower === 'english' || 
               lower === 'english language' || 
               lower === 'englishlanguage' ||
               lower.startsWith('english');
      });
      
      if (english) {
        setSelectedSubjects([english]);
      }
      setInitialized(true);
    }
    
    // Reset when dialog closes
    if (!open) {
      setSelectedSubjects([]);
      setError('');
      setValidationResult(null);
      setInitialized(false);
      setYear('');
      setPaperType('objective');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, examType, available.length, initialized, loadingSubjects]);

  // Reset validation result when subjects or year change
  useEffect(() => {
    if (validationResult) {
      setValidationResult(null);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjects, year]);

  const handleConfirm = async () => {
    setError('');
    setValidationResult(null);
    
    // Validate year selection for standardized exams
    if (['jamb', 'waec', 'neco'].includes(examType) && !year) {
      setError('Please select an exam year');
      return;
    }
    
    try {
      const result = await validateMutation.mutateAsync({ type: examType, selectedSubjects, year });
      
      // Store result and proceed even with partial availability
      setValidationResult(result);
      
      if (result.available === 0) {
        setError(result.message || 'No subjects available for the selected year');
        return;
      }
      
      // If some subjects are missing, show a warning but allow proceeding
      if (result.insufficient && result.insufficient.length > 0) {
        setError(`⚠️ ${result.message || 'Some subjects unavailable'}. The exam will include only available subjects.`);
        // Don't return - allow user to see the message and decide
        return; // Actually, let's require them to confirm by clicking again
      }
      
      // All good, proceed
  onConfirm(selectedSubjects, { year, paperType: (examType === 'waec' || examType === 'neco') ? paperType : undefined });
      onOpenChange(false);
    } catch (err: any) {
      const errorMsg = err?.message || 'Validation failed';
      setError(errorMsg);
    }
  };

  const handleProceed = () => {
    if (validationResult && validationResult.available > 0) {
  onConfirm(selectedSubjects, { year, paperType: (examType === 'waec' || examType === 'neco') ? paperType : undefined });
      onOpenChange(false);
      setError('');
      setValidationResult(null);
    }
  };

  const handleCancel = () => {
    setSelectedSubjects([]);
    setYear('');
    setError('');
    setValidationResult(null);
    onOpenChange(false);
  };

  // Internal exams typically don't require subject selection
  if (examType === 'internal') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Start Internal Exam</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-2">
              This is an internal exam. No subject selection required.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto text-sm" size="sm">Cancel</Button>
            <Button onClick={() => { onConfirm([]); onOpenChange(false); }} className="w-full sm:w-auto text-sm" size="sm">Start Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-hidden flex flex-col gap-0 p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Modern Header with Gradient */}
        <div className="relative px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                {examType.toUpperCase()} Practice Session
                <Badge variant="outline" className="text-xs font-normal">
                  {examType === 'jamb' ? '4 Subjects' : 'Multi-subject'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                {examType === 'jamb'
                  ? 'English is pre-selected. Choose 3 more subjects to begin.'
                  : 'Select your subjects and exam year to start practicing.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6 modern-scrollbar">
          {/* Year Selection - Modern Card Style */}
          {['jamb', 'waec', 'neco'].includes(examType) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="year-select" className="text-sm sm:text-base font-semibold">Exam Year</Label>
                  {selectedSubjects.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">Showing availability for your selected subjects</p>
                  )}
                </div>
              </div>

              {loadingYears || loadingAvailability ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-dashed">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading available years...
                </div>
              ) : yearsData?.years?.length ? (
                <div className="space-y-3">
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year-select" className="h-11 sm:h-12 w-full bg-background hover:bg-muted/50 transition-colors">
                      <SelectValue placeholder="Choose a year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearsData.years
                        .sort((a, b) => parseInt(b) - parseInt(a))
                        .map((y) => {
                          const availInfo = yearAvailabilityData?.availability?.find(av => av.year === y);
                          const hasAllSubjects = availInfo ? availInfo.availableCount === availInfo.totalCount : false;
                          const availCount = availInfo?.availableCount || 0;
                          const totalCount = availInfo?.totalCount || selectedSubjects.length;
                          return (
                            <SelectItem key={y} value={y}>
                              <div className="flex items-center gap-2 py-0.5">
                                <span className="font-medium">{y}</span>
                                {availInfo && (
                                  <Badge variant={hasAllSubjects ? 'primary' : 'secondary'} className={cn('text-xs font-normal', hasAllSubjects ? 'bg-green-100 text-green-700 border-green-200' : '')}>
                                    {availCount}/{totalCount}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>

                  {year && yearAvailabilityData?.availability && (() => {
                    const yearInfo = yearAvailabilityData.availability.find(av => av.year === year);
                    if (!yearInfo) return null;
                    const hasAll = yearInfo.availableCount === yearInfo.totalCount;
                    return (
                      <div className={cn('p-3 sm:p-4 rounded-xl border-2 transition-all', hasAll ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800')}>
                        <div className="flex items-start gap-3">
                          {hasAll ? (
                            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 shrink-0">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 shrink-0">
                              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {hasAll ? (
                              <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Perfect! All {yearInfo.totalCount} subjects available for {year}</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm font-medium text-yellow-700 dark:text-yellow-300">{yearInfo.availableCount} of {yearInfo.totalCount} subjects available</p>
                                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">Practice with available subjects only</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : selectedSubjects.length === 0 ? (
                <div className="text-xs sm:text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-dashed text-center">👆 Select subjects first to see available years</div>
              ) : (
                <div className="text-xs sm:text-sm text-muted-foreground p-4 bg-destructive/5 rounded-xl border border-destructive/20 text-center">No exam years available for this combination</div>
              )}
            </div>
          )}

          {/* Paper Type Selection - Modern Toggle Style */}
          {['waec', 'neco'].includes(examType) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <Label htmlFor="paper-type-select" className="text-sm sm:text-base font-semibold">Question Type</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaperType('objective')} className={cn('p-3 sm:p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02] active:scale-[0.98]', paperType === 'objective' ? 'bg-primary/10 border-primary shadow-sm' : 'bg-background border-border hover:bg-muted/30')}>
                  <div className="font-semibold text-sm mb-1">Objective</div>
                  <div className="text-xs text-muted-foreground">Multiple Choice</div>
                </button>
                <button type="button" onClick={() => setPaperType('theory')} className={cn('p-3 sm:p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02] active:scale-[0.98]', paperType === 'theory' ? 'bg-primary/10 border-primary shadow-sm' : 'bg-background border-border hover:bg-muted/30')}>
                  <div className="font-semibold text-sm mb-1">Theory</div>
                  <div className="text-xs text-muted-foreground">Essay Questions</div>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center p-2 bg-muted/20 rounded-lg">💡 Fetching {paperType} questions only</p>
            </div>
          )}

          {/* Subject Selection - Modern Design */}
          {loadingSubjects ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading subjects...</span>
            </div>
          ) : available.length === 0 ? (
            <div className="p-4 sm:p-6 rounded-xl border-2 border-dashed border-muted-foreground/20 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">No subjects available</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later or try a different exam type</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm sm:text-base font-semibold">Your Subjects</Label>
                  {examType === 'jamb' && (
                    <Badge variant={selectedSubjects.length === 4 ? 'primary' : 'secondary'} className={cn('text-xs font-medium', selectedSubjects.length === 4 && 'bg-green-100 text-green-700 border-green-200')}>
                      {selectedSubjects.length}/4
                    </Badge>
                  )}
                </div>
                <SubjectSelector type={examType} available={available} value={selectedSubjects} onChange={setSelectedSubjects} />
              </div>
              {selectedSubjects.length > 0 && (
                <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium mb-1">{selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''} selected</p>
                      <p className="text-xs text-muted-foreground break-words">{selectedSubjects.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Messages - Modern Alert Style */}
          {error && (
            <div className={cn('p-3 sm:p-4 rounded-xl border-2', validationResult && validationResult.available > 0 ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800')}>
              <div className="flex items-start gap-3">
                <div className={cn('p-1.5 rounded-lg shrink-0', validationResult && validationResult.available > 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-red-100 dark:bg-red-900/40')}>
                  <AlertCircle className={cn('h-4 w-4', validationResult && validationResult.available > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400')} />
                </div>
                <p className={cn('text-xs sm:text-sm flex-1', validationResult && validationResult.available > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300')}>{error}</p>
              </div>
            </div>
          )}

          {validationResult && validationResult.insufficient && validationResult.insufficient.length > 0 && (
            <div className="p-4 sm:p-5 rounded-xl border-2 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 shrink-0">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">Partial Content Available</p>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">{validationResult.available} of {validationResult.total} subjects have questions for {year}</p>
                </div>
              </div>
              <div className="space-y-2 pl-11 sm:pl-[52px]">
                <div className="p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Missing:</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{validationResult.insufficient.join(', ')}</p>
                </div>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">💡 You can still practice with {validationResult.available} available subject{validationResult.available > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modern Footer with Gradient */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-t bg-gradient-to-br from-muted/30 to-background">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={validateMutation.isPending} className="w-full sm:w-auto text-sm" size="sm">Cancel</Button>
            {validationResult && validationResult.insufficient && validationResult.insufficient.length > 0 ? (
              <Button onClick={handleProceed} disabled={validateMutation.isPending || validationResult.available === 0} className="w-full sm:w-auto text-sm group" size="sm">
                <span>Continue with {validationResult.available} Subject{validationResult.available > 1 ? 's' : ''}</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={validateMutation.isPending || available.length === 0 || selectedSubjects.length === 0 || (['jamb', 'waec', 'neco'].includes(examType) && !year)} className="w-full sm:w-auto text-sm group" size="sm">
                {validateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <span>Start Practice Session</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
