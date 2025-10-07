# Exams Page Refactoring Plan

## Current State Analysis

### What We Have ✅
- Basic exam listing with type filters (JAMB, WAEC, NECO, Internal)
- Stats cards showing total exams per type
- Search functionality
- Admin upload form for questions
- Basic exam-taking page with:
  - Timer countdown
  - Question navigation
  - Answer selection
  - Mark for review
  - Submit functionality
  - Progress tracking

### What's Missing ❌

#### 1. **Role-Based Access Control**
- Current: All users see all exams
- Needed: Students only see assigned/accessible exams based on class/permissions

#### 2. **Subject Selection Flow (JAMB Mode)**
- Current: Direct "Start" button on any exam
- Needed: Subject selection screen where:
  - English is mandatory (pre-checked, disabled)
  - Students select exactly 3 additional subjects
  - Validation: "Select exactly 3 subjects" error
  - Confirmation before proceeding
  - Backend query: `type='jamb' AND subject IN [English + selected]`

#### 3. **Subject Selection Flow (WAEC/NECO Mode)**
- Current: Direct start
- Needed: Multi-select dropdown
  - Choose 1+ subjects
  - No pre-selections
  - Confirmation before proceeding
  - Backend query: `type IN ['waec', 'neco'] AND subject IN [selected]`

#### 4. **Exam Mode Types**
- Current: Single mode
- Needed: Toggle between:
  - **Practice Mode**: No timer, instant feedback after each question
  - **Exam Mode**: Strict timer, no feedback until submission

#### 5. **Full-Screen & Security Features**
- Current: Normal page
- Needed:
  - Browser fullscreen API enforcement
  - Disable right-click
  - Disable copy-paste
  - Prevent tab switching (warn/pause)
  - (Future: Proctoring integration)

#### 6. **Enhanced Timer Features**
- Current: Basic countdown
- Needed:
  - Warning popup at 10 minutes remaining
  - Flash alert at 1 minute
  - Auto-submit on time expiry with "Time's up!" message

#### 7. **Auto-Save & Offline Support**
- Current: Manual submission only
- Needed:
  - Auto-save answers every 30 seconds to localStorage
  - Sync to backend when online
  - Handle connectivity loss gracefully

#### 8. **Keyboard Shortcuts**
- Current: None
- Needed:
  - 1-4 keys for option selection
  - Arrow keys for navigation
  - F for flag
  - S for submit (with confirmation)

#### 9. **Results & Analytics**
- Current: Basic score display
- Needed:
  - Immediate feedback in practice mode
  - Detailed breakdown (correct/incorrect per question)
  - Subject-wise performance
  - Time spent per question
  - Comparison with class/school average

#### 10. **Teacher/Admin Features**
- Current: Upload form only
- Needed:
  - Bulk exam creation/editing
  - Assign exams to specific classes/students
  - View all attempts with filters
  - Analytics dashboard:
    - Class performance charts
    - Subject weakness identification
    - Individual student progress
  - Export results to CSV

## Refactoring Roadmap

### Phase 1: Foundation & Architecture (2-3 days)
**Priority: HIGH**

1. **Backend Schema Updates**
   - Add `assignedTo` (array of classIds/studentIds) to exams
   - Add `mode` field ('practice' | 'exam') to exams
   - Add `subjects` array field to examAttempts (for JAMB/WAEC tracking)
   - Add `timePerQuestion` field to examAttempts for analytics

2. **Backend API Enhancements**
   ```typescript
   // New endpoints needed:
   GET  /api/cbt/exams/assigned         // Get exams assigned to current user
   POST /api/cbt/exams/validate-subjects // Validate subject selection before start
   GET  /api/cbt/subjects/available     // Get available subjects by exam type
   POST /api/cbt/attempts/autosave      // Auto-save partial attempt
   GET  /api/cbt/attempts/:id/results   // Detailed results with analytics
   GET  /api/cbt/analytics/class/:classId // Class performance
   ```

3. **Create New Components**
   ```
   client/src/components/exams/
   ├── SubjectSelector.tsx              // JAMB/WAEC subject selection
   ├── ExamModeSelector.tsx             // Practice vs Exam toggle
   ├── ExamCard.tsx                     // Reusable exam card with status
   ├── FullScreenExam.tsx               // Wrapper with security features
   ├── ExamResults.tsx                  // Detailed results display
   └── QuestionAnalytics.tsx            // Per-question breakdown
   ```

### Phase 2: Subject Selection & Validation (2 days)
**Priority: HIGH**

1. **Subject Selector Component**
   - JAMB mode: English (disabled) + 3 subjects multi-select
   - WAEC/NECO mode: 1+ subjects multi-select
   - Real-time validation with error messages
   - Subject availability check via API

2. **Exam Start Flow Refactor**
   ```
   Current: Exams Page → Click Start → Exam Taking Page
   New:     Exams Page → Click Start → Subject Selection Modal → Confirmation → Exam Taking Page
   ```

