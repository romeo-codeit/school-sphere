import { Request, Response } from 'express';
import { auth } from '../middleware';
import { sessionAuth, examSecurity } from '../middleware/sessionAuth';
import { logError, logDebug } from '../logger';
import { fetchPracticeExamQuestions } from '../utils/practiceExam';
import { Client, ID, Databases, Query } from 'node-appwrite';
import { cache, cacheKeys, CACHE_TTL } from '../utils/cache';
import { validateBody, validateQuery } from '../middleware/validation';
import NotificationService from '../services/notificationService';
import {
  examAttemptStartSchema,
  examAttemptSubmitSchema,
  examAttemptAutosaveSchema,
  subjectValidationSchema,
  examQuerySchema,
  subjectQuerySchema,
  yearQuerySchema,
  attemptQuerySchema,
} from '../validation/schemas';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const notificationService = new NotificationService(databases);

// Ensure examAttempts collection has the attributes used by the CBT flows
async function ensureExamAttemptAttributes() {
  const dbId = APPWRITE_DATABASE_ID!;
  const collectionId = 'examAttempts';

  const safeCreateStringAttribute = async (
    id: string,
    size = 255,
    required = false,
    array = false
  ) => {
    try {
      // @ts-ignore - SDK typing variations across versions
      await databases.createStringAttribute(dbId, collectionId, id, size, required, undefined, array);
    } catch (e: any) {
      // Ignore permission errors in read-only environments and 409 conflicts
      if (!(e && (e.code === 409 || e.code === 401))) {
        // Swallow other errors to avoid blocking requests
      }
    }
  };

  const safeCreateIntegerAttribute = async (
    id: string,
    required = false,
    array = false
  ) => {
    try {
      // @ts-ignore
      await databases.createIntegerAttribute(dbId, collectionId, id, required, undefined, undefined, undefined, array);
    } catch (e: any) {
      if (!(e && (e.code === 409 || e.code === 401))) {
      }
    }
  };

  const safeCreateBooleanAttribute = async (
    id: string,
    required = false,
    array = false
  ) => {
    try {
      // @ts-ignore
      await databases.createBooleanAttribute(dbId, collectionId, id, required, undefined, array);
    } catch (e: any) {
      if (!(e && (e.code === 409 || e.code === 401))) {
      }
    }
  };

  const safeCreateJsonAttribute = async (
    id: string,
    required = false,
    array = false
  ) => {
    try {
      // @ts-ignore
      await databases.createJsonAttribute(dbId, collectionId, id, required, undefined, array);
    } catch (e: any) {
      if (!(e && (e.code === 409 || e.code === 401))) {
      }
    }
  };

  const safeCreateDatetimeAttribute = async (
    id: string,
    required = false,
    array = false
  ) => {
    try {
      // @ts-ignore
      await databases.createDatetimeAttribute(dbId, collectionId, id, required, undefined, array);
    } catch (e: any) {
      if (!(e && (e.code === 409 || e.code === 401))) {
      }
    }
  };

  // Attributes referenced by CBT flows
  await Promise.all([
    safeCreateStringAttribute('status', 50, false, false), // 'in_progress' | 'completed'
    safeCreateJsonAttribute('answers', false, false),
    safeCreateDatetimeAttribute('startedAt', false, false),
    safeCreateDatetimeAttribute('submittedAt', false, false),
    safeCreateDatetimeAttribute('lastSavedAt', false, false),
    safeCreateIntegerAttribute('percentage', false, false),
    safeCreateBooleanAttribute('passed', false, false),
    safeCreateStringAttribute('practiceYear', 10, false, false),
    safeCreateStringAttribute('practicePaperType', 50, false, false),
  ]);
}

// Helpers to adapt to environments where 'answers' might be defined as JSON or STRING
async function getAnswersAttributeType(): Promise<'json' | 'string' | null> {
  try {
    const coll: any = await databases.getCollection(APPWRITE_DATABASE_ID!, 'examAttempts');
    const attrs: any[] = Array.isArray(coll?.attributes) ? coll.attributes : [];
    const answersAttr = attrs.find((a: any) => a?.key === 'answers' || a?.id === 'answers' || a?.$id === 'answers');
    if (!answersAttr) return null;
    const t = String(answersAttr?.type || '').toLowerCase();
    return t === 'json' ? 'json' : t === 'string' ? 'string' : null;
  } catch {
    return null;
  }
}

function coerceAnswersForStorage(input: any, attrType: 'json' | 'string' | null): any {
  // If we definitively know it's JSON, store as object
  if (attrType === 'json') {
    if (typeof input === 'string') {
      try { return JSON.parse(input); } catch { return {}; }
    }
    return input || {};
  }
  // Default to STRING storage for maximum compatibility with legacy schemas
  try {
    return typeof input === 'string' ? input : JSON.stringify(input || {});
  } catch {
    return '{}';
  }
}

