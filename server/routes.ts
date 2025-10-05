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
      const allExams: any[] = [];
      let offset = 0;
      const limit = 100; // Appwrite max is 100 per request
      let total = 0;

      do {
        const result = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(limit), Query.offset(offset)]
        );
        if (result.documents.length === 0) break;
        allExams.push(...result.documents);
        total = result.total || allExams.length;
        offset += result.documents.length;
      } while (allExams.length < total);

      console.log('Total exams returned:', allExams.length);
      res.json(allExams);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Get a single exam (with questions)
  app.get('/api/cbt/exams/:id', auth, async (req, res) => {
    try {
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

  return httpServer;
}