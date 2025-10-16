import { Request, Response } from 'express';
import { auth } from '../middleware';
import { logError, logDebug } from '../logger';
import { Client, ID, Databases, Query } from 'node-appwrite';
import { cache, cacheKeys, CACHE_TTL } from '../utils/cache';
import { validateBody, validateQuery } from '../middleware/validation';
import { 
  examAssignmentSchema, 
  examAttemptStartSchema, 
  examAttemptSubmitSchema, 
  examAttemptAutosaveSchema,
  subjectValidationSchema,
  examQuerySchema,
  subjectQuerySchema,
  yearQuerySchema,
  attemptQuerySchema
} from '../validation/schemas';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export const registerCBTRoutes = (app: any) => {
  // Get all exams
  app.get('/api/cbt/exams', auth, validateQuery(examQuerySchema), async (req: Request, res: Response) => {
    try {
      // Support limit=all for stats queries
      let limitParam = req.query.limit as string;
      let limit: number;
      
      if (limitParam === 'all') {
        limit = 1000; // Large number for "all"
      } else {
        limit = parseInt(limitParam || '50', 10);
        if (isNaN(limit) || limit < 1) limit = 50;
        if (limit > 1000) limit = 1000; // Cap at 1000
      }

      const filters = {
        type: req.query.type,
        subject: req.query.subject,
        year: req.query.year,
        limit
      };

      // Check cache first
      const cacheKey = cacheKeys.exams(filters);
      const cached = cache.get(cacheKey);
      if (cached) {
        logDebug('Returning cached exams data', { cacheKey });
        return res.json(cached);
      }

      const queries = [Query.limit(limit)];
      
      // Add filters if provided
      if (req.query.type) {
        queries.push(Query.equal('type', String(req.query.type)));
      }
      if (req.query.subject) {
        queries.push(Query.equal('subject', String(req.query.subject)));
      }
      if (req.query.year) {
        queries.push(Query.equal('year', String(req.query.year)));
      }

      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'exams', queries);
      
      // For each exam, check if it has questions and add question count
      const examsWithQuestions = await Promise.all(
        result.documents.map(async (exam: any) => {
          let questionCount = 0;
          
          // Check if questions are embedded or separate
          if (Array.isArray(exam.questions)) {
            questionCount = exam.questions.length;
          } else {
            try {
              const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
                Query.equal('examId', String(exam.$id)),
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

      const total = result.total || 0;
      const response = { exams: examsWithQuestions, total };
      
      // Cache the result
      cache.set(cacheKey, response, CACHE_TTL.EXAMS);
      
      res.json(response);
    } catch (error) {
      logError('Failed to fetch exams', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Get assigned exams for a user
  app.get('/api/cbt/exams/assigned', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      const isDev = process.env.NODE_ENV !== 'production';
      const isAdmin = role === 'admin';

      if (!isAdmin && !isDev) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Get user's assigned exams
      const assignments = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAssignments', [
        Query.equal('userId', userId),
        Query.limit(100)
      ]);

      const examIds = assignments.documents.map((a: any) => a.examId);
      
      if (examIds.length === 0) {
        return res.json({ exams: [], total: 0 });
      }

      // Get exam details
      const exams = await Promise.all(
        examIds.map(async (examId: string) => {
          try {
            const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);
            
            // Check question count
            let questionCount = 0;
            if (Array.isArray(exam.questions)) {
              questionCount = exam.questions.length;
            } else {
              try {
                const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
                  Query.equal('examId', examId),
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
          } catch (e) {
            return null;
          }
        })
      );

      const visible = exams.filter(exam => exam !== null && exam.hasQuestions);
      return res.json({ exams: visible, total: visible.length });
    } catch (error) {
      logError('Failed to fetch assigned exams', error);
      res.status(500).json({ message: 'Failed to fetch assigned exams' });
    }
  });

  // Get available exams for a user
  app.get('/api/cbt/exams/available', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Get all exams
      const allExams = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'exams', [Query.limit(1000)]);
      
      // Get user's assigned exams
      const assignments = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAssignments', [
        Query.equal('userId', userId),
        Query.limit(100)
      ]);

      const assignedExamIds = new Set(assignments.documents.map((a: any) => a.examId));
      
      // Filter out assigned exams and add question count
      const availableExams = await Promise.all(
        allExams.documents
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
  app.get('/api/cbt/exams/:id', auth, async (req: Request, res: Response) => {
    try {
      const examId = String(req.params.id || '').trim();
      logDebug('GET /api/cbt/exams/:id', { id: examId });

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
      // If Appwrite throws document_not_found, surface 404; else 500
      const msg = (error && typeof error === 'object' && 'type' in (error as any)) ? (error as any).type : '';
      if (msg === 'document_not_found') {
        res.status(404).json({ message: 'Exam not found' });
      } else {
        res.status(500).json({ message: 'Failed to fetch exam' });
      }
    }
  });

  // Assign exam to user
  app.post('/api/cbt/exams/:id/assign', auth, validateBody(examAssignmentSchema), async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!(role === 'admin' || role === 'teacher')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const examId = req.params.id;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Check if assignment already exists
      const existing = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAssignments', [
        Query.equal('examId', examId),
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (existing.documents.length > 0) {
        return res.status(400).json({ message: 'Exam already assigned to this user' });
      }

      // Create assignment
      const assignment = await databases.createDocument(APPWRITE_DATABASE_ID!, 'examAssignments', ID.unique(), {
        examId,
        userId,
        assignedBy: sessionUser.$id,
        assignedAt: new Date().toISOString(),
      });

      // Get updated exam
      const updated = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);
      res.json(updated);
    } catch (error) {
      logError('Failed to assign exam', error);
      res.status(500).json({ message: 'Failed to assign exam' });
    }
  });

  // Unassign exam from user
  app.post('/api/cbt/exams/:id/unassign', auth, validateBody(examAssignmentSchema), async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!(role === 'admin' || role === 'teacher')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const examId = req.params.id;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Find and delete assignment
      const assignments = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAssignments', [
        Query.equal('examId', examId),
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (assignments.documents.length > 0) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'examAssignments', assignments.documents[0].$id);
      }

      // Get updated exam
      const updated = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);
      res.json(updated);
    } catch (error) {
      logError('Failed to unassign exam', error);
      res.status(500).json({ message: 'Failed to unassign exam' });
    }
  });

  // Start exam attempt
  app.post('/api/cbt/attempts', auth, validateBody(examAttemptStartSchema), async (req: Request, res: Response) => {
    try {
      const user = await req.appwrite!.account.get();
      const { examId, subjects } = req.body as { examId?: string; subjects?: string[] };
      if (!examId) return res.status(400).json({ message: 'Missing examId' });
      const role = (user as any)?.prefs?.role || null;

      // Check if user has access to this exam
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

      // Get exam details
      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', examId);
      
      // Check if user already has an active attempt
      const existingAttempts = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
        Query.equal('userId', user.$id),
        Query.equal('examId', examId),
        Query.equal('status', 'in_progress'),
        Query.limit(1)
      ]);

      if (existingAttempts.documents.length > 0) {
        return res.status(400).json({ message: 'You already have an active attempt for this exam' });
      }

      // Create new attempt
      const attemptData = {
        userId: user.$id,
        examId: examId,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        subjects: subjects || [],
        answers: {},
        timeSpent: 0,
      };

      const attempt = await databases.createDocument(APPWRITE_DATABASE_ID!, 'examAttempts', ID.unique(), attemptData);
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
      
      if (attempt.userId !== user.$id) {
        return res.status(403).json({ message: 'You can only submit your own attempts' });
      }

      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ message: 'This attempt has already been submitted' });
      }

      // Calculate score
      let score = 0;
      let totalQuestions = 0;
      
      try {
        const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', attempt.examId);
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
      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attemptId, {
        status: 'completed',
        submittedAt: new Date().toISOString(),
        answers: answers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        passed: passed,
      });

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
      let targetUserId = user.$id;
      if (studentId && (user as any)?.prefs?.role === 'admin') {
        targetUserId = String(studentId);
      }

      const attempts = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
        Query.equal('userId', targetUserId),
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
  app.post('/api/cbt/exams/validate-subjects', auth, validateBody(subjectValidationSchema), async (req: Request, res: Response) => {
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

  // Get available subjects
  app.get('/api/cbt/subjects/available', auth, validateQuery(subjectQuerySchema), async (req: Request, res: Response) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
      if (!type) return res.status(400).json({ message: 'type is required' });

      // Check cache first
      const cacheKey = cacheKeys.subjects(type);
      const cached = cache.get(cacheKey);
      if (cached) {
        logDebug('Returning cached subjects data', { cacheKey });
        return res.json(cached);
      }

      logDebug('Fetching available subjects for type', { type });

      // Get all questions for this type
      const questions = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
        Query.equal('type', type),
        Query.limit(1000)
      ]);

      // Group by subject and count questions
      const subjectCounts: Record<string, number> = {};
      for (const question of questions.documents) {
        const subject = String(question.subject || 'unknown');
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      }

      // Convert to array and sort by count
      const subjectArray = Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count);

      const response = { subjects: subjectArray };
      
      // Cache the result
      cache.set(cacheKey, response, CACHE_TTL.SUBJECTS);
      
      res.json(response);
    } catch (error) {
      logError('Failed to fetch subjects', error);
      res.status(500).json({ message: 'Failed to fetch subjects' });
    }
  });

  // Get available years
  app.get('/api/cbt/years/available', auth, validateQuery(yearQuerySchema), async (req: Request, res: Response) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
      // Accept either multiple subject params (?subject=a&subject=b) or a CSV (?subjects=a,b)
      const subjectParamsRaw = ([] as string[])
        .concat((req.query.subject as any) || [])
        .concat(req.query.subjects ? String(req.query.subjects).split(',') : []);
      
      const subjects = subjectParamsRaw
        .map(s => String(s).trim())
        .filter(s => s.length > 0);

      if (!type) return res.status(400).json({ message: 'type is required' });
      if (subjects.length === 0) return res.status(400).json({ message: 'At least one subject is required' });

      logDebug('Fetching available years', { type, subjects });

      // Build queries for each subject
      const yearCounts: Record<string, number> = {};
      
      for (const subject of subjects) {
        try {
          const questions = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
            Query.equal('type', type),
            Query.equal('subject', subject),
            Query.limit(1000)
          ]);

          for (const question of questions.documents) {
            const year = String(question.year || 'unknown');
            yearCounts[year] = (yearCounts[year] || 0) + 1;
          }
        } catch (error) {
          logError(`Error fetching years for subject ${subject}`, error);
        }
      }

      // Convert to array and sort by year
      const items = Object.entries(yearCounts)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => b.year.localeCompare(a.year));

      res.json({ years: items });
    } catch (error) {
      logError('Failed to fetch years', error);
      res.status(500).json({ message: 'Failed to fetch years' });
    }
  });

  // Get year availability
  app.get('/api/cbt/years/availability', auth, validateQuery(yearQuerySchema), async (req: Request, res: Response) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
      const subjectParamsRaw = ([] as string[])
        .concat((req.query.subject as any) || [])
        .concat(req.query.subjects ? String(req.query.subjects).split(',') : []);
      
      const subjects = subjectParamsRaw
        .map(s => String(s).trim())
        .filter(s => s.length > 0);

      if (!type) return res.status(400).json({ message: 'type is required' });
      if (subjects.length === 0) return res.status(400).json({ message: 'At least one subject is required' });

      logDebug('Fetching year availability', { type, subjects });

      const availability: Record<string, Record<string, number>> = {};
      
      for (const subject of subjects) {
        availability[subject] = {};
        
        try {
          const questions = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
            Query.equal('type', type),
            Query.equal('subject', subject),
            Query.limit(1000)
          ]);

          for (const question of questions.documents) {
            const year = String(question.year || 'unknown');
            availability[subject][year] = (availability[subject][year] || 0) + 1;
          }
        } catch (error) {
          logError(`Error fetching availability for subject ${subject}`, error);
        }
      }

      res.json({ availability });
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
      
      if (attempt.userId !== user.$id) {
        return res.status(403).json({ message: 'You can only autosave your own attempts' });
      }

      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ message: 'This attempt is no longer active' });
      }

      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'examAttempts', String(attemptId), {
        answers: answers || attempt.answers,
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
      if (attempt.userId !== sessionUser.$id && role !== 'admin' && role !== 'teacher') {
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

      res.json({
        attempt: {
          id: attempt.$id,
          examId: attempt.examId,
          userId: attempt.userId,
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
          passed: attempt.passed
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

      const studentIds = students.documents.map((s: any) => s.userId);
      
      // Get all attempts for these students
      const attempts = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
        Query.equal('status', 'completed'),
        Query.limit(1000)
      ]);

      const classAttempts = attempts.documents.filter((attempt: any) => 
        studentIds.includes(attempt.userId)
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