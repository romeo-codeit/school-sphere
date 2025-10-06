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
      let examsWithQuestions;
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
      } else {
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
      }

      res.json({ exams: examsWithQuestions, total });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Get a single exam (with questions)
  app.get('/api/cbt/exams/:id', auth, async (req, res) => {
    try {
        console.log('[CBT] /api/cbt/exams called');
        // Debug: If ?debug=1, fetch only one exam, no questions
        if (req.query.debug === '1') {
          console.log('[CBT] Debug mode: fetching only one exam, no questions');
          const result = await databases.listDocuments(
            APPWRITE_DATABASE_ID!,
            'exams',
            [Query.limit(1)]
          );
          console.log('[CBT] Fetched exams:', result.documents.length);
          return res.json({ exams: result.documents, total: result.total || result.documents.length });
        }
      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', req.params.id);
      res.json(exam);
    } catch (error) {
      console.error(error);
      res.status(404).json({ message: 'Exam not found' });
    }
  });

  // Start an exam attempt
  app.post('/api/cbt/attempts', auth, async (req, res) => {
    try {
  const user = await req.appwrite!.account.get();
      const { examId } = req.body;
      if (!examId) return res.status(400).json({ message: 'Missing examId' });
      // Optionally: check for existing active attempt, enforce limits, etc.
      const attempt = await databases.createDocument(
        APPWRITE_DATABASE_ID!,
        'examAttempts',
        ID.unique(),
        {
          examId,
          studentId: user.$id,
          answers: {},
          score: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          timeSpent: 0,
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
      const { answers } = req.body;
      if (!answers) return res.status(400).json({ message: 'Missing answers' });
      // Fetch attempt and exam
      const attempt = await databases.getDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attemptId);
      if (attempt.studentId !== user.$id) return res.status(403).json({ message: 'Forbidden' });
      const exam = await databases.getDocument(APPWRITE_DATABASE_ID!, 'exams', attempt.examId);
      // Calculate score
      let score = 0;
      let correctAnswers = 0;
      const totalQuestions = Array.isArray(exam.questions) ? exam.questions.length : 0;
      exam.questions.forEach((q: any, idx: number) => {
        if (answers[idx] === q.correctAnswer) {
          score += q.marks || 1;
          correctAnswers++;
        }
      });
      // Update attempt
      const updated = await databases.updateDocument(
        APPWRITE_DATABASE_ID!,
        'examAttempts',
        attemptId,
        {
          answers,
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