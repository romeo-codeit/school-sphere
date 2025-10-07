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
import { SubjectSelector } from './SubjectSelector';
import { useAvailableSubjects, useValidateSubjects } from '@/hooks/useCBT';
import { AlertCircle, Loader2 } from 'lucide-react';

export type SubjectSelectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examType: 'jamb' | 'waec' | 'neco' | 'internal';
  onConfirm: (selectedSubjects: string[]) => void;
};

export function SubjectSelectionDialog({ open, onOpenChange, examType, onConfirm }: SubjectSelectionDialogProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  const { data: subjectsData, isLoading: loadingSubjects } = useAvailableSubjects(examType, open);
  const validateMutation = useValidateSubjects();

  const available = subjectsData?.subjects || [];

  // Auto-select English for JAMB when dialog opens and subjects load
  useEffect(() => {
    console.log('[SubjectSelectionDialog] useEffect triggered:', { 
      open, 
      examType, 
      availableLength: available.length, 
      initialized,
      currentSelected: selectedSubjects 
    });
    
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
      
      console.log('[SubjectSelectionDialog] Looking for English in available:', { 
        available, 
        foundEnglish: english 
      });
      
      if (english) {
        console.log('[SubjectSelectionDialog] ✅ Pre-selecting English:', english);
        setSelectedSubjects([english]);
      } else {
        console.warn('[SubjectSelectionDialog] ⚠️ English not found in available subjects!');
        console.warn('[SubjectSelectionDialog] Available subjects are:', available);
      }
      setInitialized(true);
    }
    
    // Reset when dialog closes
    if (!open) {
      console.log('[SubjectSelectionDialog] Dialog closing, resetting state');
      setSelectedSubjects([]);
      setError('');
      setInitialized(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, examType, available.length, initialized, loadingSubjects]);

  const handleConfirm = async () => {
    setError('');
    console.log('[SubjectSelectionDialog] Confirming with:', { examType, selectedSubjects });
    try {
      await validateMutation.mutateAsync({ type: examType, selectedSubjects });
      onConfirm(selectedSubjects);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Subject validation error:', err);
      const errorMsg = err?.message || 'Validation failed';
      const debugInfo = err?.response?.data?.debug;
      
      // Enhanced error message
      let displayError = errorMsg;
      if (debugInfo) {
        displayError += `\n\nDebug info: Scanned ${debugInfo.totalExamsScanned} exams, found ${debugInfo.matchingExams} potential matches`;
      }
      
      setError(displayError);
    }
  };

  const handleCancel = () => {
    setSelectedSubjects([]);
    setError('');
    onOpenChange(false);
  };

  // Internal exams typically don't require subject selection
  if (examType === 'internal') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Internal Exam</DialogTitle>
            <DialogDescription>
              This is an internal exam. No subject selection required.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={() => { onConfirm([]); onOpenChange(false); }}>Start Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Subjects for {examType.toUpperCase()}</DialogTitle>
          <DialogDescription>
            {examType === 'jamb'
              ? 'English is mandatory. Select exactly 3 additional subjects.'
              : 'Select one or more subjects to include in your exam session.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
            <>
              <SubjectSelector
                type={examType}
                available={available}
                value={selectedSubjects}
                onChange={setSelectedSubjects}
              />
              {/* Debug: Show selected subjects */}
              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                <strong>Currently selected ({selectedSubjects.length}):</strong> {selectedSubjects.join(', ') || 'None'}
              </div>
            </>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={validateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={validateMutation.isPending || available.length === 0}>
            {validateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Confirm & Start'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
