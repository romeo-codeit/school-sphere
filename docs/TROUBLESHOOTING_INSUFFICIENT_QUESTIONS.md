# Troubleshooting: "Insufficient questions for subjects"

## Problem
When trying to start a JAMB/WAEC/NECO practice session, you get an error:
```
Insufficient questions for subjects
```

## Root Causes

### 1. Exams exist but have no questions
The exam documents are in Appwrite, but:
- The `questions` field is empty or missing
- No corresponding documents in the `questions` collection

### 2. Subject name mismatch
- Selected: "Mathematics"
- In database: "Maths" or "Math"
- Solution: Subjects must match exactly (case-insensitive)

### 3. Wrong exam type
- Exam type stored as "JAMB" (uppercase)
- System looking for "jamb" (lowercase)
- Solution: Backend now handles case-insensitively

---

## Diagnostic Steps

### Step 1: Check what's in your database

**Option A: Use the diagnostic endpoint**
```bash
# Start your dev server
npm run dev

# In another terminal, run:
node scripts/check-exam-subjects.js
```

**Option B: Use curl/browser**
```bash
# Open in browser or curl:
http://localhost:5000/api/debug/exam-subjects
```

This shows:
- All exam types (jamb, waec, neco, internal)
- Subjects available for each type
- Which exams have questions vs. empty

### Step 2: Check server logs

When you try to start a practice session, the server logs:
```
[CBT] Validating subjects: { type: 'jamb', selectedSubjects: ['english', 'mathematics', 'physics', 'chemistry'] }
[CBT] Validation results: { 
  totalExamsScanned: 150,
  matchingExams: 4,
  availability: { english: 1, mathematics: 0, physics: 1, chemistry: 1 }
}
```

This shows:
- `matchingExams: 4` - Found 4 exams matching type + subjects
- `availability` - How many have actual questions
- `mathematics: 0` - No questions found for Math!

---

## Solutions

### Solution 1: Upload questions for exams

If you have exam documents without questions:

1. Go to Exams page → "Upload Questions" button
2. Upload JSON with questions for each exam
3. Or manually add to Appwrite:
   - Collection: `questions`
   - Fields: `examId` (link to exam), `question`, `options`, `correctAnswer`, etc.

### Solution 2: Fix subject name mismatches

Check your exam documents in Appwrite:
```json
{
  "$id": "abc123",
  "type": "jamb",
  "subject": "Maths",  // ⚠️ Should be "Mathematics"
  "questions": []
}
```

Fix by updating the `subject` field to match what users select.

**Common mismatches:**
- Math vs Mathematics
- Lit vs Literature in English
- CRS vs CRK
- Govt vs Government

### Solution 3: Use embedded questions

If your exam documents have questions embedded:
```json
{
  "$id": "abc123",
  "type": "jamb",
  "subject": "Mathematics",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4"
    }
  ]
}
```

The system will use these automatically.

### Solution 4: Seed sample data

If starting fresh, use the seeding script:
```bash
npm run seed
```

This creates sample exams with questions for JAMB/WAEC/NECO.

---

## Quick Fix: Check Available Subjects

Before starting a practice session, check what's actually available:

1. Click a practice hub tile (JAMB/WAEC/NECO)
2. The subject selector loads available subjects via `/api/cbt/subjects/available?type=jamb`
3. Only select subjects that appear in the list
4. If a subject you need is missing, it means no exams with questions exist for it

---

## Enhanced Error Messages (After Fix)

The updated validation now shows:
```
No questions found for: mathematics, biology

Available question sets: {"english": 2, "physics": 1, "chemistry": 1, "mathematics": 0, "biology": 0}

Debug info: Scanned 150 exams, found 5 potential matches
```

This tells you:
- Which specific subjects are missing questions
- How many question sets exist for subjects that DO have questions
- How many exams were checked

---

## Prevention

### For Admins/Teachers uploading exams:

1. ✅ Always include questions when uploading exams
2. ✅ Use consistent subject names (Mathematics not Math)
3. ✅ Test each exam type after upload:
   - Go to Practice Hub
   - Try starting a session
   - Verify questions load

### For Developers:

1. ✅ Run `node scripts/check-exam-subjects.js` after seeding
2. ✅ Check server logs for validation errors
3. ✅ Use `/api/debug/exam-subjects` endpoint during development

---

## Need More Help?

Check the server console when the error occurs - it now logs:
- Total exams scanned
- Matching exams found
- Availability per subject
- List of exams with/without questions

This will pinpoint exactly which subject is missing questions.
