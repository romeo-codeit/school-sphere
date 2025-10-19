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
import { AlertCircle, Loader2, Calendar, CheckCircle, Info } from 'lucide-react';

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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Start Internal Exam</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              This is an internal exam. No subject selection required.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={() => { onConfirm([]); onOpenChange(false); }} className="w-full sm:w-auto">Start Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl sm:text-2xl">Select Subjects for {examType.toUpperCase()}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {examType === 'jamb'
              ? 'English is mandatory. Select exactly 3 additional subjects to continue.'
              : 'Choose one or more subjects to include in your exam session.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 px-6 flex-1 overflow-y-auto py-4">
          {/* Year Selection - Only for standardized exams */}
          {['jamb', 'waec', 'neco'].includes(examType) && (
            <div className="space-y-2">
              <Label htmlFor="year-select" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Select Exam Year
                {selectedSubjects.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (availability shown for selected subjects)
                  </span>
                )}
              </Label>
              {loadingYears || loadingAvailability ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading available years...
                </div>
              ) : yearsData?.years?.length ? (
                <div className="space-y-2">
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year-select" className="w-full sm:w-48">
                      <SelectValue placeholder="Select year" />
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
                            <SelectItem key={y} value={y} className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                {y}
                                {availInfo && (
                                  <Badge 
                                    variant={hasAllSubjects ? "primary" : "secondary"} 
                                    className="ml-2 text-xs"
                                  >
                                    {availCount}/{totalCount}
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  
                  {/* Show availability info for selected year */}
                  {year && yearAvailabilityData?.availability && (
                    (() => {
                      const yearInfo = yearAvailabilityData.availability.find(av => av.year === year);
                      if (!yearInfo) return null;
                      
                      const hasAll = yearInfo.availableCount === yearInfo.totalCount;
                      
                      return (
                        <Alert className={hasAll ? "border-green-500/50 bg-green-500/10" : "border-yellow-500/50 bg-yellow-500/10"}>
                          <div className="flex items-start gap-2">
                            {hasAll ? (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                            ) : (
                              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            )}
                            <AlertDescription className="text-xs">
                              {hasAll ? (
                                <span className="text-green-700 dark:text-green-300">
                                  ✓ All {yearInfo.totalCount} subjects available for {year}
                                </span>
                              ) : (
                                <div className="text-yellow-700 dark:text-yellow-300 space-y-1">
                                  <p>
                                    Only {yearInfo.availableCount} of {yearInfo.totalCount} subjects available for {year}
                                  </p>
                                  <p className="text-xs opacity-90">
                                    The exam will include questions only from available subjects.
                                  </p>
                                </div>
                              )}
                            </AlertDescription>
                          </div>
                        </Alert>
                      );
                    })()
                  )}
                </div>
              ) : selectedSubjects.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border">
                  Select subjects first to see available years
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md border">
                  No years available for the selected subjects combination
                </div>
              )}
            </div>
          )}

          {/* Paper Type Selection - Only for WAEC/NECO */}
          {['waec', 'neco'].includes(examType) && (
            <div className="space-y-2">
              <Label htmlFor="paper-type-select" className="text-sm font-medium">Question Type</Label>
              <Select value={paperType} onValueChange={(v: any) => setPaperType(v)}>
                <SelectTrigger id="paper-type-select" className="w-full sm:w-48">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="objective">Objective (MCQ)</SelectItem>
                  <SelectItem value="theory">Theory</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">We'll fetch only {paperType} questions where available.</p>
            </div>
          )}

          {/* Subject Selection */}
          {loadingSubjects ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading subjects...</span>
            </div>
          ) : available.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No subjects available for this exam type.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Subjects</Label>
                <SubjectSelector
                  type={examType}
                  available={available}
                  value={selectedSubjects}
                  onChange={setSelectedSubjects}
                />
              </div>
              
              {/* Selection Summary */}
              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md border">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Selected ({selectedSubjects.length}):</strong> {selectedSubjects.join(', ') || 'None'}
                  </span>
                  {examType === 'jamb' && (
                    <Badge variant={selectedSubjects.length === 4 ? 'primary' : 'secondary'} className="text-xs">
                      {selectedSubjects.length}/4 required
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant={validationResult && validationResult.available > 0 ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {validationResult && validationResult.insufficient && validationResult.insufficient.length > 0 && (
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-xs sm:text-sm">
                <p className="font-medium mb-1">Practice Mode: Partial Data Available</p>
                <p className="mb-2">
                  {validationResult.available} of {validationResult.total} subjects have questions for year {year}.
                </p>
                <p className="text-xs opacity-90">
                  Missing: {validationResult.insufficient.join(', ')}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  Click "Proceed with Available Subjects" to practice with the {validationResult.available} available subject{validationResult.available > 1 ? 's' : ''}.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={validateMutation.isPending} className="w-full sm:w-auto">
            Cancel
          </Button>
          {validationResult && validationResult.insufficient && validationResult.insufficient.length > 0 ? (
            <Button onClick={handleProceed} disabled={validateMutation.isPending || validationResult.available === 0}>
              Proceed with Available Subjects ({validationResult.available})
            </Button>
          ) : (
            <Button 
              onClick={handleConfirm} 
              disabled={
                validateMutation.isPending || 
                available.length === 0 || 
                selectedSubjects.length === 0 ||
                (['jamb', 'waec', 'neco'].includes(examType) && !year)
              }
              className="w-full sm:w-auto"
            >
              {validateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Confirm & Start Exam'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
