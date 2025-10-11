# Option 4: Smart Year Selection with Availability Indicators

## Overview
This implementation allows users to start practice exams even when not all selected subjects have data for the chosen year. It provides clear visibility into which subjects are available and allows proceeding with partial data.

## Key Features

### 1. Year Availability Indicators
- **Visual Badges**: Each year in the dropdown shows availability counts (e.g., "3/4" means 3 of 4 subjects available)
- **Color Coding**: 
  - Green checkmark for years with all subjects
  - Yellow warning for years with partial availability
- **Real-time Updates**: Availability changes as subjects are selected

### 2. Smart Validation
- **Permissive Approach**: No longer blocks exam start if some subjects are missing
- **Clear Communication**: Shows exactly which subjects are available vs missing
- **Proceed with Confirmation**: Requires explicit user confirmation when proceeding with partial data

### 3. User Flow
1. User selects subjects (e.g., English, Biology, Chemistry, Agricultural Science)
2. Year dropdown shows availability for each year:
   - 2020: 4/4 (all available)
   - 2010: 3/4 (partial - Agric not available)
   - 2005: 3/4 (partial - Agric not available)
3. User selects a year with partial data
4. Alert shows: "Only 3 of 4 subjects available for 2005. Missing: Agricultural Science"
5. User can either:
   - Change year selection
   - Click "Proceed with Available Subjects (3)" to continue

## Backend Changes

### New Endpoint: `/api/cbt/years/availability`
Returns detailed availability information per year:
```json
{
  "availability": [
    {
      "year": "2020",
      "subjects": ["english", "biology", "chemistry", "agriculturalscience"],
      "availableCount": 4,
      "totalCount": 4
    },
    {
      "year": "2005",
      "subjects": ["english", "biology", "chemistry"],
      "availableCount": 3,
      "totalCount": 4
    }
  ]
}
```

### Updated: `/api/cbt/exams/validate-subjects`
Now returns availability details instead of failing:
```json
{
  "ok": true,
  "availability": {
    "english": 5,
    "biology": 3,
    "chemistry": 4,
    "agriculturalscience": 0
  },
  "available": 3,
  "total": 4,
  "insufficient": ["agriculturalscience"],
  "message": "3 of 4 subjects available. Subjects without data: agriculturalscience"
}
```

## Frontend Changes

### New Hook: `useYearAvailability`
Fetches detailed year-by-year availability for selected subjects.

### Updated: `SubjectSelectionDialog`
- Shows availability badges in year dropdown
- Displays real-time alerts about subject availability
- Provides "Proceed Anyway" button for partial data scenarios
- Resets validation state when subjects/year change

### UI Components
- **Year Dropdown**: Shows availability count badges
- **Alert Messages**: 
  - Green success for full availability
  - Yellow warning for partial availability
  - Blue info for proceed confirmation
- **Action Buttons**: 
  - "Confirm & Start" (when all subjects available)
  - "Proceed with Available Subjects (N)" (when partial)

## Benefits

### For Users
- **No More Dead Ends**: Can always practice with available data
- **Clear Expectations**: Know exactly what's included before starting
- **Flexible Learning**: Can practice specific year/subject combinations
- **Educational Value**: Learn about data coverage patterns

### For System
- **Better UX**: Less frustration, more engagement
- **Graceful Degradation**: Handles incomplete datasets smoothly
- **Scalability**: Easy to add new subjects/years without breaking existing flows
- **Transparency**: Users understand data limitations

## Technical Details

### Subject Normalization
Uses canonical subject names to handle variants:
- "English", "English Language", "EnglishLanguage" → "english"
- "Agricultural Science", "Agric", "AgriculturalScience" → "agriculturalscience"

### Performance
- Efficient batched queries (100 documents at a time)
- Cached results via TanStack Query
- Minimal re-fetching with smart query keys

### Error Handling
- Falls back gracefully when no data available
- Clear error messages with actionable guidance
- Preserves user selections during errors

## Testing Scenarios

1. **All Subjects Available**: Normal flow, green indicators
2. **Partial Availability**: Yellow warnings, proceed button appears
3. **No Availability**: Error message, can't proceed
4. **Year Selection Change**: Resets validation, shows new availability
5. **Subject Selection Change**: Updates available years list

## Future Enhancements

1. **Subject-Level Indicators**: Show availability status per subject in selector
2. **Question Count Preview**: Show how many questions available per subject
3. **Historical Trends**: Show which years have most complete data
4. **Auto-Select Best Year**: Suggest years with full availability
5. **Smart Defaults**: Remember user's year preferences

## Migration Notes

- **Backward Compatible**: Existing exams still work
- **No Database Changes**: Uses existing exam structure
- **Progressive Enhancement**: Degrades gracefully if new endpoint unavailable
- **Client-Side Safe**: All checks done before server calls
