# Exams Page UX Redesign

## Problem
The previous design was contradictory: clicking "Start WAEC Biology Exam" opened a subject selector, which doesn't make sense since the subject was already chosen.

## Solution
Redesigned the Exams page to clearly separate:
1. **Practice Hub** for JAMB/WAEC/NECO standardized test practice
2. **School Exams** for internal/assigned school tests

---

## New User Experience

### Practice Hub (Top Section)
Three large, clickable cards for standardized exam practice:

```
┌─────────────────────────────────────────────────────────────┐
│  Practice Hub                                                │
│  Select subjects and start practice sessions                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  JAMB   │  │  WAEC   │  │  NECO   │                     │
│  │   📄    │  │   📄    │  │   📄    │                     │
│  │ 50 sets │  │ 30 sets │  │ 25 sets │                     │
│  │ 4 subj  │  │ Multi   │  │ Multi   │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

**Flow:**
1. Click JAMB/WAEC/NECO card
2. Subject selection dialog opens
3. Select your subjects (e.g., English, Math, Physics, Chemistry for JAMB)
4. System generates a composite practice exam from questions across all selected subjects
5. Navigate to practice session with timer

### School Exams (Bottom Section)
Traditional list/table view with tabs:
- **All School Exams** - All internal tests
- **Assigned to Me** - Exams assigned by teachers
- **Internal** - School-specific tests

**Flow:**
1. Browse or search for school exams
2. Click Start
3. Immediately begin exam (no subject selection needed)

---

## Technical Changes

### Frontend (`client/src/pages/exams.tsx`)
- Replaced stats cards with Practice Hub tiles
- Removed JAMB/WAEC/NECO tabs from exam list
- Filtered standardized exams out of school exams list
- Practice sessions create synthetic exam IDs: `practice-jamb`, `practice-waec`, `practice-neco`
- Navigate to `/exams/practice/:type?attemptId=...&subjects=...`

### Backend (`server/routes.ts`)
**GET `/api/cbt/exams/:id`**
- Detects practice session IDs (`practice-jamb`, etc.)
- Fetches questions from multiple exams matching type and subjects
- Returns synthetic exam document with aggregated questions
- Calculates duration: 2 minutes per question, minimum 60 minutes

**POST `/api/cbt/attempts`**
- Handles practice session attempt creation
- Stores synthetic examId for practice sessions
- Creates attempt with subjects array for tracking

### Routing (`client/src/App.tsx`)
Added new route: `/exams/practice/:type` alongside existing `/exams/:id/take`

### Exam Taking Page (`client/src/pages/exam-taking.tsx`)
- Supports both regular exams and practice sessions
- Reads `type` param for practice routes
- Passes subjects as query param to fetch endpoint
- Rest of functionality (timer, autosave, security) works identically

---

## Data Flow: Practice Session

```
User clicks "WAEC" card
    ↓
Subject selector opens
    ↓
User selects: English, Math, Biology
    ↓
POST /api/cbt/attempts
  { examId: "practice-waec", subjects: ["English", "Math", "Biology"] }
    ↓
Server creates attempt with synthetic examId
    ↓
Navigate to: /exams/practice/waec?attemptId=abc123&subjects=English,Math,Biology
    ↓
GET /api/cbt/exams/practice-waec?subjects=English,Math,Biology
    ↓
Server:
  - Scans exams collection for type=waec
  - Filters by subject (english, math, biology)
  - Aggregates all questions from matching exams
  - Returns synthetic exam with ~50-100 questions
    ↓
Exam taking page renders with timer (e.g., 120 minutes for 60 questions)
```

---

## Benefits

✅ **Clear Intent**: Practice tiles make it obvious you're entering a practice session  
✅ **No Contradiction**: Subject selection happens before exam start, not after  
✅ **Flexible**: Can mix any combination of subjects for practice  
✅ **Scalable**: Easy to add new exam types (e.g., SAT, TOEFL)  
✅ **Separation**: School exams remain focused and distraction-free  

---

## What Stayed the Same

- Subject selection dialog UI (`SubjectSelectionDialog.tsx`, `SubjectSelector.tsx`)
- Validation rules (JAMB needs English + 3 others, etc.)
- Exam-taking experience (timer, autosave, fullscreen, shortcuts)
- Results page and analytics
- Assignment system for school exams

---

## Future Enhancements (Optional)

1. **Question Pool Stats**: Show how many questions per subject in Practice Hub
2. **Difficulty Selection**: Easy/Medium/Hard practice modes
3. **Past Year Papers**: Filter by exam year (e.g., JAMB 2023, WAEC 2022)
4. **Timed Practice**: Option for untimed practice vs. exam simulation
5. **Performance Analytics**: Track practice session scores over time
