  // Zod schema for teacher validation
  const teacherSchema = z.object({
    employeeId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    gender: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    qualification: z.string().optional(),
    experience: z.number().optional(),
    status: z.string(),
  });

  // Zod schema for attendance validation
  const attendanceSchema = z.object({
    studentId: z.string().min(1),
    date: z.string().min(1),
    status: z.string().min(1),
    remarks: z.string().optional(),
  });
import type { Express } from "express";
import { createServer, type Server } from "http";
import { Client, Users, ID, Databases, Query } from 'node-appwrite';
import { auth } from './middleware';
import { z } from 'zod';
  // Zod schema for student validation
  const studentSchema = z.object({
    studentId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().email().optional().or(z.literal('')),
    classId: z.string().min(1),
    status: z.string(),
  });
import { logInfo, logWarn, logError, logDebug } from './logger';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

// CDN Configuration for static assets
const CDN_BASE_URL = process.env.CDN_BASE_URL || process.env.VITE_APPWRITE_ENDPOINT?.replace('/v1', '') || '';
const USE_CDN = process.env.USE_CDN === 'true' || !!CDN_BASE_URL;

// Helper function to convert Appwrite storage URLs to CDN URLs
function toCDNUrl(url: string | undefined): string | undefined {
  if (!url || !USE_CDN) return url;

  // Convert Appwrite storage URLs to CDN URLs
  if (url.includes('/storage/buckets/') && url.includes('/files/') && url.includes('/view')) {
    // Extract bucket, file ID, and any query params
    const storageMatch = url.match(/\/storage\/buckets\/([^\/]+)\/files\/([^\/]+)\/view(\?.*)?$/);
    if (storageMatch) {
      const [, bucketId, fileId, query] = storageMatch;
      return `${CDN_BASE_URL}/storage/buckets/${bucketId}/files/${fileId}/view${query || ''}`;
    }
  }

  return url;
}

// Simple in-memory cache for practice exams (TTL: 30 minutes)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const practiceExamCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(type: string, subjects: string[], year?: string): string {
  return `${type}:${subjects.sort().join(',')}:${year || 'all'}`;
}

function getCachedExam(cacheKey: string): any | null {
  const entry = practiceExamCache.get(cacheKey);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    practiceExamCache.delete(cacheKey);
    return null;
  }

  return entry.data;
}

function setCachedExam(cacheKey: string, data: any, ttl: number = CACHE_TTL): void {
  practiceExamCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });

  // Log cache size for monitoring
  if (practiceExamCache.size > 50) {
    logWarn(`Practice exam cache size: ${practiceExamCache.size} entries`, { cacheSize: practiceExamCache.size });
  }
}

