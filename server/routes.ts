import type { Express } from "express";
import { createServer, type Server } from "http";
import { Client, Users, ID, Databases, Query } from 'node-appwrite';
import { auth } from './middleware';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  throw new Error("Missing Appwrite environment variables. Please check your .env file.");
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);

const collections = [
  'students',
  'teachers',
  'exams',
  'examAttempts',
  'payments',
  'attendance',
  'messages',
  'resources',
  'grades',
  'videoMeetings',
  'chatMessages',
  'forumThreads',
  'activities',
  'classes',
];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post('/api/users', async (req, res) => {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      const newUser = await users.create(
        ID.unique(),
        email,
        undefined, // phoneNumber
        password,
        name
      );

      await users.updatePrefs(newUser.$id, { role });

      return res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.get('/api/teacher/classes', auth, async (req, res) => {
    try {
      if (!req.appwrite) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const user = await req.appwrite.account.get();
      if (!user?.$id) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
  const teacher = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachers', [Query.equal('userId', String(user.$id))]);

      if (teacher.documents.length === 0) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

  const teacherId = String(teacher.documents[0].$id);

  const teacherClasses = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachersToClasses', [Query.equal('teacherId', teacherId)]);

  const classIds = teacherClasses.documents.map((doc) => String(doc.classId));

      if (classIds.length === 0) {
        return res.json({ documents: [] });
      }

      if (!classIds.length) {
        return res.json({ documents: [] });
      }
  const classes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'classes', [Query.equal('$id', classIds)]);

      res.json(classes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch teacher classes' });
    }
  });

  app.get('/api/classes/:id/students', auth, async (req, res) => {
    try {
  const classId = String(req.params.id);
  const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [Query.equal('classId', classId)]);
      res.json(students);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch students for the class' });
    }
  });

  // Generic CRUD endpoints for all collections
  for (const collection of collections) {
    // List documents
    app.get(`/api/${collection}`, async (req, res) => {
      try {
        const queries = [];
        for (const key in req.query) {
          if (key === 'limit') {
            queries.push(Query.limit(parseInt(req.query[key] as string, 10)));
          } else if (key === 'offset') {
            queries.push(Query.offset(parseInt(req.query[key] as string, 10)));
          } else {
            queries.push(Query.equal(key, req.query[key] as string));
          }
        }
        if (!collection) {
          return res.status(400).json({ message: 'Missing collection name' });
        }
  const response = await databases.listDocuments(APPWRITE_DATABASE_ID!, String(collection), queries);
        res.json(response);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to fetch ${collection}` });
      }
    });

    // Get document
    app.get(`/api/${collection}/:id`, async (req, res) => {
      try {
        if (!collection || !req.params.id) {
          return res.status(400).json({ message: 'Missing collection name or document ID' });
        }
  const response = await databases.getDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id));
        res.json(response);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to fetch ${collection}` });
      }
    });

    // Create document
    app.post(`/api/${collection}`, async (req, res) => {
      try {
        if (!collection) {
          return res.status(400).json({ message: 'Missing collection name' });
        }
  const response = await databases.createDocument(APPWRITE_DATABASE_ID!, String(collection), ID.unique(), req.body);
        res.status(201).json(response);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to create ${collection}` });
      }
    });

    // Update document
    app.put(`/api/${collection}/:id`, async (req, res) => {
      try {
        if (!collection || !req.params.id) {
          return res.status(400).json({ message: 'Missing collection name or document ID' });
        }
  const response = await databases.updateDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id), req.body);
        res.json(response);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to update ${collection}` });
      }
    });

    // Delete document
    app.delete(`/api/${collection}/:id`, async (req, res) => {
      try {
        if (!collection || !req.params.id) {
          return res.status(400).json({ message: 'Missing collection name or document ID' });
        }
  await databases.deleteDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id));
        res.status(204).send();
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to delete ${collection}` });
      }
    });
  }

  // --- CBT Simulator Endpoints ---

  // Get all available exams (optionally filter by type)
  app.get('/api/cbt/exams', auth, async (req, res) => {
    try {

      // Support limit=all for stats queries
      let limitParam = req.query.limit as string;
      let limit: number;
      let fetchAll = false;
      if (limitParam === 'all') {
        fetchAll = true;
        limit = 100; // will loop to fetch all
      } else {
        limit = Math.max(1, Math.min(100, parseInt(limitParam) || 10));
      }
      const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
      const withQuestions = req.query.withQuestions !== 'false'; // default true

      let exams: any[] = [];
      let total = 0;
      if (fetchAll) {
        // Loop to fetch all exams in batches of 100
        let done = false;
        let batchOffset = 0;
        do {
          const result = await databases.listDocuments(
            APPWRITE_DATABASE_ID!,
            'exams',
            [Query.limit(100), Query.offset(batchOffset)]
          );
          exams.push(...result.documents);
          total = result.total || exams.length;
          batchOffset += result.documents.length;
          done = exams.length >= total || result.documents.length === 0;
        } while (!done);
      } else {
        const result = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(limit), Query.offset(offset)]
        );
        exams = result.documents;
        total = result.total || exams.length;
      }

      // For each exam, fetch its questions from the questions collection (only if withQuestions=true)
      // When fetching all exams without questions (limit=all&withQuestions=false), avoid per-exam
      // question-count queries to prevent overwhelming Appwrite and causing 500s.
      let examsWithQuestions;
      const skipQuestionCounts = fetchAll && !withQuestions;
      if (withQuestions) {
        examsWithQuestions = await Promise.all(
          exams.map(async (exam) => {
            // Fetch all questions for this exam (with pagination if needed)
            let questions = [];
            let qOffset = 0;
            let qTotal = 0;
            do {
              const qResult = await databases.listDocuments(
                APPWRITE_DATABASE_ID!,
                'questions',
                [Query.equal('examId', exam.$id), Query.limit(100), Query.offset(qOffset)]
              );
              if (qResult.documents.length === 0) break;
              questions.push(...qResult.documents);
              qTotal = qResult.total || questions.length;
              qOffset += qResult.documents.length;
            } while (questions.length < qTotal);
            return { ...exam, questions, questionCount: questions.length };
          })
        );
      } else if (!skipQuestionCounts) {
        // For stats queries, just count questions for each exam
        examsWithQuestions = await Promise.all(
          exams.map(async (exam) => {
            const qResult = await databases.listDocuments(
              APPWRITE_DATABASE_ID!,
              'questions',
              [Query.equal('examId', exam.$id), Query.limit(1)]
            );
            const questionCount = qResult.total || 0;
            return { ...exam, questions: [], questionCount };
          })
        );
      } else {
        // Fetching ALL exams without questions: skip per-exam question counts to avoid overload
        examsWithQuestions = exams.map((exam) => ({ ...exam, questions: [], questionCount: undefined }));
      }

      res.json({ exams: examsWithQuestions, total });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Get exams assigned to the current user. In development/admin, return all for easier testing
  app.get('/api/cbt/exams/assigned', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      const isDev = process.env.NODE_ENV !== 'production';
      const isAdmin = role === 'admin';

      // Admins (and any user in dev) can see all exams
      if (isAdmin || isDev) {
        const result = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(0)]
        );
        return res.json({ exams: result.documents, total: result.total || result.documents.length });
      }

      // Otherwise, compute assignments for the current user (student/teacher)
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Try to resolve student document and class
      let studentId: string | undefined;
      let classId: string | undefined;
      try {
        const studentDocs = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'students',
          [Query.equal('userId', String(userId)), Query.limit(1)]
        );
        if (studentDocs.total > 0) {
          studentId = String(studentDocs.documents[0].$id);
          classId = studentDocs.documents[0].classId ? String(studentDocs.documents[0].classId) : undefined;
        }
      } catch {}

      // Fallback: if not student, allow teachers to see all for now (will refine in Phase 6)
      if (role === 'teacher') {
        const result = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(0)]
        );
        return res.json({ exams: result.documents, total: result.total || result.documents.length });
      }

      // Fetch a reasonable page of exams and filter in-memory for assignment
      const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'exams',
        [Query.limit(100), Query.offset(0)]
      );
      const exams = result.documents as any[];
      const visible = exams.filter((e) => {
        const assigned: string[] = Array.isArray((e as any).assignedTo) ? (e as any).assignedTo : [];
        // Public if no assignments yet
        if (!assigned || assigned.length === 0) return true;
        // Visible if explicitly assigned to student or their class
        return (studentId && assigned.includes(String(studentId))) || (classId && assigned.includes(String(classId)));
      });
      return res.json({ exams: visible, total: visible.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch assigned exams' });
    }
  });

  // Get a single exam (with questions) or a synthetic practice exam
  app.get('/api/cbt/exams/:id', auth, async (req, res) => {
    try {
      const examId = String(req.params.id || '').trim();
      console.log('[CBT] GET /api/cbt/exams/:id', { id: examId });

      // Basic validation for missing/placeholder ids
      if (!examId || examId === 'undefined' || examId === 'null') {
        return res.status(400).json({ message: 'Invalid exam id' });
      }

      // Handle practice sessions (synthetic examId like 'practice-jamb')
      if (examId.startsWith('practice-')) {
        const type = examId.replace('practice-', '');
        const subjects = req.query.subjects ? String(req.query.subjects).split(',') : [];
        const yearParam = req.query.year ? String(req.query.year) : undefined;
        const normalize = (s: string) => String(s || '').trim().toLowerCase();
        const isEnglish = (s: string) => {
          const v = normalize(s);
          return v === 'english' || v === 'english language' || v === 'englishlanguage' || v === 'use of english' || v.startsWith('english');
        };
        const selectedSubjects = subjects.map((s) => s.trim()).filter(Boolean);
        
        // Fetch questions from multiple exams matching type and subjects
        let questions: any[] = [];
        for (const subject of selectedSubjects) {
          let offset = 0;
          while (true) {
            const examResults = await databases.listDocuments(
              APPWRITE_DATABASE_ID!,
              'exams',
              [Query.limit(100), Query.offset(offset)]
            );
            
            for (const exam of examResults.documents) {
              const examType = normalize((exam as any).type || '');
              const examSubjectRaw = String((exam as any).subject || '');
              const examSubject = normalize(examSubjectRaw);
              const examYear = String((exam as any).year || '');
              
              // For JAMB, require matching year (when provided)
              if (type === 'jamb' && yearParam && String(examYear) !== String(yearParam)) {
                continue;
              }
              // Subject match (treat English synonyms as equivalent)
              const subjectMatches = isEnglish(examSubject) ? selectedSubjects.some(isEnglish) : (examSubject === normalize(subject));
              if (examType === type && subjectMatches) {
                // Get questions from this exam
                const pushMapped = (arr: any[]) => {
                  for (const q of arr) {
                    const text = (q as any).question ?? (q as any).questionText ?? (q as any).text ?? '';
                    const opts = (q as any).options ?? [];
                    const correct = (q as any).correctAnswer ?? (q as any).answer ?? '';
                    const mapped = {
                      question: text,
                      options: opts,
                      correctAnswer: correct,
                      explanation: (q as any).explanation ?? undefined,
                      imageUrl: (q as any).imageUrl ?? (q as any).image ?? undefined,
                      subject: isEnglish(examSubjectRaw) ? 'English' : (exam as any).subject,
                    };
                    questions.push(mapped);
                  }
                };
                if (Array.isArray((exam as any).questions) && (exam as any).questions.length > 0) {
                  pushMapped((exam as any).questions);
                } else {
                  // Fetch from questions collection
                  let qOffset = 0;
                  while (true) {
                    const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
                      Query.equal('examId', String(exam.$id)),
                      Query.limit(100),
                      Query.offset(qOffset),
                    ]);
                    pushMapped(qRes.documents as any[]);
                    qOffset += qRes.documents.length;
                    if (qOffset >= (qRes.total || qOffset) || qRes.documents.length === 0) break;
                  }
                }
              }
            }
            
            offset += examResults.documents.length;
            if (offset >= (examResults.total || offset) || examResults.documents.length === 0) break;
          }
        }
        // For WAEC/NECO practice: sample 50 random questions across selected subjects
        const sample = <T,>(arr: T[], n: number): T[] => {
          if (arr.length <= n) return arr;
          const out: T[] = [];
          const used = new Set<number>();
          while (out.length < n) {
            const idx = Math.floor(Math.random() * arr.length);
            if (!used.has(idx)) { used.add(idx); out.push(arr[idx]); }
          }
          return out;
        };

        let finalQuestions = questions;
        if (type === 'waec' || type === 'neco') {
          finalQuestions = sample(questions, 50);
        }

        // Fixed durations by type
        const durationMinutes = type === 'jamb' ? 120 : (type === 'waec' || type === 'neco') ? 90 : 60;
        const titleSuffix = yearParam && type === 'jamb' ? `${subjects.join(', ')} - ${yearParam}` : subjects.join(', ');

        // Return synthetic practice exam
        return res.json({
          $id: examId,
          title: `${type.toUpperCase()} Practice - ${titleSuffix}`,
          type,
          subject: subjects.join(', '),
          duration: durationMinutes,
          questions: finalQuestions,
          questionCount: finalQuestions.length,
          isPractice: true,
          selectedSubjects,
          year: yearParam,
        });
      }

      // Debug: If ?debug=1, fetch only one exam, no questions
      if (req.query.debug === '1') {
        console.log('[CBT] Debug mode: fetching only one exam (no questions)');
        const result = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(1)]
        );
        return res.json({ exams: result.documents, total: result.total || result.documents.length });
      }

      // Fetch the exam document
      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);

      // Unify question shape and include subject for UI filtering
      const mapQuestion = (q: any, subject: string) => ({
        question: q?.question ?? q?.questionText ?? q?.text ?? '',
        options: q?.options ?? [],
        correctAnswer: q?.correctAnswer ?? q?.answer ?? '',
        explanation: q?.explanation ?? undefined,
        imageUrl: q?.imageUrl ?? q?.image ?? undefined,
        subject,
      });

      // Prefer embedded questions if present on the exam document (legacy/imported data)
      let questions: any[] = [];
      if (Array.isArray((exam as any).questions) && (exam as any).questions.length > 0) {
        questions = (exam as any).questions.map((q: any) => mapQuestion(q, String((exam as any).subject || '')));
      } else {
        // Otherwise fetch from the separate questions collection (normalized data)
        let qOffset = 0;
        while (true) {
          const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
            Query.equal('examId', examId),
            Query.limit(100),
            Query.offset(qOffset),
          ]);
          questions.push(...(qRes.documents as any[]).map((q: any) => mapQuestion(q, String((exam as any).subject || ''))));
          qOffset += qRes.documents.length;
          if (qOffset >= (qRes.total || qOffset) || qRes.documents.length === 0) break;
        }
      }

      res.json({ ...exam, questions, questionCount: Array.isArray(questions) ? questions.length : 0 });
    } catch (error) {
      console.error(error);
      // If Appwrite throws document_not_found, surface 404; else 500
      const msg = (error && typeof error === 'object' && 'type' in (error as any)) ? (error as any).type : '';
      if (msg === 'document_not_found') {
        return res.status(404).json({ message: 'Exam not found' });
      }
      res.status(500).json({ message: 'Failed to fetch exam' });
    }
  });

  // Assign an exam to classes and/or students
  app.post('/api/cbt/exams/:id/assign', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!(role === 'admin' || role === 'teacher')) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const examId = String(req.params.id);
      const { classIds = [], studentIds = [] } = (req.body || {}) as { classIds?: string[]; studentIds?: string[] };
      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);

      let allowedClassIds = classIds;
      if (role === 'teacher') {
        // Teachers can only assign to their classes
        try {
          const teacherId = sessionUser.$id;
          const mapping = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachersToClasses', [Query.equal('teacherId', String(teacherId)), Query.limit(100)]);
          const teacherClassIds = new Set(mapping.documents.map((m: any) => String(m.classId)));
          allowedClassIds = classIds.filter((cid) => teacherClassIds.has(String(cid)));
        } catch {}
      }

      const existing: string[] = Array.isArray((exam as any).assignedTo) ? (exam as any).assignedTo : [];
      const merged = Array.from(new Set([ ...existing, ...allowedClassIds.map(String), ...studentIds.map(String) ]));
      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'exams', examId, { assignedTo: merged });
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to assign exam' });
    }
  });

  // Unassign classes/students from an exam
  app.post('/api/cbt/exams/:id/unassign', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!(role === 'admin' || role === 'teacher')) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const examId = String(req.params.id);
      const { ids = [] } = (req.body || {}) as { ids?: string[] };
      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);
      const existing: string[] = Array.isArray((exam as any).assignedTo) ? (exam as any).assignedTo : [];
      const toRemove = new Set(ids.map(String));
      const next = existing.filter((id) => !toRemove.has(String(id)));
      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'exams', examId, { assignedTo: next });
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to unassign exam' });
    }
  });

  // Start an exam attempt
  app.post('/api/cbt/attempts', auth, async (req, res) => {
    try {
      const user = await req.appwrite!.account.get();
      const { examId, subjects } = req.body as { examId?: string; subjects?: string[] };
      if (!examId) return res.status(400).json({ message: 'Missing examId' });
      
      // Handle practice sessions (synthetic examId like 'practice-jamb')
      if (examId.startsWith('practice-')) {
        const type = examId.replace('practice-', '');
        // For practice mode, we create an attempt without linking to a specific exam document
        // The exam-taking page will dynamically fetch questions based on type + subjects
        const attempt = await databases.createDocument(
          APPWRITE_DATABASE_ID!,
          'examAttempts',
          ID.unique(),
          {
            examId: examId, // Store the synthetic ID
            studentId: user.$id,
            answers: JSON.stringify({}),
            score: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            timeSpent: 0,
            subjects: Array.isArray(subjects) ? subjects : undefined,
            completedAt: null,
          }
        );
        return res.status(201).json(attempt);
      }
      
      // Regular exam attempt
      const attempt = await databases.createDocument(
        APPWRITE_DATABASE_ID!,
        'examAttempts',
        ID.unique(),
        {
          examId,
          studentId: user.$id,
          answers: JSON.stringify({}),
          score: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          timeSpent: 0,
          subjects: Array.isArray(subjects) ? subjects : undefined,
          completedAt: null,
        }
      );
      res.status(201).json(attempt);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to start attempt' });
    }
  });

  // Submit answers and finish attempt
  app.post('/api/cbt/attempts/:id/submit', auth, async (req, res) => {
    try {
  const user = await req.appwrite!.account.get();
      const attemptId = req.params.id;
      const { answers } = req.body as { answers?: Record<string, any> | string };
      if (!answers) return res.status(400).json({ message: 'Missing answers' });
      // Fetch attempt and exam
      const attempt: any = await databases.getDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attemptId);
      if (attempt.studentId !== user.$id) return res.status(403).json({ message: 'Forbidden' });
      const examId = String(attempt.examId);

      // Pull questions for this exam
      let questions: any[] = [];
      let qOffset = 0;
      while (true) {
        const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
          Query.equal('examId', examId),
          Query.limit(100),
          Query.offset(qOffset),
        ]);
        questions.push(...qRes.documents);
        qOffset += qRes.documents.length;
        if (qOffset >= (qRes.total || qOffset) || qRes.documents.length === 0) break;
      }

      // Normalize answers to object
      const ans: any = typeof answers === 'string' ? JSON.parse(answers) : answers;
      let score = 0;
      let correctAnswers = 0;
      const totalQuestions = questions.length;
      for (const q of questions) {
        const selected = ans[String(q.questionNumber)] ?? ans[q.questionNumber] ?? ans[q.$id];
        if (selected != null && String(selected) === String(q.correctAnswer)) {
          score += 1; // one mark per correct answer for now
          correctAnswers += 1;
        }
      }
      // Update attempt
      const updated = await databases.updateDocument(
        APPWRITE_DATABASE_ID!,
        'examAttempts',
        attemptId,
        {
          answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
          score,
          totalQuestions,
          correctAnswers,
          completedAt: new Date().toISOString(),
        }
      );
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to submit attempt' });
    }
  });

  // Get all attempts for the current user (or specified student for admin/teacher)
  app.get('/api/cbt/attempts', auth, async (req, res) => {
    try {
      const user = await req.appwrite!.account.get();
      const { studentId } = req.query;
      
      // If studentId is provided and user is admin/teacher, fetch for that student
      // Otherwise, fetch for current user
      const targetStudentId = studentId && typeof studentId === 'string' ? studentId : user.$id;
      
      const attempts = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'examAttempts',
        [Query.equal('studentId', targetStudentId), Query.orderDesc('completedAt')]
      );
      res.json(attempts.documents);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch attempts' });
    }
  });

  // Validate subject selection before starting an exam session
  app.post('/api/cbt/exams/validate-subjects', auth, async (req, res) => {
    try {
      const { type, selectedSubjects } = req.body as { type?: string; selectedSubjects?: string[] };
      if (!type || !Array.isArray(selectedSubjects)) {
        return res.status(400).json({ message: 'type and selectedSubjects are required' });
      }
      const t = String(type).toLowerCase();
      
      console.log('[CBT] Received validation request:', { type: t, selectedSubjects });

      // Basic validation rules
      if (t === 'jamb') {
        const normalize = (s: string) => String(s || '').trim().toLowerCase();
        const isEnglish = (s: string) => {
          const v = normalize(s);
          return v === 'english' || v === 'english language' || v === 'englishlanguage' || v === 'use of english' || v.startsWith('english');
        };
        const lowerSubjects = selectedSubjects.map((s) => normalize(s));
        console.log('[CBT] JAMB validation - original subjects:', selectedSubjects);
        console.log('[CBT] JAMB validation - normalized subjects:', lowerSubjects);

        const hasEnglish = lowerSubjects.some(isEnglish);
        console.log('[CBT] JAMB validation - hasEnglish check result:', hasEnglish);
        if (!hasEnglish) {
          console.log('[CBT] JAMB validation FAILED: English not found in', lowerSubjects);
          return res.status(400).json({ message: 'English is mandatory for JAMB' });
        }

        // Count non-English subjects
        const nonEnglishCount = lowerSubjects.filter((s) => !isEnglish(s)).length;
        console.log('[CBT] JAMB validation - non-English subjects:', nonEnglishCount);
        if (nonEnglishCount !== 3) {
          return res.status(400).json({ message: 'Select exactly 3 additional subjects for JAMB' });
        }
      } else if (t === 'waec' || t === 'neco') {
        if (selectedSubjects.length < 1) {
          return res.status(400).json({ message: 'Select at least 1 subject' });
        }
      }

      // Build availability by scanning exams and checking for actual questions
      const normalize = (s: string) => String(s || '').trim().toLowerCase();
      const isEnglish = (s: string) => {
        const v = normalize(s);
        return v === 'english' || v === 'english language' || v === 'englishlanguage' || v === 'use of english' || v.startsWith('english');
      };
      const lowerSubs = selectedSubjects.map((s) => normalize(s));
      const availability: Record<string, number> = Object.fromEntries(lowerSubs.map((s) => [s, 0]));
      const englishSelectedKey = lowerSubs.find(isEnglish) || null;
      let offset = 0;
      let totalExamsScanned = 0;
      let matchingExams: any[] = [];
      
      console.log('[CBT] Validating subjects:', { type: t, selectedSubjects: lowerSubs });
      
      while (true) {
        const page = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(offset)]
        );
        totalExamsScanned += page.documents.length;
        
        for (const doc of page.documents as any[]) {
          const docType = normalize((doc as any).type || '');
          if (docType !== t) continue;
          const subj = normalize((doc as any).subject || '');

          let matches = false;
          let keyForIncrement: string | null = null;
          if (isEnglish(subj)) {
            // Treat any English synonym as a match if user selected any English variant
            matches = englishSelectedKey != null;
            keyForIncrement = englishSelectedKey;
          } else if (subj && lowerSubs.includes(subj)) {
            matches = true;
            keyForIncrement = subj;
          }

          if (matches) {
            matchingExams.push({ id: doc.$id, subject: subj, hasQuestions: false });

            // Check if this exam actually has questions
            let hasQuestions = false;
            if (Array.isArray((doc as any).questions) && (doc as any).questions.length > 0) {
              hasQuestions = true;
            } else {
              // Check questions collection
              const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
                Query.equal('examId', String(doc.$id)),
                Query.limit(1)
              ]);
              hasQuestions = qRes.total > 0;
            }

            if (hasQuestions && keyForIncrement) {
              availability[keyForIncrement] = (availability[keyForIncrement] || 0) + 1;
              matchingExams[matchingExams.length - 1].hasQuestions = true;
            }
          }
        }
        offset += page.documents.length;
        if (offset >= (page.total || offset) || page.documents.length === 0) break;
      }

      console.log('[CBT] Validation results:', { 
        totalExamsScanned, 
        matchingExams: matchingExams.length,
        availability,
        examsDetail: matchingExams 
      });

      const insufficient = Object.entries(availability).filter(([, c]) => (c as number) === 0).map(([s]) => s);
      if (insufficient.length > 0) {
        return res.status(400).json({ 
          message: `No questions found for: ${insufficient.join(', ')}. Available question sets: ${JSON.stringify(availability)}`,
          insufficient, 
          availability,
          debug: { totalExamsScanned, matchingExams }
        });
      }

      return res.json({ ok: true, availability });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to validate subjects' });
    }
  });

  // Available subjects by exam type
  app.get('/api/cbt/subjects/available', auth, async (req, res) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
      if (!type) return res.status(400).json({ message: 'type is required' });

      console.log('[CBT] Fetching available subjects for type:', type);

      // Derive from exams to ensure only subjects with questions appear (case-insensitive type)
      let subjects: Set<string> = new Set();
      const normalize = (s: string) => String(s || '').trim().toLowerCase();
      const isEnglish = (s: string) => {
        const v = normalize(s);
        return v === 'english' || v === 'english language' || v === 'englishlanguage' || v === 'use of english' || v.startsWith('english');
      };
      let offset = 0;
      let matchingExams = 0;
      
      while (true) {
        const page = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(offset)]
        );
        page.documents.forEach((doc: any) => {
          const docType = String(doc.type || '').toLowerCase();
          if (docType === type && doc.subject) {
            const subjRaw = String(doc.subject);
            const subj = isEnglish(subjRaw) ? 'English' : subjRaw;
            subjects.add(subj);
            matchingExams++;
          }
        });
        offset += page.documents.length;
        if (offset >= (page.total || offset) || page.documents.length === 0) break;
      }

      const subjectArray = Array.from(subjects).sort();
      console.log('[CBT] Found subjects for', type, ':', { 
        count: subjectArray.length, 
        subjects: subjectArray,
        matchingExams 
      });

      res.json({ subjects: subjectArray });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch subjects' });
    }
  });

  // Available years by exam type and optional subjects (single or multiple)
  app.get('/api/cbt/years/available', auth, async (req, res) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
      // Accept either multiple subject params (?subject=a&subject=b) or a CSV (?subjects=a,b)
      const subjectParamsRaw = ([] as string[])
        .concat((req.query.subject as any) || [])
        .concat(req.query.subjects ? String(req.query.subjects).split(',') : []);
      const subjectParams = subjectParamsRaw.map((s) => String(s)).filter(Boolean);
      if (!type) return res.status(400).json({ message: 'type is required' });

      const normalize = (s: string) => String(s || '').trim().toLowerCase();
      const isEnglish = (s: string) => {
        const v = normalize(s);
        return v === 'english' || v === 'english language' || v === 'englishlanguage' || v === 'use of english' || v.startsWith('english');
      };

      // Build normalized subject filters; treat any English synonym as 'english'
      let subjectFilters: string[] = subjectParams.map((s) => normalize(s));
      subjectFilters = subjectFilters.map((s) => (isEnglish(s) ? 'english' : s));
      // If no subject filters provided, we'll return union across all subjects

      // Track years per subject for intersection
      const subjectToYears = new Map<string, Set<string>>();
      const addYear = (subjKey: string, year: string) => {
        if (!subjectToYears.has(subjKey)) subjectToYears.set(subjKey, new Set());
        subjectToYears.get(subjKey)!.add(year);
      };

      let allYears: Set<string> = new Set();
      let offset = 0;
      while (true) {
        const page = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(offset)]
        );
        for (const doc of page.documents as any[]) {
          const docType = normalize((doc as any).type || '');
          if (docType !== type) continue;
          let subj = normalize((doc as any).subject || '');
          subj = isEnglish(subj) ? 'english' : subj;
          const year = String((doc as any).year || '').trim();
          if (!year) continue;
          if (subjectFilters.length > 0) {
            // Only include if this subject is among filters
            if (subjectFilters.includes(subj)) {
              addYear(subj, year);
            }
          } else {
            // No filters: collect union
            allYears.add(year);
          }
        }
        offset += page.documents.length;
        if (offset >= (page.total || offset) || page.documents.length === 0) break;
      }

      let items: string[] = [];
      if (subjectFilters.length === 0) {
        items = Array.from(allYears);
      } else {
        // Compute intersection across all filtered subjects
        const yearSets = subjectFilters
          .filter((s, idx) => subjectFilters.indexOf(s) === idx) // unique
          .map((s) => subjectToYears.get(s) || new Set<string>());
        if (yearSets.length === 0) {
          items = [];
        } else {
          // Start with first set, intersect others
          let intersection = new Set<string>(yearSets[0]);
          for (let i = 1; i < yearSets.length; i++) {
            const next = new Set<string>();
            for (const y of intersection) {
              if (yearSets[i].has(y)) next.add(y);
            }
            intersection = next;
          }
          items = Array.from(intersection);
        }
      }

      items.sort((a, b) => Number(b) - Number(a));
      res.json({ years: items });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch years' });
    }
  });

  // Autosave partial attempt payload
  app.post('/api/cbt/attempts/autosave', auth, async (req, res) => {
    try {
      const user = await req.appwrite!.account.get();
      const { attemptId, answers, timeSpent } = req.body as { attemptId?: string; answers?: any; timeSpent?: number };
      if (!attemptId) return res.status(400).json({ message: 'attemptId is required' });
      const attempt = await databases.getDocument(APPWRITE_DATABASE_ID!, 'examAttempts', String(attemptId));
      if (attempt.studentId !== user.$id) return res.status(403).json({ message: 'Forbidden' });
      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'examAttempts', String(attemptId), {
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers ?? {}),
        timeSpent: typeof timeSpent === 'number' ? timeSpent : attempt.timeSpent ?? 0,
      });
      res.json({ ok: true, attempt: updated });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to autosave attempt' });
    }
  });

  // Attempt results with simple analytics
  app.get('/api/cbt/attempts/:id/results', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      const attemptId = String(req.params.id);
      const attempt: any = await databases.getDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attemptId);

      if (!(role === 'admin' || role === 'teacher' || attempt.studentId === sessionUser.$id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Pull questions for exam
      const examId = String(attempt.examId);
      let questions: any[] = [];
      let qOffset = 0;
      while (true) {
        const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
          Query.equal('examId', examId),
          Query.limit(100),
          Query.offset(qOffset),
        ]);
        questions.push(...qRes.documents);
        qOffset += qRes.documents.length;
        if (qOffset >= (qRes.total || qOffset) || qRes.documents.length === 0) break;
      }

      const answers = typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers || {};
      // Assume answers is an object mapping questionNumber -> selectedOption
      let correct = 0;
      const perQuestion = questions.map((q) => {
        const selected = answers[String(q.questionNumber)] ?? answers[q.questionNumber] ?? answers[q.$id];
        const isCorrect = selected != null && String(selected) === String(q.correctAnswer);
        if (isCorrect) correct += 1;
        return {
          questionNumber: q.questionNumber,
          selected,
          correctAnswer: q.correctAnswer,
          isCorrect,
        };
      });
      const total = questions.length;
      const score = correct; // simple score; refined grading can be added later
      res.json({
        summary: { total, correct, score, percent: total ? (correct / total) * 100 : 0 },
        perQuestion,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch attempt results' });
    }
  });

  // Basic class analytics (avg score across attempts for students in a class)
  app.get('/api/cbt/analytics/class/:classId', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!(role === 'admin' || role === 'teacher')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const classId = String(req.params.classId);
      // Get students in class
      const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [
        Query.equal('classId', classId),
        Query.limit(100),
      ]);
      const studentIds = students.documents.map((s: any) => String(s.$id));
      if (studentIds.length === 0) return res.json({ classId, averageScore: 0, attemptCount: 0 });

      // Fetch attempts by studentId in chunks (Appwrite 'equal' supports array of values)
      const attemptsRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
        Query.equal('studentId', studentIds),
        Query.limit(100),
      ]);
      const attempts = attemptsRes.documents as any[];
      const attemptCount = attempts.length;
      const totalScore = attempts.reduce((sum, a: any) => sum + (a.score || 0), 0);
      const averageScore = attemptCount ? totalScore / attemptCount : 0;
      res.json({ classId, averageScore, attemptCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to compute class analytics' });
    }
  });

  // DEBUG: Test Appwrite connectivity from backend
  app.get('/api/debug/appwrite', async (req, res) => {
    try {
      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'exams', [Query.limit(1)]);
      res.json({ success: true, count: result.documents.length });
    } catch (error) {
      console.error('Appwrite connectivity test failed:', error);
      let errorMsg = 'Unknown error';
      if (typeof error === 'object' && error && 'message' in error) {
        errorMsg = (error as any).message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error) {
        errorMsg = String(error);
      }
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // DEBUG: List all exam types and subjects with question counts
  app.get('/api/debug/exam-subjects', async (req, res) => {
    try {
      const examsByType: Record<string, any[]> = {};
      let offset = 0;
      
      while (true) {
        const page = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(offset)]
        );
        
        for (const doc of page.documents as any[]) {
          const type = String(doc.type || 'unknown').toLowerCase();
          const subject = String(doc.subject || 'unknown');
          
          if (!examsByType[type]) examsByType[type] = [];
          
          // Check for questions
          let questionCount = 0;
          if (Array.isArray(doc.questions)) {
            questionCount = doc.questions.length;
          } else {
            const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
              Query.equal('examId', String(doc.$id)),
              Query.limit(1)
            ]);
            questionCount = qRes.total || 0;
          }
          
          examsByType[type].push({
            id: doc.$id,
            title: doc.title,
            subject,
            questionCount,
            hasQuestions: questionCount > 0
          });
        }
        
        offset += page.documents.length;
        if (offset >= (page.total || offset) || page.documents.length === 0) break;
      }
      
      // Summary
      const summary: Record<string, any> = {};
      for (const [type, exams] of Object.entries(examsByType)) {
        const subjects = new Set(exams.map(e => e.subject.toLowerCase()));
        const withQuestions = exams.filter(e => e.hasQuestions);
        summary[type] = {
          totalExams: exams.length,
          uniqueSubjects: Array.from(subjects),
          examsWithQuestions: withQuestions.length,
          examsWithoutQuestions: exams.length - withQuestions.length
        };
      }
      
      res.json({ summary, details: examsByType });
    } catch (error) {
      console.error('Failed to analyze exam subjects:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // DEBUG: Test Appwrite connectivity for students collection
  app.get('/api/debug/students', async (req, res) => {
    try {
      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [Query.limit(1)]);
      res.json({ success: true, count: result.documents.length, student: result.documents[0] });
    } catch (error) {
      let errorMsg = 'Unknown error';
      if (typeof error === 'object' && error && 'message' in error) {
        errorMsg = (error as any).message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error) {
        errorMsg = String(error);
      }
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  return httpServer;
}