3. **Backend Validation**
   - Validate subject selections server-side
   - Return available questions count before start
   - Error if insufficient questions for selected subjects

### Phase 3: Security & Full-Screen (1-2 days)
**Priority: MEDIUM**

1. **Full-Screen Enforcement**
   - Use browser Fullscreen API
   - Lock screen on exam start
   - Warn on ESC/exit attempts
   - Force exit = auto-submit

2. **Anti-Cheat Measures**
   - Disable right-click menu
   - Disable text selection/copy-paste
   - Detect tab switching → pause timer + warning
   - Blur detection → log suspicious activity

3. **Keyboard Shortcuts**
   - 1-4 for answers
   - Arrow keys for navigation
   - F to flag
   - Global event listeners with proper cleanup

### Phase 4: Enhanced Timer & Auto-Save (1-2 days)
**Priority: MEDIUM — Implemented**

1. **Advanced Timer Features**
   - 10-minute warning modal
   - 1-minute flashing alert
   - Auto-submit on expiry
   - Pause/resume on connectivity loss (with offline indicator)

2. **Auto-Save System**
   - localStorage backup every 30 seconds + final save on unmount
   - Background sync to backend when online (skips when offline)
   - Recovery on page reload (answers restored; time restored if present)
   - Basic conflict handling by preferring in-progress local state

### Phase 5: Results & Analytics (2-3 days)
**Priority: MEDIUM**

1. **Student Results Page**
   - Score breakdown by subject
   - Question-by-question review
   - Time spent analysis
   - Correct answer explanations (practice mode)
   - Comparison charts (class average)

2. **Teacher Analytics Dashboard**
   - Class performance overview
   - Subject weakness heatmap
   - Individual student progress
   - Attempt history with filters
   - Export to CSV/PDF

3. **Real-Time Feedback (Practice Mode)**
   - Instant correct/incorrect indication
   - Show explanation after answer
   - Running score display

### Phase 6: Role-Based Access & Assignment (2 days)
**Priority: HIGH**

1. **Exam Assignment System**
   - Teacher UI to assign exams to classes/students
   - Time-lock exams (not available before date)
   - Permission-based visibility
   - Notification system for new assignments

2. **Student Exam Dashboard**
   - Show only assigned/accessible exams
   - Display exam status (upcoming, active, completed)
   - Filter by subject/type
   - Attempt history

### Phase 7: Polish & Edge Cases (1-2 days)
**Priority: LOW — Implemented**

1. **Error Handling**
   - "No questions available" message
   - Graceful degradation on API failures with descriptive messages
   - Retry logic for auto-save (with exponential backoff)
   - Network offline indicator with visual dot

2. **Mobile Optimization**
   - Responsive subject selector
   - Touch-friendly question navigation (touch-manipulation class)
   - Responsive button labels (hide text on mobile, show icons)
   - Improved padding and spacing for touch targets

3. **Accessibility**
   - Screen reader support (aria-label, aria-live, aria-current)
   - Keyboard-only navigation (Enter/Space on options)
   - High contrast mode support (dark mode variants)
   - Semantic HTML and ARIA roles

## Implementation Priority

### Must-Have (Week 1-2)
1. Subject selection flow (JAMB/WAEC/NECO)
2. Role-based exam visibility
3. Enhanced timer with warnings
4. Auto-save system
5. Backend API for assigned exams

### Should-Have (Week 3)
1. Full-screen & security features
2. Keyboard shortcuts
3. Detailed results page
4. Teacher analytics dashboard

### Nice-to-Have (Week 4+)
1. Practice vs Exam mode toggle
2. Real-time feedback
3. Offline support
4. Proctoring integration
5. Mobile app (PWA)

## Technical Considerations

### State Management
- Use React Query for server state
- localStorage for auto-save
- Context for exam session state
- Reduce re-renders during timer countdown

### Performance
- Lazy load question components
- Virtualize question navigator for 100+ questions
- Debounce auto-save
- Optimize analytics charts

### Testing Strategy
- Unit tests for subject validation logic
- Integration tests for exam flow
- E2E tests for full exam journey
- Load testing for concurrent exam sessions

### Data Migration
- Add new fields to existing exam documents
- Backfill `assignedTo` as empty array (public by default)
- Update seed scripts

## Next Steps

1. **Review & Approval**: Discuss this plan with team/stakeholders
2. **Backend First**: Start with API endpoints and schema updates
3. **Component Library**: Build reusable exam components
4. **Incremental Rollout**: Feature flags for gradual release
5. **User Testing**: Get feedback from students/teachers after Phase 2

## Questions to Resolve

1. Should practice mode consume exam attempts quota?
2. How to handle partial attempts (started but not submitted)?
3. Should students see correct answers immediately after submission?
4. What's the grace period for auto-submit (0 seconds or allow brief delay)?
5. Should flagged questions trigger a review reminder before submit?
6. How to prevent multiple simultaneous attempts of same exam?

---

**Last Updated**: October 7, 2025
**Status**: Planning Phase
**Estimated Timeline**: 3-4 weeks for full implementation
