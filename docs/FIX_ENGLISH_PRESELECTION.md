# Fix: English Pre-selection for JAMB

## Problem
When opening the JAMB subject selector, English wasn't pre-selected, causing the error:
```
English is mandatory for JAMB
```

## Root Cause
**Case sensitivity mismatch:**
- Component initialized with: `['English']` (capital E)
- Backend returned available subjects: `['english', 'mathematics', ...]` (lowercase)
- Comparison used strict equality: `'English' !== 'english'` ❌
- Result: English appeared unselected even though it was in the state

## Solution

### 1. Dynamic English Pre-selection
**File:** `client/src/components/exams/SubjectSelectionDialog.tsx`

Changed from:
```tsx
// ❌ Hard-coded capital E, doesn't match backend data
const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
  examType === 'jamb' ? ['English'] : []
);
```

To:
```tsx
// ✅ Find English from available subjects (case-insensitive)
const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

useEffect(() => {
  if (examType === 'jamb' && available.length > 0 && selectedSubjects.length === 0) {
    const english = available.find(s => s.toLowerCase() === 'english');
    if (english) {
      setSelectedSubjects([english]); // Uses exact casing from backend
    }
  }
}, [examType, available, selectedSubjects.length]);
```

**Benefits:**
- ✅ Matches the exact casing returned by the backend
- ✅ Only pre-selects when subjects are loaded
- ✅ Handles edge cases (English missing from available subjects)

### 2. Case-insensitive Subject Matching
**File:** `client/src/components/exams/SubjectSelector.tsx`

Changed comparisons from strict equality to case-insensitive:

```tsx
// Before: ❌
const selected = value.includes(s);
const disabled = type === 'jamb' && s.toLowerCase() === 'english';

// After: ✅
const selected = value.some(v => v.toLowerCase() === s.toLowerCase());
const disabled = type === 'jamb' && s.toLowerCase() === 'english';
```

**What this fixes:**
- Badge highlighting now works regardless of case
- Toggle logic handles "English", "english", "ENGLISH" correctly
- Validation checks English is selected using `.some()` instead of `.includes()`

### 3. Reset Behavior
Added proper cleanup when dialog closes:
```tsx
useEffect(() => {
  if (!open) {
    setSelectedSubjects([]);
    setError('');
  }
}, [open]);
```

This ensures fresh state when reopening the dialog.

---

## Testing

### Before Fix:
1. Click JAMB practice tile
2. Subject selector opens
3. English badge shows as unselected (outline variant)
4. Click "Confirm & Start"
5. ❌ Error: "English is mandatory for JAMB"

### After Fix:
1. Click JAMB practice tile
2. Subject selector opens
3. ✅ English badge shows as selected (primary variant, disabled)
4. Text shows: "English is mandatory and pre-selected"
5. Select 3 more subjects
6. Click "Confirm & Start"
7. ✅ Validation passes, practice session starts

---

## Edge Cases Handled

1. **Backend returns "English" with capital E**
   - ✅ Works: We use the exact value from backend

2. **Backend returns "english" with lowercase**
   - ✅ Works: We use the exact value from backend

3. **English not in available subjects** (data issue)
   - ✅ Graceful: English won't be pre-selected
   - ✅ Error message will show which subjects are missing

4. **Dialog opened multiple times**
   - ✅ State resets properly between opens
   - ✅ English re-selected each time for JAMB

5. **User tries to deselect English**
   - ✅ Badge is disabled, can't be clicked
   - ✅ UI feedback: "opacity-60 cursor-not-allowed"

---

## Related Files

- `client/src/components/exams/SubjectSelectionDialog.tsx` - Dialog wrapper, state management
- `client/src/components/exams/SubjectSelector.tsx` - Badge UI, toggle logic
- `client/src/hooks/useCBT.ts` - Fetches available subjects from backend
- `server/routes.ts` - Returns subjects list (case may vary)

---

## Prevention

To avoid similar issues:

1. **Always use case-insensitive comparisons for user-entered data**
   ```tsx
   // ✅ Good
   value.some(v => v.toLowerCase() === searchTerm.toLowerCase())
   
   // ❌ Bad
   value.includes(searchTerm)
   ```

2. **Use backend data as source of truth for casing**
   ```tsx
   // ✅ Good: Use exact value from API
   const english = available.find(s => s.toLowerCase() === 'english');
   setSelected([english]);
   
   // ❌ Bad: Hard-code casing
   setSelected(['English']);
   ```

3. **Add visual indicators for pre-selected items**
   - Disabled state for mandatory items
   - Tooltip explaining why it can't be deselected
   - Clear text: "English is mandatory and pre-selected"