// Periodic cache cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  practiceExamCache.forEach((entry, key) => {
    if (now - entry.timestamp > entry.ttl) {
      practiceExamCache.delete(key);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    logInfo(`Cleaned up ${cleaned} expired practice exam cache entries`, { cleaned });
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

// Optimized function to fetch questions for practice exams
async function fetchPracticeExamQuestions(type: string, selectedSubjects: string[], yearParam?: string): Promise<any[]> {
  const normalize = (s: string) => String(s || '').trim().toLowerCase();
  const normalizeKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');
  const canonicalSubject = (s: string) => {
    const k = normalizeKey(s);
    if (k.startsWith('english') || k.includes('useofenglish')) return 'english';
    if (k === 'agric' || k.startsWith('agric') || k.includes('agriculturalscience')) return 'agriculturalscience';
    return k;
  };

  const canonicalSelectedSubjects = selectedSubjects.map(s => canonicalSubject(s));
  const allQuestions: any[] = [];

  // Build database queries for better performance
  const examQueries = [Query.equal('type', type)];

  // Add year filter if specified
  if (yearParam) {
    examQueries.push(Query.equal('year', yearParam));
  }

  // Fetch all exams matching the type and year criteria
  let examOffset = 0;
  const matchingExams: any[] = [];

  while (true) {
    const examResults = await databases.listDocuments(
      APPWRITE_DATABASE_ID!,
      'exams',
      [...examQueries, Query.limit(100), Query.offset(examOffset)]
    );

    if (examResults.documents.length === 0) break;

    // Filter exams by subject in memory (since Appwrite doesn't support complex subject filtering)
    for (const exam of examResults.documents) {
      const examSubjectRaw = String((exam as any).subject || '');
      const examSubject = canonicalSubject(examSubjectRaw);

      if (canonicalSelectedSubjects.includes(examSubject)) {
        matchingExams.push(exam);
      }
    }

    examOffset += examResults.documents.length;
    if (examOffset >= (examResults.total || examOffset)) break;
  }

  // Now fetch questions for all matching exams in parallel
  const questionPromises = matchingExams.map(async (exam) => {
    const questions: any[] = [];

    // Check if exam has embedded questions
    if (Array.isArray((exam as any).questions) && (exam as any).questions.length > 0) {
      const examSubjectRaw = String((exam as any).subject || '');
      for (const q of (exam as any).questions) {
        const text = (q as any).question ?? (q as any).questionText ?? (q as any).text ?? '';
        const opts = (q as any).options ?? [];
        const correct = (q as any).correctAnswer ?? (q as any).answer ?? '';
        const mapped = {
          question: text,
          options: opts,
          correctAnswer: correct,
          explanation: (q as any).explanation ?? undefined,
          imageUrl: toCDNUrl((q as any).imageUrl ?? (q as any).image),
          subject: (canonicalSubject(examSubjectRaw) === 'english') ? 'English' : (exam as any).subject,
        };
        questions.push(mapped);
      }
    } else {
      // Fetch from questions collection
      let qOffset = 0;
      while (true) {
        const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
          Query.equal('examId', String(exam.$id)),
          Query.limit(100),
          Query.offset(qOffset),
        ]);

        if (qRes.documents.length === 0) break;

        const examSubjectRaw = String((exam as any).subject || '');
        for (const q of qRes.documents) {
          const text = (q as any).question ?? (q as any).questionText ?? (q as any).text ?? '';
          const opts = (q as any).options ?? [];
          const correct = (q as any).correctAnswer ?? (q as any).answer ?? '';
          const mapped = {
            question: text,
            options: opts,
            correctAnswer: correct,
            explanation: (q as any).explanation ?? undefined,
            imageUrl: toCDNUrl((q as any).imageUrl ?? (q as any).image),
            subject: (canonicalSubject(examSubjectRaw) === 'english') ? 'English' : (exam as any).subject,
          };
          questions.push(mapped);
        }

        qOffset += qRes.documents.length;
        if (qOffset >= (qRes.total || qOffset)) break;
      }
    }

    return questions;
  });

  // Wait for all question fetching to complete
  const questionArrays = await Promise.all(questionPromises);

  // Flatten all questions into a single array
  for (const questionArray of questionArrays) {
    allQuestions.push(...questionArray);
  }

  return allQuestions;
}

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
  'school',
  // 'conversations' intentionally omitted from generic CRUD for privacy,
  // we provide a filtered alias endpoint below.
];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Health Check Endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  });
  // Alias: meetings -> videoMeetings (GET only)
  app.get('/api/meetings', auth, async (_req, res) => {
    try {
      const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'videoMeetings',
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );
      return res.json(result.documents);
    } catch (e) {
      logError('Failed to fetch meetings', e);
      return res.status(500).json({ message: 'Failed to fetch meetings' });
    }
  });

  // Forum threads: top-level only
  app.get('/api/forum/threads', auth, async (_req, res) => {
    try {
      const page = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'forumThreads',
        [Query.isNull('parentThreadId'), Query.orderDesc('$createdAt'), Query.limit(100)]
      );
      return res.json(page.documents);
    } catch (e) {
      logError('Failed to fetch meetings', e);
      return res.status(500).json({ message: 'Failed to fetch threads' });
    }
  });

  // Conversations for current user
  app.get('/api/conversations', auth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.$id) return res.status(401).json({ message: 'Unauthorized' });
      const page = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'conversations',
        [Query.equal('members', String(user.$id)), Query.orderDesc('lastActivity'), Query.limit(100)]
      );
      return res.json(page.documents);
    } catch (e) {
      logError('Failed to fetch meetings', e);
      return res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Users (combined teachers + students) - minimal info, admin-only
  app.get('/api/users', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const teachers = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachers', [Query.limit(100)]);
      const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [Query.limit(100)]);
      const mapUser = (u: any) => ({
        $id: u.$id,
        userId: u.userId || u.$id,
        firstName: u.firstName || null,
        lastName: u.lastName || null,
        name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
        email: u.email || null,
        role: u.role || (u.classId ? 'student' : 'teacher'),
      });
      const usersCombined = [...teachers.documents, ...students.documents].map(mapUser);
      return res.json(usersCombined);
    } catch (e) {
      logError('Failed to fetch meetings', e);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Self-delete account (irreversible)
  app.delete('/api/users/self', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Best-effort delete related docs
      try {
        const profiles = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [Query.equal('userId', String(userId))]);
        for (const p of profiles.documents) {
          try { await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'userProfiles', String(p.$id)); } catch {}
        }
        const subs = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userSubscriptions', [Query.equal('userId', String(userId))]);
        for (const s of subs.documents) {
          try { await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'userSubscriptions', String(s.$id)); } catch {}
        }
      } catch {}

      await users.delete(String(userId));
      return res.json({ ok: true });
    } catch (e) {
      logError('Failed to delete account', e);
      return res.status(500).json({ message: 'Failed to delete account' });
    }
  });

  // School settings endpoints (single-document semantics)
  app.get('/api/school', auth, async (req, res) => {
    try {
      const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'school', [Query.limit(1)]);
      return res.json(page);
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch school settings' });
    }
  });

  app.put('/api/school', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const data = req.body || {};
      // Basic validation of required fields
      const required = ['schoolName','address','phone','email'];
      for (const k of required) {
        if (!String((data as any)[k] || '').trim()) {
          return res.status(400).json({ message: `Missing required field: ${k}` });
        }
      }
      const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'school', [Query.limit(1)]);
      let doc;
      if (page.total > 0) {
        doc = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'school', String(page.documents[0].$id), data);
      } else {
        doc = await databases.createDocument(APPWRITE_DATABASE_ID!, 'school', ID.unique(), data);
      }
      return res.json(doc);
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to update school settings' });
    }
  });

  app.post('/api/users', auth, async (req, res) => {
    const sessionUser: any = (req as any).user;
    if (sessionUser?.prefs?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Optional: restrict roles that admins can assign
    const allowedAdminAssignableRoles = new Set(['admin', 'teacher', 'student', 'parent']);
    if (!allowedAdminAssignableRoles.has(String(role))) {
      return res.status(400).json({ message: 'Invalid role' });
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
      logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch teacher classes' });
    }
  });

  app.get('/api/teacher/students', auth, async (req, res) => {
    try {
      if (!req.appwrite) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const user = await req.appwrite.account.get();
      if (!user?.$id) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Get teacher record
      const teacher = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachers', [Query.equal('userId', String(user.$id))]);
      if (teacher.documents.length === 0) {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      const teacherId = String(teacher.documents[0].$id);

      // Get all classes taught by this teacher
      const teacherClasses = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachersToClasses', [Query.equal('teacherId', teacherId)]);
      const classIds = teacherClasses.documents.map((doc) => String(doc.classId));

      if (classIds.length === 0) {
        return res.json({ documents: [], total: 0 });
      }

      // Get pagination parameters
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
      const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

      // Get students with pagination
      const students = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'students',
        [
          Query.equal('classId', classIds),
          Query.limit(limit),
          Query.offset(offset),
          Query.orderAsc('firstName')
        ]
      );

      res.json({
        documents: students.documents,
        total: students.total,
        limit,
        offset
      });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch teacher students' });
    }
  });

  app.get('/api/classes/:id/students', auth, async (req, res) => {
    try {
  const classId = String(req.params.id);
  const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [Query.equal('classId', classId)]);
      res.json(students);
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch students for the class' });
    }
  });

  // Generic CRUD endpoints for all collections
  for (const collection of collections) {
    // List documents (auth required)
    app.get(`/api/${collection}`, auth, async (req, res) => {
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
        // Only allow students to fetch their own profile
        if (collection === 'students') {
          const sessionUser: any = (req as any).user;
          if (sessionUser?.prefs?.role === 'student') {
            queries.push(Query.equal('userId', sessionUser.$id));
          }
        }
        const response = await databases.listDocuments(APPWRITE_DATABASE_ID!, String(collection), queries);
        res.json(response);
      } catch (error) {
        logError('Failed to fetch school settings', error);
        res.status(500).json({ message: `Failed to fetch ${collection}` });
      }
    });

    // Get document (auth required)
    app.get(`/api/${collection}/:id`, auth, async (req, res) => {
      try {
        if (!collection || !req.params.id) {
          return res.status(400).json({ message: 'Missing collection name or document ID' });
        }
        // Only allow students to fetch their own profile
        if (collection === 'students') {
          const sessionUser: any = (req as any).user;
          const doc = await databases.getDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id));
          if (sessionUser?.prefs?.role === 'student' && doc.userId !== sessionUser.$id) {
            return res.status(403).json({ message: 'Forbidden' });
          }
          return res.json(doc);
        }
        const response = await databases.getDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id));
        res.json(response);
      } catch (error) {
        logError('Failed to fetch school settings', error);
        res.status(500).json({ message: `Failed to fetch ${collection}` });
      }
    });

    // Create document (auth required, role check)
    app.post(`/api/${collection}`, auth, async (req, res) => {
      try {
        if (!collection) {
          return res.status(400).json({ message: 'Missing collection name' });
        }
        const sessionUser: any = (req as any).user;
        // Only admins can create teachers/teachersToClasses
        if ((collection === 'teachers' || collection === 'teachersToClasses') && sessionUser?.prefs?.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        // Students can only create/update their own profile
        if (collection === 'students') {
          req.body.userId = sessionUser.$id;
          // Validate student data
          const parseResult = studentSchema.safeParse(req.body);
          if (!parseResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
          }
        }
        if (collection === 'teachers') {
          // Validate teacher data
          const parseResult = teacherSchema.safeParse(req.body);
          if (!parseResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
          }
        }
        if (collection === 'attendance') {
          // Validate attendance data
          const parseResult = attendanceSchema.safeParse(req.body);
          if (!parseResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
          }
        }
        const response = await databases.createDocument(APPWRITE_DATABASE_ID!, String(collection), ID.unique(), req.body);
        res.status(201).json(response);
      } catch (error) {
        logError('Failed to fetch school settings', error);
        res.status(500).json({ message: `Failed to create ${collection}` });
      }
    });

    // Update document (auth required, role check)
    app.put(`/api/${collection}/:id`, auth, async (req, res) => {
      try {
        if (!collection || !req.params.id) {
          return res.status(400).json({ message: 'Missing collection name or document ID' });
        }
        const sessionUser: any = (req as any).user;
        // Only admins can update teachers/teachersToClasses
        if ((collection === 'teachers' || collection === 'teachersToClasses') && sessionUser?.prefs?.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        // Students can only update their own profile
        if (collection === 'students') {
          const doc = await databases.getDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id));
          if (doc.userId !== sessionUser.$id) {
            return res.status(403).json({ message: 'Forbidden' });
          }
          // Validate student data
          const parseResult = studentSchema.safeParse(req.body);
          if (!parseResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
          }
        }
        if (collection === 'teachers') {
          // Validate teacher data
          const parseResult = teacherSchema.safeParse(req.body);
          if (!parseResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
          }
        }
        if (collection === 'attendance') {
          // Validate attendance data
          const parseResult = attendanceSchema.safeParse(req.body);
          if (!parseResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
          }
        }
        const response = await databases.updateDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id), req.body);
        res.json(response);
      } catch (error) {
        logError('Failed to fetch school settings', error);
        res.status(500).json({ message: `Failed to update ${collection}` });
      }
    });

    // Delete document (auth required, role check)
    app.delete(`/api/${collection}/:id`, auth, async (req, res) => {
      try {
        if (!collection || !req.params.id) {
          return res.status(400).json({ message: 'Missing collection name or document ID' });
        }
        const sessionUser: any = (req as any).user;
        // Only admins can delete teachers/teachersToClasses
        if ((collection === 'teachers' || collection === 'teachersToClasses') && sessionUser?.prefs?.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        // Students can only delete their own profile
        if (collection === 'students' && sessionUser?.prefs?.role === 'student') {
          const doc = await databases.getDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id));
          if (doc.userId !== sessionUser.$id) {
            return res.status(403).json({ message: 'Forbidden' });
          }
        }
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, String(collection), String(req.params.id));
        res.status(204).send();
      } catch (error) {
        logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
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
        const assigned: string[] | undefined = (e as any).assignedTo;
        const examType = (e as any).type?.toLowerCase();

        // Public if assignedTo exists and is an empty array (internal exams only)
        if (Array.isArray(assigned) && assigned.length === 0) return true;

        // Never show WAEC/NECO/JAMB exams in "Assigned to me" - they're subscription-gated
        if (['waec', 'neco', 'jamb'].includes(examType)) return false;

        // Not public if assignedTo is undefined (other unassigned exams)
        if (assigned === undefined) return false;

        // Visible if explicitly assigned to student or their class
        return (studentId && assigned.includes(String(studentId))) || (classId && assigned.includes(String(classId)));
      });
      return res.json({ exams: visible, total: visible.length });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch assigned exams' });
    }
  });

  // Get subscription-based exams (WAEC/NECO/JAMB) for subscribed users
  app.get('/api/cbt/exams/available', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      let isSubscribed = false;
      let role: string | null = null;
      try {
        // Get role from account prefs
        const account = await req.appwrite!.account.get();
        role = (account as any)?.prefs?.role || null;
        // Students have free access to practice exams
        if (role === 'student') {
          isSubscribed = true;
        }
        // Prefer new userSubscriptions collection
        const subs = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'userSubscriptions',
          [Query.equal('userId', String(userId)), Query.limit(1)]
        );
        if (subs.total > 0) {
          isSubscribed = subs.documents[0].subscriptionStatus === 'active';
        } else {
          // Fallback to legacy userProfiles
          const userProfiles = await databases.listDocuments(
            APPWRITE_DATABASE_ID!,
            'userProfiles',
            [Query.equal('userId', String(userId)), Query.limit(1)]
          );
          if (userProfiles.total > 0) {
            const profile = userProfiles.documents[0];
            isSubscribed = profile.subscriptionStatus === 'active';
          }
        }
      } catch {}

      if (!isSubscribed) {
        return res.json({ exams: [], total: 0, message: 'Subscription required to access practice exams' });
      }

      const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'exams',
        [Query.limit(100), Query.offset(0)]
      );
      const standardizedExams = result.documents.filter((exam: any) =>
        ['waec', 'neco', 'jamb'].includes(exam.type?.toLowerCase())
      );

      return res.json({ exams: standardizedExams, total: standardizedExams.length });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch available exams' });
    }
  });

  // Get a single exam (with questions) or a synthetic practice exam
  app.get('/api/cbt/exams/:id', auth, async (req, res) => {
    try {
      const examId = String(req.params.id || '').trim();
      logDebug('GET /api/cbt/exams/:id', { id: examId });

      // Basic validation for missing/placeholder ids
      if (!examId || examId === 'undefined' || examId === 'null') {
        return res.status(400).json({ message: 'Invalid exam id' });
      }

      // Handle practice sessions (synthetic examId like 'practice-jamb')
      if (examId.startsWith('practice-')) {
        const type = examId.replace('practice-', '');
        const subjects = req.query.subjects ? String(req.query.subjects).split(',') : [];
        const yearParam = req.query.year ? String(req.query.year) : undefined;
        const selectedSubjects = subjects.map((s) => s.trim()).filter(Boolean);

        if (selectedSubjects.length === 0) {
          return res.status(400).json({ message: 'At least one subject must be selected for practice exams' });
        }

        // Check cache first
        const cacheKey = getCacheKey(type, selectedSubjects, yearParam);
        const cachedExam = getCachedExam(cacheKey);

        if (cachedExam) {
          logDebug('Serving cached practice exam', { cacheKey });
          return res.json(cachedExam);
        }

        logInfo('Generating new practice exam', { type, subjects: selectedSubjects, year: yearParam });

        // Fetch questions using optimized function
        const questions = await fetchPracticeExamQuestions(type, selectedSubjects, yearParam);

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
          const questionsPerSubject = 12; // ~50 total for 4 subjects
          const questionsBySubject = new Map<string, any[]>();

          // Group by subject
          for (const q of questions) {
            const subj = String(q.subject || 'Unknown');
            if (!questionsBySubject.has(subj)) {
              questionsBySubject.set(subj, []);
            }
            questionsBySubject.get(subj)!.push(q);
          }

          // Sample from each subject
          finalQuestions = [];
          Array.from(questionsBySubject.entries()).forEach(([, subjectQuestions]) => {
            finalQuestions.push(...sample(subjectQuestions, questionsPerSubject));
          });
        }
        // WAEC/NECO: 50 random questions across selected subjects
        else if (type === 'waec' || type === 'neco') {
          finalQuestions = sample(questions, 50);
        }

        // Fixed durations by type
        const durationMinutes = type === 'jamb' ? 120 : (type === 'waec' || type === 'neco') ? 90 : 60;
        const titleSuffix = yearParam && type === 'jamb' ? `${subjects.join(', ')} - ${yearParam}` : subjects.join(', ');

        const practiceExam = {
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
        };

        // Cache the result
        setCachedExam(cacheKey, practiceExam);

        return res.json(practiceExam);
      }

      // Debug: If ?debug=1, fetch only one exam, no questions
      if (req.query.debug === '1') {
        logDebug('Debug mode: fetching only one exam (no questions)');
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
        imageUrl: toCDNUrl(q?.imageUrl ?? q?.image),
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
      logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to unassign exam' });
    }
  });

  // Start an exam attempt
  app.post('/api/cbt/attempts', auth, async (req, res) => {
    try {
      const user = await req.appwrite!.account.get();
      const { examId, subjects } = req.body as { examId?: string; subjects?: string[] };
      if (!examId) return res.status(400).json({ message: 'Missing examId' });
      const role = (user as any)?.prefs?.role || null;

      // If practice mode (standardized exams via synthetic id) and role is guest, require subscription
      if (examId.startsWith('practice-')) {
        if (role === 'guest') {
          // Check subscription status for guest
          let isSubscribed = false;
          try {
            const subs = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userSubscriptions', [Query.equal('userId', String(user.$id)), Query.limit(1)]);
            if (subs.total > 0) {
              isSubscribed = subs.documents[0].subscriptionStatus === 'active';
            } else {
              const profiles = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [Query.equal('userId', String(user.$id)), Query.limit(1)]);
              if (profiles.total > 0) isSubscribed = profiles.documents[0].subscriptionStatus === 'active';
            }
          } catch {}
          if (!isSubscribed) return res.status(402).json({ message: 'Subscription required for guests to start practice exams' });
        }
      }
      
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
      logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch attempts' });
    }
  });

  // Validate subject selection before starting an exam session
  app.post('/api/cbt/exams/validate-subjects', auth, async (req, res) => {
    try {
      const { type, selectedSubjects, year } = req.body as { type?: string; selectedSubjects?: string[]; year?: string };
      if (!type || !Array.isArray(selectedSubjects)) {
        return res.status(400).json({ message: 'type and selectedSubjects are required' });
      }
      const t = String(type).toLowerCase();
      
      logDebug('Received validation request', { type: t, selectedSubjects, year });

      // Basic validation rules
      if (t === 'jamb') {
        const normalize = (s: string) => String(s || '').trim().toLowerCase();
        const isEnglish = (s: string) => {
          const v = normalize(s);
          return v === 'english' || v === 'english language' || v === 'englishlanguage' || v === 'use of english' || v.startsWith('english');
        };
        const lowerSubjects = selectedSubjects.map((s) => normalize(s));
        logDebug('JAMB validation - original subjects', { selectedSubjects });
        logDebug('JAMB validation - normalized subjects', { lowerSubjects });

        const hasEnglish = lowerSubjects.some(isEnglish);
        logDebug('JAMB validation - hasEnglish check result', { hasEnglish });
        if (!hasEnglish) {
          logWarn('JAMB validation FAILED: English not found', { lowerSubjects });
          return res.status(400).json({ message: 'English is mandatory for JAMB' });
        }

        // Count non-English subjects
        const nonEnglishCount = lowerSubjects.filter((s) => !isEnglish(s)).length;
        logDebug('JAMB validation - non-English subjects', { nonEnglishCount });
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
      const normalizeKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');
      const canonicalSubject = (s: string) => {
        const k = normalizeKey(s);
        if (k.startsWith('english') || k.includes('useofenglish')) return 'english';
        if (k === 'agric' || k.startsWith('agric') || k.includes('agriculturalscience')) return 'agriculturalscience';
        return k;
      };
      const isEnglish = (s: string) => canonicalSubject(s) === 'english';
      const lowerSubs = selectedSubjects.map((s) => canonicalSubject(s));
      const availability: Record<string, number> = Object.fromEntries(lowerSubs.map((s) => [s, 0]));
      const englishSelectedKey = lowerSubs.find(isEnglish) || null;
      let offset = 0;
      let totalExamsScanned = 0;
      let matchingExams: any[] = [];
      
      logDebug('Validating subjects', { type: t, selectedSubjects: lowerSubs });
      
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
          
          // Filter by year if specified
          if (year) {
            const docYear = String((doc as any).year || '').trim();
            if (docYear !== year) continue;
          }
          
          const subj = canonicalSubject((doc as any).subject || '');

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

      logInfo('Validation results', { 
        totalExamsScanned, 
        matchingExams: matchingExams.length,
        availability,
        examsDetail: matchingExams 
      });

      // Instead of rejecting, return what's available
      const insufficient = Object.entries(availability).filter(([, c]) => (c as number) === 0).map(([s]) => s);
      const available = Object.entries(availability).filter(([, c]) => (c as number) > 0).map(([s]) => s);
      
      if (available.length === 0) {
        // No subjects have data at all
        return res.status(400).json({ 
          message: `No questions found for any selected subject${year ? ` in year ${year}` : ''}. Try selecting a different year or subjects.`,
          insufficient, 
          availability,
          debug: { totalExamsScanned, matchingExams }
        });
      }

      // Success - return what will be included
      return res.json({ 
        ok: true, 
        availability,
        available: available.length,
        total: Object.keys(availability).length,
        insufficient: insufficient.length > 0 ? insufficient : undefined,
        message: insufficient.length > 0 
          ? `${available.length} of ${Object.keys(availability).length} subjects available. Subjects without data: ${insufficient.join(', ')}`
          : `All ${available.length} subjects available`
      });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to validate subjects' });
    }
  });

  // Available subjects by exam type
  app.get('/api/cbt/subjects/available', auth, async (req, res) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
      if (!type) return res.status(400).json({ message: 'type is required' });

      logDebug('Fetching available subjects for type', { type });

      // Derive from exams to ensure only subjects that exist appear (case-insensitive type),
      // and collapse duplicates like "Agricultural Science" vs "AgriculturalScience"
      const subjectMap = new Map<string, string>(); // normalizedKey -> display label
      const normalize = (s: string) => String(s || '').trim().toLowerCase();
      const normalizeKey = (s: string) => normalize(s).replace(/[^a-z]/g, '');
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
            const key = isEnglish(subjRaw) ? 'english' : normalizeKey(subjRaw);
            const display = key === 'english' ? 'English' : subjRaw;
            if (!subjectMap.has(key)) subjectMap.set(key, display);
            matchingExams++;
          }
        });
        offset += page.documents.length;
        if (offset >= (page.total || offset) || page.documents.length === 0) break;
      }

      const subjectArray = Array.from(subjectMap.values()).sort();
      logInfo('Found subjects for exam type', { 
        type,
        count: subjectArray.length, 
        subjects: subjectArray,
        matchingExams 
      });

      res.json({ subjects: subjectArray });
    } catch (error) {
      logError('Failed to fetch school settings', error);
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
      const normalizeKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');
      const canonicalSubject = (s: string) => {
        const k = normalizeKey(s);
        if (k.startsWith('english') || k.includes('useofenglish')) return 'english';
        if (k === 'agric' || k.startsWith('agric') || k.includes('agriculturalscience')) return 'agriculturalscience';
        return k;
      };

      // Build normalized subject filters; treat any English synonym as 'english'
  let subjectFilters: string[] = subjectParams.map((s) => canonicalSubject(s));
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
          
          let subj = canonicalSubject((doc as any).subject || '');
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
        // Compute UNION across all filtered subjects (show years where ANY subject has exams)
        const union = new Set<string>();
        subjectFilters
          .filter((s, idx) => subjectFilters.indexOf(s) === idx) // unique
          .forEach(s => {
            const yearSet = subjectToYears.get(s);
            if (yearSet) {
              yearSet.forEach(y => union.add(y));
            }
          });
        items = Array.from(union);
      }

      items.sort((a, b) => Number(b) - Number(a));
      res.json({ years: items });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch years' });
    }
  });

  // Get year availability per subject - shows which subjects have data for which years
  app.get('/api/cbt/years/availability', auth, async (req, res) => {
    try {
      const type = String(req.query.type || '').toLowerCase();
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
      
      // Map: year -> subjects available in that year
      const yearToSubjects = new Map<string, Set<string>>();
      
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
          
          const subj = canonicalSubject((doc as any).subject || '');
          const year = String((doc as any).year || '').trim();
          
          if (!year || !subjectFilters.includes(subj)) continue;
          
          if (!yearToSubjects.has(year)) {
            yearToSubjects.set(year, new Set());
          }
          yearToSubjects.get(year)!.add(subj);
        }
        offset += page.documents.length;
        if (offset >= (page.total || offset) || page.documents.length === 0) break;
      }

      // Convert to response format: { year: string, subjects: string[], availableCount: number }[]
      const availability = Array.from(yearToSubjects.entries())
        .map(([year, subjects]) => ({
          year,
          subjects: Array.from(subjects),
          availableCount: subjects.size,
          totalCount: subjectFilters.length
        }))
        .sort((a, b) => Number(b.year) - Number(a.year));

      res.json({ availability });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch year availability' });
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
      logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
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
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to compute class analytics' });
    }
  });

  // DEBUG: Test Appwrite connectivity from backend
  app.get('/api/debug/appwrite', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'exams', [Query.limit(1)]);
      res.json({ success: true, count: result.documents.length });
    } catch (error) {
      logError('Appwrite connectivity test failed', error);
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
  app.get('/api/debug/exam-subjects', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
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
      logError('Failed to analyze exam subjects', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // User registration endpoint that creates user profiles with pending approval
  app.post('/api/users/register', async (req, res) => {
    try {
      const { email, password, name, role = 'student' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
      }

      // Lock down allowed roles during self-registration
      const allowedSelfRegistrationRoles = new Set(['student', 'guest']);
      if (!allowedSelfRegistrationRoles.has(String(role))) {
        return res.status(400).json({ message: 'Invalid role for self-registration' });
      }

      // Create user account
      const newUser = await users.create(ID.unique(), email, password, name);
      await users.updatePrefs(newUser.$id, { role });

      // Create user profile; auto-approve guests, require approval for others
      const profileData = {
        userId: newUser.$id,
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        role: role,
        accountStatus: role === 'guest' ? 'approved' : 'pending',
        subscriptionStatus: 'inactive',
      };

      await databases.createDocument(APPWRITE_DATABASE_ID!, 'userProfiles', ID.unique(), profileData);

      res.json({
        message: role === 'guest'
          ? 'Guest account created successfully. You can sign in now. Subscription is required to access practice exams.'
          : 'Account created successfully. Please wait for admin approval.',
        user: newUser,
        status: role === 'guest' ? 'guest_created' : 'pending_approval'
      });
    } catch (error: any) {
      logError('Registration error', error);
      res.status(500).json({ message: error.message || 'Failed to create account' });
    }
  });

  // Get current user's subscription status
  app.get('/api/users/subscription', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      let status = 'inactive';
      let expiry: string | null = null;
      let examAccess: string[] = [];

      try {
        const subs = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'userSubscriptions',
          [Query.equal('userId', String(userId)), Query.limit(1)]
        );
        if (subs.total > 0) {
          const doc: any = subs.documents[0];
          status = doc.subscriptionStatus || 'inactive';
          expiry = doc.subscriptionExpiry || null;
          try { examAccess = JSON.parse(doc.examAccess || '[]'); } catch {}
        } else {
          const profiles = await databases.listDocuments(
            APPWRITE_DATABASE_ID!,
            'userProfiles',
            [Query.equal('userId', String(userId)), Query.limit(1)]
          );
          if (profiles.total > 0) {
            const p: any = profiles.documents[0];
            status = p.subscriptionStatus || 'inactive';
          }
        }
      } catch {}

      return res.json({ subscriptionStatus: status, subscriptionExpiry: expiry, examAccess });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to get subscription status' });
    }
  });

  // Canonical user profile info
  app.get('/api/users/me', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      let profile: any = null;
      let firstName = null;
      let lastName = null;
      try {
        const profiles = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [Query.equal('userId', String(userId)), Query.limit(1)]);
        if (profiles.total > 0) {
          profile = profiles.documents[0];
          firstName = profile.firstName || null;
          lastName = profile.lastName || null;
        }
      } catch {}

      let subscriptions: any = null;
      try {
        const subs = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userSubscriptions', [Query.equal('userId', String(userId)), Query.limit(1)]);
        if (subs.total > 0) subscriptions = subs.documents[0];
      } catch {}

      const role = profile?.role || sessionUser?.prefs?.role || null;
      const accountStatus = profile?.accountStatus || 'approved';
      const subscriptionStatus = subscriptions?.subscriptionStatus || profile?.subscriptionStatus || 'inactive';
      const subscriptionExpiry = subscriptions?.subscriptionExpiry || null;

      return res.json({
        id: userId,
        name: sessionUser?.name,
        email: sessionUser?.email,
        firstName,
        lastName,
        role,
        accountStatus,
        subscriptionStatus,
        subscriptionExpiry,
      });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  });

  // Activate subscription using an activation code (guests only in your policy)
  app.post('/api/users/activate-subscription', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { activationCode } = (req.body || {}) as { activationCode?: string };
      if (!activationCode || String(activationCode).trim().length < 6) {
        return res.status(400).json({ message: 'Invalid activation code' });
      }
      // Validate code exists and unused (if activationCodes collection exists)
      let codeDoc: any = null;
      try {
        const codes = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'activationCodes',
          [Query.equal('code', String(activationCode).trim()), Query.limit(1)]
        );
        if (codes.total > 0) codeDoc = codes.documents[0];
      } catch {}
      if (codeDoc && codeDoc.status && codeDoc.status !== 'unused') {
        return res.status(409).json({ message: 'Activation code already used or expired' });
      }

      // Create or update userSubscriptions
      let existing: any = null;
      try {
        const subs = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'userSubscriptions',
          [Query.equal('userId', String(userId)), Query.limit(1)]
        );
        if (subs.total > 0) existing = subs.documents[0];
      } catch {}

      const now = new Date();
      // Determine duration: default 30 days; annual codes grant 365 days
      const durationDays = Number(codeDoc?.durationDays) || (String(codeDoc?.codeType || '').toLowerCase() === 'annual_1y' ? 365 : 30);
      const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const payload: any = {
        userId: String(userId),
        subscriptionStatus: 'active',
        subscriptionType: 'basic',
        subscriptionExpiry: expiry.toISOString(),
        examAccess: JSON.stringify(['jamb','waec','neco']),
      };

      if (existing) {
        // Append activation code to list
        let usedCodes: string[] = [];
        try { usedCodes = JSON.parse(existing.activationCodes || '[]'); } catch {}
        usedCodes.push(String(activationCode));
        payload.activationCodes = JSON.stringify(usedCodes);
        await databases.updateDocument(APPWRITE_DATABASE_ID!, 'userSubscriptions', existing.$id, payload);
      } else {
        payload.activationCodes = JSON.stringify([String(activationCode)]);
        await databases.createDocument(APPWRITE_DATABASE_ID!, 'userSubscriptions', ID.unique(), payload);
      }

      // Update legacy profile flag as well
      try {
        const profiles = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'userProfiles',
          [Query.equal('userId', String(userId)), Query.limit(1)]
        );
        if (profiles.total > 0) {
          await databases.updateDocument(APPWRITE_DATABASE_ID!, 'userProfiles', profiles.documents[0].$id, {
            subscriptionStatus: 'active'
          } as any);
        }
      } catch {}
      // Mark code as used
      if (codeDoc) {
        try {
          await databases.updateDocument(APPWRITE_DATABASE_ID!, 'activationCodes', codeDoc.$id, {
            status: 'used',
            assignedTo: String(userId),
            codeType: codeDoc?.codeType || null,
            durationDays: durationDays,
            usedAt: new Date().toISOString(),
          } as any);
        } catch {}
      }

      return res.json({ message: 'Subscription activated', subscriptionStatus: 'active', subscriptionExpiry: expiry.toISOString() });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to activate subscription' });
    }
  });

  // Admin: generate activation codes
  app.post('/api/admin/activation-codes', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const { count = 10, prefix = 'OHM', length = 10, codeType = 'trial_30d' } = (req.body || {}) as any;
      const codes: any[] = [];
      for (let i = 0; i < Math.min(1000, Number(count) || 10); i++) {
        const rand = Math.random().toString(36).slice(2).toUpperCase();
        const code = `${prefix}-${rand}`.slice(0, Number(length) || 10);
        const doc = await databases.createDocument(APPWRITE_DATABASE_ID!, 'activationCodes', ID.unique(), {
          code,
          status: 'unused',
          codeType,
          durationDays: String(codeType).toLowerCase() === 'annual_1y' ? 365 : 30,
          createdAt: new Date().toISOString(),
        } as any);
        codes.push({ code: doc.code || code });
      }
      return res.json({ codes });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to generate codes' });
    }
  });

  // Admin: list activation codes
  app.get('/api/admin/activation-codes', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'activationCodes', [Query.limit(100)]);
      return res.json({ codes: page.documents, total: page.total });
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to list codes' });
    }
  });

  // Admin endpoints for account approval
  app.get('/api/admin/pending-accounts', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'userProfiles',
        [Query.equal('accountStatus', 'pending'), Query.limit(100)]
      );

      res.json({ accounts: result.documents, total: result.total });
    } catch (error) {
      logError('Error fetching pending accounts', error);
      res.status(500).json({ message: 'Failed to fetch pending accounts' });
    }
  });

  app.post('/api/admin/approve-account/:userId', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId } = req.params;
      const { role = 'student' } = req.body;

      // Update user profile
      const profileResult = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'userProfiles',
        [Query.equal('userId', userId), Query.limit(1)]
      );

      if (profileResult.total === 0) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      const profileId = profileResult.documents[0].$id;
      await databases.updateDocument(APPWRITE_DATABASE_ID!, 'userProfiles', profileId, {
        accountStatus: 'approved',
        role: role,
        approvedBy: sessionUser.$id,
        approvedAt: new Date().toISOString(),
      });

      // Update user preferences
      await users.updatePrefs(userId, { role });

      res.json({ message: 'Account approved successfully' });
    } catch (error) {
      logError('Error approving account', error);
      res.status(500).json({ message: 'Failed to approve account' });
    }
  });

  app.post('/api/admin/reject-account/:userId', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId } = req.params;
      const { reason } = req.body;

      // Update user profile
      const profileResult = await databases.listDocuments(
        APPWRITE_DATABASE_ID!,
        'userProfiles',
        [Query.equal('userId', userId), Query.limit(1)]
      );

      if (profileResult.total === 0) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      const profileId = profileResult.documents[0].$id;
      await databases.updateDocument(APPWRITE_DATABASE_ID!, 'userProfiles', profileId, {
        accountStatus: 'rejected',
        rejectionReason: reason,
        approvedBy: sessionUser.$id,
        approvedAt: new Date().toISOString(),
      });

      res.json({ message: 'Account rejected' });
    } catch (error) {
      logError('Error rejecting account', error);
      res.status(500).json({ message: 'Failed to reject account' });
    }
  });

  // DEBUG: Test Appwrite connectivity for students collection
  app.get('/api/debug/students', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [Query.limit(1)]);
      res.json({ success: true, count: result.documents.length, student: result.documents[0] });
    } catch (error) {
      logError('Failed to fetch students debug info', error);
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

  // Health/Admin status endpoint
  app.get('/api/admin/health', auth, async (req, res) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Basic counts to avoid heavy queries
      const collections = ['userProfiles','userSubscriptions','userProfileExtras','students','teachers','exams','questions','examAttempts','messages','notifications'];
      const counts: Record<string, number> = {};

      for (const col of collections) {
        try {
          const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, col, [Query.limit(1)]);
          counts[col] = result.total || 0;
        } catch (e) {
          counts[col] = -1; // indicates not accessible/not present
        }
      }

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        counts,
      });
    } catch (error) {
      logError('Health endpoint error', error);
      res.status(500).json({ status: 'error' });
    }
  });

  // Auth utilities for cookie-based auth: issue JWT cookie + CSRF token
  app.post('/api/auth/jwt-cookie', async (req, res) => {
    try {
      const token = String((req.body || {}).jwt || '');
      if (!token) return res.status(400).json({ message: 'Missing jwt' });
      // Very light validation; full validation occurs in auth middleware
      const csrfToken = Math.random().toString(36).slice(2);
      const isProd = app.get('env') === 'production';
      res.cookie('aw_jwt', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({ ok: true, csrfToken });
    } catch (e) {
      res.status(500).json({ message: 'Failed to set auth cookies' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    const isProd = app.get('env') === 'production';
    res.cookie('aw_jwt', '', { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: 0 });
    res.cookie('csrf_token', '', { httpOnly: false, secure: isProd, sameSite: 'strict', path: '/', maxAge: 0 });
    return res.json({ ok: true });
  });

  return httpServer;
}