export const registerCBTRoutes = (app: any) => {
  // Best-effort schema ensure on startup (non-blocking)
  void ensureExamAttemptAttributes();
  // Get exams (CBT focus). Supports filters and full pagination.
  // Make the general exams listing public to allow UI to render without auth
  app.get('/api/cbt/exams', validateQuery(examQuerySchema), async (req: Request, res: Response) => {
    try {
      const limitParam = String(req.query.limit || '50');
      const withQuestions = req.query.withQuestions !== 'false'; // default true
      const fetchAll = limitParam === 'all';

      // Build filter queries without limit; we'll paginate with cursor
      const baseQueries: any[] = [Query.orderAsc('$id')];
      if (req.query.type) baseQueries.push(Query.equal('type', String(req.query.type)));
      if (req.query.subject) baseQueries.push(Query.equal('subject', String(req.query.subject)));
      if (req.query.year) baseQueries.push(Query.equal('year', String(req.query.year)));

      // Cache key
      const filters = { type: req.query.type, subject: req.query.subject, year: req.query.year, limit: limitParam, withQuestions };
      const cacheKey = cacheKeys.exams(filters);
      const cached = cache.get(cacheKey);
      if (cached) {
        logDebug('Returning cached exams data', { cacheKey });
        return res.json(cached);
      }

      const exams: any[] = [];
      let total = 0;
      let lastId: string | null = null;
      const numericLimit = fetchAll ? Number.POSITIVE_INFINITY : Math.max(1, Math.min(1000, parseInt(limitParam, 10) || 50));

      // Page through exams by cursor
      while (exams.length < numericLimit) {
        const q = [...baseQueries, Query.limit(Math.min(100, numericLimit - exams.length))];
        if (lastId) q.push(Query.cursorAfter(lastId));
        const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'exams', q);
        const docs = (page.documents || []) as any[];
        if (docs.length === 0) {
          total = page.total || exams.length;
          break;
        }
        exams.push(...docs);
        total = page.total || total;
        lastId = String(docs[docs.length - 1].$id);
        if (!fetchAll && exams.length >= numericLimit) break;
      }

      // Attach minimal question info only when requested
      let examsWithQuestions: any[] = [];
      const skipQuestionCounts = !withQuestions || fetchAll; // skip per-exam counts when fetching ALL or when disabled
      if (!skipQuestionCounts) {
        examsWithQuestions = await Promise.all(
          exams.map(async (exam: any) => {
            try {
              let questionCount = 0;
              if (Array.isArray(exam.questions)) {
                questionCount = exam.questions.length;
              } else {
                const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
                  Query.equal('examId', String(exam.$id)),
                  Query.limit(1),
                ]);
                questionCount = qRes.total || 0;
              }
              return { ...exam, questions: [], questionCount, hasQuestions: questionCount > 0 };
            } catch {
              return { ...exam, questions: [], questionCount: 0, hasQuestions: false };
            }
          })
        );
      } else {
        examsWithQuestions = exams.map((exam) => ({ ...exam, questions: [], questionCount: undefined }));
      }

      const response = { exams: examsWithQuestions, total };
      cache.set(cacheKey, response, CACHE_TTL.EXAMS);
      return res.json(response);
    } catch (error) {
      logError('Failed to fetch exams', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // NOTE: Assigned exams concept removed. No /api/cbt/exams/assigned route.

  // Get available exams (practice hub), subscription-gated for standardized types
  // Make available exams listing require only a basic session (or relax entirely if needed)
  app.get('/api/cbt/exams/available', sessionAuth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Get all exams with cursor-based pagination to avoid 100 cap
      const allExams: any[] = [];
      try {
        let lastId: string | null = null;
        while (true) {
          const queries = [Query.orderAsc('$id'), Query.limit(100)];
          if (lastId) queries.push(Query.cursorAfter(lastId));
          const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'exams', queries);
          const docs = (page.documents || []) as any[];
          if (docs.length === 0) break;
          allExams.push(...docs);
          lastId = String(docs[docs.length - 1].$id);
        }
      } catch (err: any) {
        console.error('exams collection unavailable:', err?.message || err);
        return res.json({ exams: [], total: 0 });
      }
      
      // No assigned exams concept; just filter for standardized practice types
      const assignedExamIds = new Set<string>();

      // Filter and add question count
      const availableExams = await Promise.all(
        allExams
          .filter((exam: any) => !assignedExamIds.has(exam.$id))
          .map(async (exam: any) => {
            let questionCount = 0;
            if (Array.isArray(exam.questions)) {
              questionCount = exam.questions.length;
            } else {
              try {
                const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
                  Query.equal('examId', exam.$id),
                  Query.limit(1)
                ]);
                questionCount = qRes.total || 0;
              } catch (e) {
                questionCount = 0;
              }
            }
            
            return {
              ...exam,
              questionCount,
              hasQuestions: questionCount > 0
            };
          })
      );

      const standardizedExams = availableExams.filter(exam => exam.hasQuestions);
      return res.json({ exams: standardizedExams, total: standardizedExams.length });
    } catch (error) {
      logError('Failed to fetch available exams', error);
      res.status(500).json({ message: 'Failed to fetch available exams' });
    }
  });

  // Get specific exam with questions
  // Allow practice exam generation without strict auth; real internal exams still require auth when starting attempts
  // Public: practice exams must be retrievable without auth
  app.get('/api/cbt/exams/:id', async (req: Request, res: Response) => {
    try {
      const examId = String(req.params.id || '').trim();
      logDebug('GET /api/cbt/exams/:id', { id: examId });

      // Handle practice sessions (synthetic examId like 'practice-jamb')
      if (examId.startsWith('practice-')) {
        const type = examId.replace('practice-', '');
        const subjects = req.query.subjects ? String(req.query.subjects).split(',') : [];
        const yearParam = req.query.year ? String(req.query.year) : undefined;
  const rawPaperType = req.query.paperType ? String(req.query.paperType) : undefined;
  const paperTypeParam = rawPaperType ? ((rawPaperType === 'objective' || rawPaperType === 'obj') ? 'obj' : rawPaperType) as 'objective' | 'theory' | 'obj' : undefined;
        const selectedSubjects = subjects.map((s) => s.trim()).filter(Boolean);

        if (selectedSubjects.length === 0) {
          return res.status(400).json({ message: 'At least one subject must be selected for practice exams' });
        }

        // Generate practice exam
        const questions = await fetchPracticeExamQuestions(databases, type, selectedSubjects, yearParam, paperTypeParam);

        if (questions.length === 0) {
          return res.status(404).json({ message: 'No questions found for the selected subjects and criteria' });
        }

        // Sample questions for practice mode - limit to reasonable amounts
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

        // JAMB: ~12-13 questions per subject (4 subjects = ~50 total, similar to real exam)
        if (type === 'jamb') {
          const questionsPerSubject = Math.max(10, Math.floor(50 / selectedSubjects.length));
          const subjectGroups = new Map<string, any[]>();
          questions.forEach((q: any) => {
            const subj = String(q.subject || '').trim();
            if (!subjectGroups.has(subj)) subjectGroups.set(subj, []);
            subjectGroups.get(subj)!.push(q);
          });
          
          finalQuestions = [];
          selectedSubjects.forEach(subj => {
            const subjQuestions = subjectGroups.get(subj) || [];
            finalQuestions.push(...sample(subjQuestions, questionsPerSubject));
          });
        } else if (type === 'waec' || type === 'neco') {
          // WAEC/NECO: ~15-20 questions per subject
          const questionsPerSubject = Math.max(15, Math.floor(60 / selectedSubjects.length));
          const subjectGroups = new Map<string, any[]>();
          questions.forEach((q: any) => {
            const subj = String(q.subject || '').trim();
            if (!subjectGroups.has(subj)) subjectGroups.set(subj, []);
            subjectGroups.get(subj)!.push(q);
          });
          
          finalQuestions = [];
          selectedSubjects.forEach(subj => {
            const subjQuestions = subjectGroups.get(subj) || [];
            finalQuestions.push(...sample(subjQuestions, questionsPerSubject));
          });
        }

        // Shuffle questions
        finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);

        const practiceExam = {
          $id: examId,
          title: `${type.toUpperCase()} Practice Session`,
          type: type,
          subject: selectedSubjects.join(', '),
          year: yearParam || 'Mixed',
          duration: Math.max(60, Math.ceil(finalQuestions.length * 1.5)), // ~1.5 minutes per question
          questions: finalQuestions,
          questionCount: finalQuestions.length,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        return res.json(practiceExam);
      }

      // Basic validation for missing/placeholder ids
      if (!examId || examId === 'undefined' || examId === 'null' || examId.length < 10) {
        return res.status(400).json({ message: 'Invalid exam ID' });
      }

      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);
      
      let questions = [];
      let questionCount = 0;

      // Check if questions are embedded or separate
      if (Array.isArray(exam.questions)) {
        questions = exam.questions;
        questionCount = questions.length;
      } else {
        // Fetch questions separately
        const questionsResult = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
          Query.equal('examId', examId),
          Query.orderAsc('questionNumber')
        ]);
        questions = questionsResult.documents;
        questionCount = questions.length;
      }

      if (questionCount === 0) {
        return res.status(404).json({ message: 'No questions found for this exam' });
      }

      res.json({ ...exam, questions, questionCount: Array.isArray(questions) ? questions.length : 0 });
    } catch (error) {
      logError('Failed to fetch exam', error);
      res.status(500).json({ message: 'Failed to fetch exam' });
    }
  });

  // NOTE: Assigned exams concept removed. No assign/unassign routes.

  // Start exam attempt
  // Public for practice-* examId (no access gate); still gated for real internal exams
  app.post('/api/cbt/attempts', validateBody(examAttemptStartSchema), async (req: Request, res: Response) => {
    try {
      // Ensure required attributes exist before any queries/creates that reference them
      await ensureExamAttemptAttributes();
      const { examId, subjects, year, paperType } = req.body as { examId?: string; subjects?: string[]; year?: string; paperType?: string };
      const answersAttrType = await getAnswersAttributeType();
      if (!examId) return res.status(400).json({ message: 'Missing examId' });
      const isPractice = String(examId).startsWith('practice-');

      let user: any = null;
      let role: string | null = null;
      try {
        user = await req.appwrite?.account.get();
        role = (user as any)?.prefs?.role || null;
      } catch {}

      // Enforce access only for real exams; practice-* is open
      if (!isPractice) {
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        if (role !== 'admin' && role !== 'teacher') {
          const assignments = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAssignments', [
            Query.equal('examId', examId),
            Query.equal('userId', user.$id),
            Query.limit(1)
          ]);
          if (assignments.documents.length === 0) {
            return res.status(403).json({ message: 'You do not have access to this exam' });
          }
        }
      }

      // Get exam details or synthesize practice exam metadata
      let exam: any = null;
      if (isPractice) {
        // synthesize a minimal exam-like record for practice flows
        exam = {
          $id: examId,
          type: String(examId.replace('practice-', '')).toLowerCase(),
          subject: (subjects || []).join(', '),
          year: year || 'Mixed',
        };
      } else {
        exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);
      }
      
      // Check if user already has an active attempt (only for authenticated users)
      if (user?.$id) {
        const existingAttempts = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
          Query.equal('studentId', user.$id),
          Query.equal('examId', examId),
          Query.equal('status', 'in_progress'),
          Query.limit(1)
        ]);
        if (existingAttempts.documents.length > 0) {
          return res.status(400).json({ message: 'You already have an active attempt for this exam' });
        }
      }

      // Create new attempt; support both JSON and STRING answers based on existing schema
      const baseAttempt = {
        studentId: user?.$id || 'guest',
        examId: examId,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        subjects: subjects || [],
        practiceYear: year || undefined,
        practicePaperType: paperType || undefined,
        timeSpent: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        percentage: 0,
      } as any;

      const attemptWithJson = { ...baseAttempt, answers: {} };
      const attemptWithString = { ...baseAttempt, answers: '{}' };

      let attempt: any;
      try {
        const payload = answersAttrType === 'json' ? attemptWithJson : attemptWithString;
        attempt = await databases.createDocument(APPWRITE_DATABASE_ID!, 'examAttempts', ID.unique(), payload);
      } catch (e: any) {
        // Fallback to alternate representation if schema differs or answers is required
        const fallback = answersAttrType === 'json' ? attemptWithString : attemptWithJson;
        attempt = await databases.createDocument(APPWRITE_DATABASE_ID!, 'examAttempts', ID.unique(), fallback);
      }
      res.status(201).json(attempt);
    } catch (error) {
      logError('Failed to start attempt', error);
      res.status(500).json({ message: 'Failed to start attempt' });
    }
  });

  // Submit exam attempt
  app.post('/api/cbt/attempts/:id/submit', auth, validateBody(examAttemptSubmitSchema), async (req: Request, res: Response) => {
    try {
      const user = await req.appwrite!.account.get();
      const attemptId = req.params.id;
      const { answers } = req.body as { answers?: Record<string, any> | string };
      if (!answers) return res.status(400).json({ message: 'Missing answers' });

      // Get the attempt
      const attempt = await databases.getDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attemptId);
      
      if (attempt.studentId !== user.$id) {
        return res.status(403).json({ message: 'You can only submit your own attempts' });
      }

      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ message: 'This attempt has already been submitted' });
      }

      // Calculate score
      let score = 0;
      let totalQuestions = 0;
      let examTitle = 'Exam';
      
      try {
        const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', attempt.examId);
        examTitle = String((exam as any).title || exam.$id || 'Exam');
        const questions = Array.isArray(exam.questions) ? exam.questions : [];
        
        totalQuestions = questions.length;
        
        for (const question of questions) {
          const userAnswer = (answers as any)[question.id] || (answers as any)[question.$id];
          if (userAnswer === question.correctAnswer) {
            score++;
          }
        }
      } catch (e) {
        // If we can't calculate score, just mark as submitted
        score = 0;
        totalQuestions = 0;
      }

      const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const passed = percentage >= 50; // 50% passing grade

      // Update attempt
      const answersAttrType3 = await getAnswersAttributeType();
      const storedAnswers = coerceAnswersForStorage(answers, answersAttrType3);
      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attemptId, {
        status: 'completed',
        submittedAt: new Date().toISOString(),
        answers: storedAnswers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        passed: passed,
      });

      try {
        await notificationService.notifyExamSubmitted(user.$id, examTitle, score, totalQuestions, attemptId);
      } catch (error) {
        logError('Failed to send exam submission notification', error);
      }

      res.json(updated);
    } catch (error) {
      logError('Failed to submit attempt', error);
      res.status(500).json({ message: 'Failed to submit attempt' });
    }
  });

  // Get user's exam attempts
  app.get('/api/cbt/attempts', auth, validateQuery(attemptQuerySchema), async (req: Request, res: Response) => {
    try {
      const user = await req.appwrite!.account.get();
      const { studentId } = req.query;
      
      // If studentId is provided and user is admin/teacher, fetch for that student
      let targetStudentId = user.$id;
      if (studentId && (user as any)?.prefs?.role === 'admin') {
        targetStudentId = String(studentId);
      }

      const attempts = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
        Query.equal('studentId', targetStudentId),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]);

      res.json(attempts.documents);
    } catch (error) {
      logError('Failed to fetch attempts', error);
      res.status(500).json({ message: 'Failed to fetch attempts' });
    }
  });

  // Validate subjects for exam creation
  // Make validation public so guests can plan practice sessions
  app.post('/api/cbt/exams/validate-subjects', validateBody(subjectValidationSchema), async (req: Request, res: Response) => {
    try {
      const { type, selectedSubjects, year } = req.body as { type?: string; selectedSubjects?: string[]; year?: string };
      if (!type || !Array.isArray(selectedSubjects)) {
        return res.status(400).json({ message: 'type and selectedSubjects are required' });
      }

      const validationResults: Record<string, any> = {};

      for (const subject of selectedSubjects) {
        try {
          // Check if there are questions for this subject/type/year combination
          const queries = [
            Query.equal('subject', subject),
            Query.equal('type', type),
            Query.limit(1)
          ];

          if (year) {
            queries.push(Query.equal('year', year));
          }

          const questionsResult = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', queries);
          const questionCount = questionsResult.total || 0;

          validationResults[subject] = {
            available: questionCount > 0,
            questionCount: questionCount,
            message: questionCount > 0 
              ? `${questionCount} questions available` 
              : 'No questions found for this subject/type/year combination'
          };
        } catch (error) {
          validationResults[subject] = {
            available: false,
            questionCount: 0,
            message: 'Error checking questions availability',
            error: (error as Error).message
          };
        }
      }

      const allAvailable = Object.values(validationResults).every((result: any) => result.available);
      const totalQuestions = Object.values(validationResults).reduce((sum: number, result: any) => sum + result.questionCount, 0);

      res.json({
        valid: allAvailable,
        totalQuestions,
        results: validationResults,
        message: allAvailable 
          ? `All subjects validated. Total questions: ${totalQuestions}`
          : 'Some subjects have insufficient questions'
      });
    } catch (error) {
      logError('Failed to validate subjects', error);
      res.status(500).json({ message: 'Failed to validate subjects' });
    }
  });

  // Get available subjects (derived from exams collection)
  // Make subjects listing public and do NOT filter by exam-level paper_type
  app.get('/api/cbt/subjects/available', validateQuery(subjectQuerySchema), async (req: Request, res: Response) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
  const rawPaperType = req.query.paperType ? String(req.query.paperType) : undefined; // 'obj' or 'theory' or 'objective'
  const paperTypeParam = rawPaperType ? ((rawPaperType === 'objective' || rawPaperType === 'obj') ? 'obj' : rawPaperType) : undefined;
      if (!type) return res.status(400).json({ message: 'type is required' });

      // Check cache first
      const cacheKey = cacheKeys.subjects(type);
      const cached = cache.get(cacheKey);
      if (cached) {
        logDebug('Returning cached subjects data', { cacheKey });
        return res.json(cached);
      }

      // Normalize helpers
      const normalize = (s: string) => String(s || '').trim().toLowerCase();
      const normalizeKey = (s: string) => normalize(s).replace(/[^a-z]/g, '');
      const isEnglish = (s: string) => {
        const v = normalize(s);
        return v === 'english' || v === 'english language' || v === 'englishlanguage' || v === 'use of english' || v.startsWith('english');
      };

      const subjectMap = new Map<string, string>(); // key -> display label
      let offset = 0;
      while (true) {
        const page = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(offset)]
        );
        const docs = (page.documents || []) as any[];
        if (docs.length === 0) break;
        for (const doc of docs) {
          const docType = String((doc as any).type || '').toLowerCase();
          const titleLower = String((doc as any).title || '').toLowerCase();
          if (!(docType === type || titleLower.includes(type))) continue;
          const subjRaw = String((doc as any).subject || '').trim();
          if (!subjRaw) continue;
          const key = isEnglish(subjRaw) ? 'english' : normalizeKey(subjRaw);
          const display = key === 'english' ? 'English' : subjRaw;
          if (!subjectMap.has(key)) subjectMap.set(key, display);
        }
        offset += docs.length;
        if (offset >= (page.total || offset)) break;
      }

      // Fallback to questions collection if no subjects found from exams
      if (subjectMap.size === 0) {
        const requestedPaperType = paperTypeParam ? (paperTypeParam.toLowerCase() === 'objective' ? 'obj' : paperTypeParam.toLowerCase()) : undefined;
        const canonicalSubject = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '').replace(/^english(language)?|useofenglish.*/,'english');
        const resolveQuestionPaperType = (q: any): 'obj' | 'theory' => {
          const ansUrl = String(q?.answer_url ?? q?.answerUrl ?? '');
          if (ansUrl.includes('type=theory')) return 'theory';
          if (ansUrl.includes('type=obj') || ansUrl.includes('type=objective')) return 'obj';
          const raw = (q?.paper_type ?? q?.paperType ?? '') as string;
          const n = String(raw || '').toLowerCase();
          if (n === 'objective' || n === 'obj') return 'obj';
          if (n === 'theory') return 'theory';
          const opts = (q?.options ?? {}) as any;
          const hasOptions = Array.isArray(opts) ? opts.length > 0 : (opts && typeof opts === 'object' && Object.keys(opts).length > 0);
          return hasOptions ? 'obj' : 'theory';
        };
        const matchesType = (q: any): boolean => {
          const qt = String(q?.type || q?.examType || '').toLowerCase();
          const ansUrl = String(q?.answer_url ?? q?.answerUrl ?? '').toLowerCase();
          return qt === type || qt.includes(type) || ansUrl.includes(`exam_type=${type}`);
        };

        let qOffset = 0;
        while (true) {
          const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
            Query.limit(100),
            Query.offset(qOffset),
          ]);
          const docs = page.documents || [];
          if (docs.length === 0) break;
          for (const q of docs) {
            if (!matchesType(q)) continue;
            if (requestedPaperType && resolveQuestionPaperType(q) !== requestedPaperType) continue;
            const subjRaw = String((q as any).subject || '').trim();
            if (!subjRaw) continue;
            const key = canonicalSubject(subjRaw) || normalizeKey(subjRaw);
            const display = key === 'english' ? 'English' : subjRaw;
            if (!subjectMap.has(key)) subjectMap.set(key, display);
          }
          qOffset += docs.length;
          if (qOffset >= (page.total || qOffset)) break;
        }
      }

      const subjectArray = Array.from(subjectMap.values()).sort();
      const response = { subjects: subjectArray };
      cache.set(cacheKey, response, CACHE_TTL.SUBJECTS);
      return res.json(response);
    } catch (error) {
      logError('Failed to fetch subjects', error);
      res.status(500).json({ message: 'Failed to fetch subjects' });
    }
  });

  // Get available years (union across selected subjects) derived from exams
  // Make years listing public and do NOT filter by exam-level paper_type
  app.get('/api/cbt/years/available', validateQuery(yearQuerySchema), async (req: Request, res: Response) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
  const rawPaperType = req.query.paperType ? String(req.query.paperType) : undefined; // 'obj' or 'theory' or 'objective'
  const paperTypeParam = rawPaperType ? ((rawPaperType === 'objective' || rawPaperType === 'obj') ? 'obj' : rawPaperType) : undefined;
      const subjectParamsRaw = ([] as string[])
        .concat((req.query.subject as any) || [])
        .concat(req.query.subjects ? String(req.query.subjects).split(',') : []);
      const subjectParams = subjectParamsRaw.map((s) => String(s)).filter(Boolean);
      if (!type) return res.status(400).json({ message: 'type is required' });

      const normalize = (s: string) => String(s || '').trim().toLowerCase();
      const normalizeKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');
      const canonicalSubject = (s: string) => {
        const k = normalizeKey(s);
        if (k.startsWith('english') || k.includes('useofenglish')) return 'english';
        if (k === 'agric' || k.startsWith('agric') || k.includes('agriculturalscience')) return 'agriculturalscience';
        return k;
      };

      const subjectFilters: string[] = subjectParams.map((s) => canonicalSubject(s));
      const subjectToYears = new Map<string, Set<string>>();
      const addYear = (subjKey: string, year: string) => {
        if (!subjectToYears.has(subjKey)) subjectToYears.set(subjKey, new Set());
        subjectToYears.get(subjKey)!.add(year);
      };

      let allYears: Set<string> = new Set();
      let offset = 0;
      let lastTotal = Number.POSITIVE_INFINITY;
      
      // Add error handling and retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          let docs: any[] = [];
          let pageCount = 0;
          
          const page = await databases.listDocuments(
            APPWRITE_DATABASE_ID!,
            'exams',
            [Query.limit(100), Query.offset(offset)]
          );
          docs = (page.documents || []) as any[];
          pageCount = docs.length;
          lastTotal = typeof (page as any).total === 'number' ? (page as any).total : lastTotal;
          
          if (docs.length === 0) break;
          
          for (const doc of docs) {
            const docType = normalize((doc as any).type || '');
            const titleLower = normalize((doc as any).title || '');
            if (!(docType === type || titleLower.includes(type))) continue;
            // Do not filter by exam-level paper_type; many datasets store per-question only
            const subj = canonicalSubject((doc as any).subject || '');
            const year = String((doc as any).year || '').trim();
            if (!year) continue;
            if (subjectFilters.length > 0) {
              if (subjectFilters.includes(subj)) addYear(subj, year);
            } else {
              allYears.add(year);
            }
          }
          
          offset += pageCount;
          if (offset >= lastTotal) break;
          retryCount = 0; // Reset retry count on successful page
        } catch (e) {
          retryCount++;
          logError(`Failed to fetch years (attempt ${retryCount})`, e);
          if (retryCount >= maxRetries) {
            // Return cached data or empty result instead of error
            logError('Max retries exceeded for years fetch, returning empty result', e);
            return res.json({ years: [] });
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      let items: string[] = [];
      if (subjectFilters.length === 0) {
        items = Array.from(allYears);
      } else {
        const union = new Set<string>();
        subjectFilters.filter((s, i) => subjectFilters.indexOf(s) === i).forEach((s) => {
          const set = subjectToYears.get(s);
          if (set) set.forEach((y) => union.add(y));
        });
        items = Array.from(union);
      }

      // Fallback to scanning questions if no years found
      if (items.length === 0) {
        const requestedPaperType = paperTypeParam ? (paperTypeParam.toLowerCase() === 'objective' ? 'obj' : paperTypeParam.toLowerCase()) : undefined;
        const matchesType = (q: any): boolean => {
          const qt = String(q?.type || q?.examType || '').toLowerCase();
          const ansUrl = String(q?.answer_url ?? q?.answerUrl ?? '').toLowerCase();
          return qt === type || qt.includes(type) || ansUrl.includes(`exam_type=${type}`);
        };
        const canonicalSubject = (s: string) => normalizeKey(s).replace(/^english(language)?|useofenglish.*/,'english');
        const resolveQuestionPaperType = (q: any): 'obj' | 'theory' => {
          const ansUrl = String(q?.answer_url ?? q?.answerUrl ?? '');
          if (ansUrl.includes('type=theory')) return 'theory';
          if (ansUrl.includes('type=obj') || ansUrl.includes('type=objective')) return 'obj';
          const raw = (q?.paper_type ?? q?.paperType ?? '') as string;
          const n = String(raw || '').toLowerCase();
          if (n === 'objective' || n === 'obj') return 'obj';
          if (n === 'theory') return 'theory';
          const opts = (q?.options ?? {}) as any;
          const hasOptions = Array.isArray(opts) ? opts.length > 0 : (opts && typeof opts === 'object' && Object.keys(opts).length > 0);
          return hasOptions ? 'obj' : 'theory';
        };
        const yearsSet = new Set<string>();
        let qOffset = 0;
        while (true) {
          const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
            Query.limit(100),
            Query.offset(qOffset),
          ]);
          const docs = page.documents || [];
          if (docs.length === 0) break;
          for (const q of docs) {
            if (!matchesType(q)) continue;
            if (requestedPaperType && resolveQuestionPaperType(q) !== requestedPaperType) continue;
            const subjKey = canonicalSubject(String((q as any).subject || ''));
            if (subjectFilters.length > 0 && !subjectFilters.includes(subjKey)) continue;
            const y = String((q as any).year || (q as any).questionYear || '').trim();
            if (y) yearsSet.add(y);
          }
          qOffset += docs.length;
          if (qOffset >= (page.total || qOffset)) break;
        }
        items = Array.from(yearsSet);
      }

      items.sort((a, b) => Number(b) - Number(a));
      return res.json({ years: items });
    } catch (error) {
      logError('Failed to fetch years', error);
      res.status(500).json({ message: 'Failed to fetch years' });
    }
  });

  // Get year availability per subject (array of entries) derived from exams
  // Make years availability public and do NOT filter by exam-level paper_type
  app.get('/api/cbt/years/availability', validateQuery(yearQuerySchema), async (req: Request, res: Response) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
      const paperTypeParam = req.query.paperType ? String(req.query.paperType) : undefined; // 'obj' or 'theory'
      const subjectParamsRaw = ([] as string[])
        .concat((req.query.subject as any) || [])
        .concat(req.query.subjects ? String(req.query.subjects).split(',') : []);
      const subjectParams = subjectParamsRaw.map((s) => String(s)).filter(Boolean);
      if (!type) return res.status(400).json({ message: 'type is required' });
      if (subjectParams.length === 0) return res.status(400).json({ message: 'subjects are required' });

      const normalize = (s: string) => String(s || '').trim().toLowerCase();
      const normalizeKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');
      const canonicalSubject = (s: string) => {
        const k = normalizeKey(s);
        if (k.startsWith('english') || k.includes('useofenglish')) return 'english';
        if (k === 'agric' || k.startsWith('agric') || k.includes('agriculturalscience')) return 'agriculturalscience';
        return k;
      };

      const subjectFilters = subjectParams.map((s) => canonicalSubject(s));
      const yearToSubjects = new Map<string, Set<string>>();

      let offset = 0;
      let lastTotal2 = Number.POSITIVE_INFINITY;
      
      // Add error handling and retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          let docs: any[] = [];
          let pageCount = 0;
          
          const page = await databases.listDocuments(
            APPWRITE_DATABASE_ID!,
            'exams',
            [Query.limit(100), Query.offset(offset)]
          );
          docs = (page.documents || []) as any[];
          pageCount = docs.length;
          lastTotal2 = typeof (page as any).total === 'number' ? (page as any).total : lastTotal2;
          
          if (docs.length === 0) break;
          
          for (const doc of docs) {
            const docType = normalize((doc as any).type || '');
            const titleLower = normalize((doc as any).title || '');
            if (!(docType === type || titleLower.includes(type))) continue;
            // Do not filter by exam-level paper_type; many datasets store per-question only
            const subj = canonicalSubject((doc as any).subject || '');
            const year = String((doc as any).year || '').trim();
            if (!year || !subjectFilters.includes(subj)) continue;
            if (!yearToSubjects.has(year)) yearToSubjects.set(year, new Set());
            yearToSubjects.get(year)!.add(subj);
          }
          
          offset += pageCount;
          if (offset >= lastTotal2) break;
          retryCount = 0; // Reset retry count on successful page
        } catch (e) {
          retryCount++;
          logError(`Failed to fetch year availability (attempt ${retryCount})`, e);
          if (retryCount >= maxRetries) {
            // Return cached data or empty result instead of error
            logError('Max retries exceeded for year availability fetch, returning empty result', e);
            return res.json({ availability: [] });
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      const availability = Array.from(yearToSubjects.entries())
        .map(([year, subjects]) => ({
          year,
          subjects: Array.from(subjects),
          availableCount: subjects.size,
          totalCount: subjectFilters.length,
        }))
        .sort((a, b) => Number(b.year) - Number(a.year));

      // Fallback to questions if empty
      if (availability.length === 0) {
        const requestedPaperType = paperTypeParam ? (paperTypeParam.toLowerCase() === 'objective' ? 'obj' : paperTypeParam.toLowerCase()) : undefined;
        const matchesType = (q: any): boolean => {
          const qt = String(q?.type || q?.examType || '').toLowerCase();
          const ansUrl = String(q?.answer_url ?? q?.answerUrl ?? '').toLowerCase();
          return qt === type || qt.includes(type) || ansUrl.includes(`exam_type=${type}`);
        };
        const resolveQuestionPaperType = (q: any): 'obj' | 'theory' => {
          const ansUrl = String(q?.answer_url ?? q?.answerUrl ?? '');
          if (ansUrl.includes('type=theory')) return 'theory';
          if (ansUrl.includes('type=obj') || ansUrl.includes('type=objective')) return 'obj';
          const raw = (q?.paper_type ?? q?.paperType ?? '') as string;
          const n = String(raw || '').toLowerCase();
          if (n === 'objective' || n === 'obj') return 'obj';
          if (n === 'theory') return 'theory';
          const opts = (q?.options ?? {}) as any;
          const hasOptions = Array.isArray(opts) ? opts.length > 0 : (opts && typeof opts === 'object' && Object.keys(opts).length > 0);
          return hasOptions ? 'obj' : 'theory';
        };
        const yearToSubjectsFallback = new Map<string, Set<string>>();
        let qOffset = 0;
        while (true) {
          const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
            Query.limit(100),
            Query.offset(qOffset),
          ]);
          const docs = page.documents || [];
          if (docs.length === 0) break;
          for (const q of docs) {
            if (!matchesType(q)) continue;
            if (requestedPaperType && resolveQuestionPaperType(q) !== requestedPaperType) continue;
            const subj = canonicalSubject(String((q as any).subject || ''));
            if (!subjectFilters.includes(subj)) continue;
            const y = String((q as any).year || (q as any).questionYear || '').trim();
            if (!y) continue;
            if (!yearToSubjectsFallback.has(y)) yearToSubjectsFallback.set(y, new Set());
            yearToSubjectsFallback.get(y)!.add(subj);
          }
          qOffset += docs.length;
          if (qOffset >= (page.total || qOffset)) break;
        }
        const availabilityFallback = Array.from(yearToSubjectsFallback.entries())
          .map(([year, subjects]) => ({
            year,
            subjects: Array.from(subjects),
            availableCount: subjects.size,
            totalCount: subjectFilters.length,
          }))
          .sort((a, b) => Number(b.year) - Number(a.year));
        return res.json({ availability: availabilityFallback });
      }

      return res.json({ availability });
    } catch (error) {
      logError('Failed to fetch year availability', error);
      res.status(500).json({ message: 'Failed to fetch year availability' });
    }
  });

  // Autosave exam attempt
  app.post('/api/cbt/attempts/autosave', auth, validateBody(examAttemptAutosaveSchema), async (req: Request, res: Response) => {
    try {
      const user = await req.appwrite!.account.get();
      const { attemptId, answers, timeSpent } = req.body as { attemptId?: string; answers?: any; timeSpent?: number };
      if (!attemptId) return res.status(400).json({ message: 'attemptId is required' });
      
      const attempt = await databases.getDocument(APPWRITE_DATABASE_ID!, 'examAttempts', String(attemptId));
      
      if (attempt.studentId !== user.$id) {
        return res.status(403).json({ message: 'You can only autosave your own attempts' });
      }

      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ message: 'This attempt is no longer active' });
      }

      const answersAttrType2 = await getAnswersAttributeType();
      const nextAnswers = typeof answers === 'undefined' ? attempt.answers : coerceAnswersForStorage(answers, answersAttrType2);
      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'examAttempts', String(attemptId), {
        answers: nextAnswers,
        timeSpent: timeSpent || attempt.timeSpent || 0,
        lastSavedAt: new Date().toISOString(),
      });

      res.json({ ok: true, attempt: updated });
    } catch (error) {
      logError('Failed to autosave attempt', error);
      res.status(500).json({ message: 'Failed to autosave attempt' });
    }
  });

  // Get attempt results
  app.get('/api/cbt/attempts/:id/results', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      const attemptId = String(req.params.id);
      const attempt: any = await databases.getDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attemptId);

      // Check if user can view this attempt
      if (attempt.studentId !== sessionUser.$id && role !== 'admin' && role !== 'teacher') {
        return res.status(403).json({ message: 'You can only view your own attempts' });
      }

      if (attempt.status !== 'completed') {
        return res.status(400).json({ message: 'This attempt has not been completed yet' });
      }

      // Get exam details for context
      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', attempt.examId);
      
      // Get questions for detailed results
      let questions = [];
      if (Array.isArray(exam.questions)) {
        questions = exam.questions;
      } else {
        const questionsResult = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
          Query.equal('examId', attempt.examId),
          Query.orderAsc('questionNumber')
        ]);
        questions = questionsResult.documents;
      }

      // Build detailed results
      const detailedResults = questions.map((question: any, index: number) => {
        const userAnswer = attempt.answers[question.id] || attempt.answers[question.$id];
        const isCorrect = userAnswer === question.correctAnswer;
        
        return {
          questionNumber: index + 1,
          question: question.text || question.question,
          options: question.options || [],
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer,
          isCorrect: isCorrect,
          explanation: question.explanation || ''
        };
      });

      // Compute standardized scoring for popular exams
      const typeLower = String((exam as any)?.type || '').toLowerCase();
      const basePercent = Number(attempt.percentage || 0);
      let standardized = null as null | { system: string; total: number; score: number };
      if (typeLower === 'jamb') {
        // JAMB: 400 total, scale percent accordingly (approximation)
        const jambScore = Math.round((basePercent / 100) * 400);
        standardized = { system: 'JAMB', total: 400, score: jambScore };
      } else if (typeLower === 'waec' || typeLower === 'neco') {
        // WAEC/NECO: 100 marks total for objective; theory often separately marked. Provide 100-scale.
        const score100 = Math.round(basePercent);
        standardized = { system: typeLower.toUpperCase(), total: 100, score: score100 };
      }

      res.json({
        attempt: {
          id: attempt.$id,
          examId: attempt.examId,
          studentId: attempt.studentId,
          status: attempt.status,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          percentage: attempt.percentage,
          passed: attempt.passed,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent
        },
        exam: {
          id: exam.$id,
          title: exam.title,
          type: exam.type,
          subject: exam.subject,
          year: exam.year
        },
        results: detailedResults,
        summary: {
          totalQuestions: attempt.totalQuestions,
          correctAnswers: attempt.score,
          incorrectAnswers: attempt.totalQuestions - attempt.score,
          percentage: attempt.percentage,
          passed: attempt.passed,
          standardized,
        }
      });
    } catch (error) {
      logError('Failed to fetch attempt results', error);
      res.status(500).json({ message: 'Failed to fetch attempt results' });
    }
  });

  // Get class analytics
  app.get('/api/cbt/analytics/class/:classId', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!(role === 'admin' || role === 'teacher')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const classId = req.params.classId;
      
      // Get all students in this class
      const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [
        Query.equal('classId', classId),
        Query.limit(100)
      ]);

      if (students.documents.length === 0) {
        return res.json({ classId, averageScore: 0, attemptCount: 0 });
      }

      const studentIds = students.documents.map((s: any) => s.$id);
      
      // Get all attempts for these students
      const attempts = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
        Query.equal('status', 'completed'),
        Query.limit(1000)
      ]);

      const classAttempts = attempts.documents.filter((attempt: any) => 
        studentIds.includes(attempt.studentId)
      );

      if (classAttempts.length === 0) {
        return res.json({ classId, averageScore: 0, attemptCount: 0 });
      }

      const totalScore = classAttempts.reduce((sum: number, attempt: any) => sum + (attempt.percentage || 0), 0);
      const averageScore = Math.round(totalScore / classAttempts.length);

      res.json({ classId, averageScore, attemptCount: classAttempts.length });
    } catch (error) {
      logError('Failed to compute class analytics', error);
      res.status(500).json({ message: 'Failed to compute class analytics' });
    }
  });
};