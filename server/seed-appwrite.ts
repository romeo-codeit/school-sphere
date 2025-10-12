import { Client, Users, ID, Databases, Permission, Role, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';

/**
 * WARNING: DO NOT DELETE, RECREATE, OR MODIFY THE 'exams' OR 'questions' COLLECTIONS!
 * These collections contain all past question data. Tampering with them will result in data loss.
 * Only use this script to seed new data. Do not drop or alter the collections in Appwrite manually or programmatically.
 */
dotenv.config();

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const APPWRITE_DATABASE_NAME = "OhmanFoundationDB";

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
  {
    id: 'userSettings',
    name: 'User Settings',
    attributes: [
      { id: 'userId', type: 'string', size: 255, required: true },
      { id: 'notificationPreferences', type: 'string', size: 2048, required: false }, // JSON string
      { id: 'theme', type: 'string', size: 255, required: false },
      { id: 'primaryColor', type: 'string', size: 255, required: false },
      { id: 'twoFactorEnabled', type: 'boolean', required: false, default: false },
      { id: 'sessions', type: 'string', size: 4096, required: false }, // JSON string for session info
    ]
  },
  {
    id: 'userProfiles',
    name: 'User Profiles',
    attributes: [
      { id: 'userId', type: 'string', size: 255, required: true },
      { id: 'profilePhotoUrl', type: 'string', size: 1024, required: false },
      { id: 'dateOfBirth', type: 'string', size: 255, required: false },
      { id: 'gender', type: 'string', size: 50, required: false },
      { id: 'address', type: 'string', size: 1024, required: false },
      { id: 'parentName', type: 'string', size: 255, required: false },
      { id: 'role', type: 'string', size: 50, required: false },
      { id: 'bio', type: 'string', size: 1024, required: false },
      { id: 'extra', type: 'string', size: 2048, required: false }, // JSON for subscription data and other extra fields
      // Account approval fields
      { id: 'accountStatus', type: 'string', size: 50, required: false, default: 'pending' }, // 'pending', 'approved', 'rejected', 'suspended'
      { id: 'approvedBy', type: 'string', size: 255, required: false }, // Admin user ID who approved
      { id: 'approvedAt', type: 'datetime', required: false },
      { id: 'rejectionReason', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'students',
    name: 'Students',
    attributes: [
      { id: 'userId', type: 'string', size: 255, required: false },
      { id: 'studentId', type: 'string', size: 255, required: true },
      { id: 'firstName', type: 'string', size: 255, required: true },
      { id: 'lastName', type: 'string', size: 255, required: true },
      { id: 'email', type: 'string', size: 255, required: false },
      { id: 'phone', type: 'string', size: 255, required: false },
      { id: 'dateOfBirth', type: 'string', size: 255, required: false },
      { id: 'gender', type: 'string', size: 50, required: false },
      { id: 'address', type: 'string', size: 1024, required: false },
      { id: 'parentName', type: 'string', size: 255, required: false },
      { id: 'parentPhone', type: 'string', size: 255, required: false },
      { id: 'parentEmail', type: 'string', size: 255, required: false },
      { id: 'class', type: 'string', size: 255, required: false },
      { id: 'enrollmentDate', type: 'string', size: 255, required: false },
      { id: 'status', type: 'string', size: 50, required: false },
      { id: 'search', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'notifications',
    name: 'Notifications',
    attributes: [
  { id: 'userId', type: 'string', size: 255, required: true },
  { id: 'message', type: 'string', size: 1024, required: true },
  { id: 'isRead', type: 'boolean', required: true, default: false },
  { id: 'link', type: 'string', size: 255, required: false },
  { id: 'search', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'conversations',
    name: 'Conversations',
    attributes: [
        { id: 'members', type: 'string', size: 255, required: true, array: true },
        { id: 'lastMessage', type: 'string', size: 1024, required: false },
        { id: 'lastActivity', type: 'datetime', required: true },
        { id: 'isGroup', type: 'boolean', required: true, default: false },
        { id: 'name', type: 'string', size: 255, required: false }, // For group chats
    ]
  },
  {
    id: 'teachers',
    name: 'Teachers',
    attributes: [
        { id: 'userId', type: 'string', size: 255, required: false },
        { id: 'employeeId', type: 'string', size: 255, required: true },
        { id: 'firstName', type: 'string', size: 255, required: true },
        { id: 'lastName', type: 'string', size: 255, required: true },
        { id: 'email', type: 'string', size: 255, required: false },
        { id: 'phone', type: 'string', size: 255, required: false },
        { id: 'subjects', type: 'string', size: 255, required: false, array: true },
        { id: 'qualification', type: 'string', size: 255, required: false },
        { id: 'experience', type: 'integer', required: false },
        { id: 'status', type: 'string', size: 50, required: false },
        { id: 'gender', type: 'string', size: 50, required: false },
        { id: 'classIds', type: 'string', size: 255, required: false, array: true },
        { id: 'search', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'exams',
    name: 'Exams',
    attributes: [
        { id: 'title', type: 'string', size: 255, required: true },
        { id: 'type', type: 'string', size: 50, required: true },
        { id: 'subject', type: 'string', size: 255, required: true },
        { id: 'year', type: 'string', size: 10, required: true },
        { id: 'paper_type', type: 'string', size: 50, required: true },
        // Phase 1: Role-based visibility and mode
        { id: 'assignedTo', type: 'string', size: 255, required: false, array: true }, // IDs of classes or students
        { id: 'mode', type: 'string', size: 50, required: false }, // 'practice' | 'exam'
        { id: 'search', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'questions',
    name: 'Questions',
    attributes: [
  { id: 'examId', type: 'string', size: 255, required: true },
  { id: 'questionNumber', type: 'integer', required: true },
  { id: 'questionText', type: 'string', size: 65535, required: true },
  { id: 'options', type: 'string', size: 1024, required: true, array: true },
  { id: 'correctAnswer', type: 'string', size: 500, required: false },
  { id: 'explanation', type: 'string', size: 65535, required: false },
  { id: 'imageUrl', type: 'string', size: 1024, required: false },
  { id: 'answerUrl', type: 'string', size: 1024, required: false },
  { id: 'section', type: 'string', size: 500, required: false },
  { id: 'instructions', type: 'string', size: 65535, required: false },
    ]
  },
  {
    id: 'examAttempts',
    name: 'Exam Attempts',
    attributes: [
        { id: 'examId', type: 'string', size: 255, required: false },
        { id: 'studentId', type: 'string', size: 255, required: false },
        { id: 'answers', type: 'string', size: 1024, required: false },
        { id: 'score', type: 'integer', required: false },
        { id: 'totalQuestions', type: 'integer', required: false },
        { id: 'correctAnswers', type: 'integer', required: false },
        { id: 'timeSpent', type: 'integer', required: false },
        // Phase 1: Subject selection tracking and analytics
        { id: 'subjects', type: 'string', size: 255, required: false, array: true },
        { id: 'timePerQuestion', type: 'integer', required: false },
        { id: 'completedAt', type: 'string', size: 255, required: false },
    ]
  },
  {
    id: 'payments',
    name: 'Payments',
    attributes: [
        { id: 'studentId', type: 'string', size: 255, required: false },
        { id: 'amount', type: 'float', required: true },
        { id: 'purpose', type: 'string', size: 255, required: true },
        { id: 'dueDate', type: 'string', size: 255, required: false },
        { id: 'paidDate', type: 'string', size: 255, required: false },
        { id: 'status', type: 'string', size: 50, required: false },
        { id: 'paymentMethod', type: 'string', size: 255, required: false },
        { id: 'transactionId', type: 'string', size: 255, required: false },
        { id: 'term', type: 'string', size: 255, required: false },
        { id: 'academicYear', type: 'string', size: 255, required: false },
    ]
  },
  {
    id: 'attendance',
    name: 'Attendance',
    attributes: [
        { id: 'classId', type: 'string', size: 255, required: true },
        { id: 'date', type: 'string', size: 255, required: true },
        // Deprecated: studentAttendances (do not add or update this attribute)
    ]
  },
  {
    id: 'attendanceRecords',
    name: 'Attendance Records',
    attributes: [
      { id: 'classId', type: 'string', size: 255, required: true },
      { id: 'date', type: 'string', size: 255, required: true },
      { id: 'studentId', type: 'string', size: 255, required: true },
      { id: 'status', type: 'string', size: 50, required: true },
    ]
  },
  {
    id: 'messages',
    name: 'Messages',
    attributes: [
        { id: 'senderId', type: 'string', size: 255, required: false },
        { id: 'recipientId', type: 'string', size: 255, required: false },
        { id: 'subject', type: 'string', size: 255, required: false },
        { id: 'content', type: 'string', size: 1024, required: true },
        { id: 'isRead', type: 'boolean', required: false },
        { id: 'messageType', type: 'string', size: 50, required: false },
    ]
  },
  {
    id: 'resources',
    name: 'Resources',
    attributes: [
        { id: 'title', type: 'string', size: 255, required: true },
        { id: 'description', type: 'string', size: 1024, required: false },
        { id: 'type', type: 'string', size: 50, required: true },
        { id: 'subject', type: 'string', size: 255, required: false },
        { id: 'class', type: 'string', size: 255, required: false },
        { id: 'fileUrl', type: 'string', size: 255, required: false },
        { id: 'fileSize', type: 'integer', required: false },
        { id: 'downloads', type: 'integer', required: false },
        { id: 'uploadedBy', type: 'string', size: 255, required: false },
        { id: 'isPublic', type: 'boolean', required: false },
    ]
  },
  {
    id: 'grades',
    name: 'Grades',
    attributes: [
        { id: 'studentId', type: 'string', size: 255, required: false },
        { id: 'subject', type: 'string', size: 255, required: true },
        { id: 'examType', type: 'string', size: 255, required: false },
        { id: 'score', type: 'float', required: false },
        { id: 'totalMarks', type: 'float', required: false },
        { id: 'grade', type: 'string', size: 50, required: false },
        { id: 'term', type: 'string', size: 255, required: false },
        { id: 'academicYear', type: 'string', size: 255, required: false },
        { id: 'teacherId', type: 'string', size: 255, required: false },
        { id: 'remarks', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'videoMeetings',
    name: 'Video Meetings',
    attributes: [
        { id: 'topic', type: 'string', size: 255, required: true },
        { id: 'roomId', type: 'string', size: 255, required: true },
        { id: 'createdBy', type: 'string', size: 255, required: true },
        { id: 'allowedRoles', type: 'string', size: 50, required: false, array: true },
        { id: 'classId', type: 'string', size: 255, required: false },
        { id: 'teacherId', type: 'string', size: 255, required: false },
        { id: 'isActive', type: 'boolean', required: false, default: true },
        { id: 'participantCount', type: 'integer', required: false, default: 0 },
    ]
  },
  {
    id: 'chatMessages',
    name: 'Chat Messages',
    attributes: [
        { id: 'conversationId', type: 'string', size: 255, required: true },
        { id: 'senderId', type: 'string', size: 255, required: true },
        { id: 'content', type: 'string', size: 1024, required: true },
        { id: 'readBy', type: 'string', size: 255, required: false, array: true },
    ]
  },
  {
    id: 'forumThreads',
    name: 'Forum Threads',
    attributes: [
        { id: 'title', type: 'string', size: 255, required: false }, // Not required for replies
        { id: 'content', type: 'string', size: 1024, required: true },
        { id: 'createdBy', type: 'string', size: 255, required: true },
        { id: 'parentThreadId', type: 'string', size: 255, required: false }, // For replies
    ]
  },
  {
    id: 'activities',
    name: 'Activities',
    attributes: [
        { id: 'activity', type: 'string', size: 255, required: true },
        { id: 'date', type: 'string', size: 255, required: true },
        { id: 'type', type: 'string', size: 50, required: true },
    ]
  },
  {
    id: 'school',
    name: 'School',
    attributes: [
        { id: 'schoolName', type: 'string', size: 255, required: true },
        { id: 'address', type: 'string', size: 1024, required: false },
        { id: 'phone', type: 'string', size: 255, required: false },
        { id: 'email', type: 'string', size: 255, required: false },
        { id: 'website', type: 'string', size: 255, required: false },
        { id: 'motto', type: 'string', size: 255, required: false },
        { id: 'currentTerm', type: 'string', size: 255, required: false },
        { id: 'academicYear', type: 'string', size: 255, required: false },
    ]
  },
  {
    id: 'classes',
    name: 'Classes',
    attributes: [
  { id: 'name', type: 'string', size: 255, required: true },
  { id: 'description', type: 'string', size: 1024, required: false },
  { id: 'search', type: 'string', size: 1024, required: false },
      { id: 'teacherId', type: 'string', size: 255, required: false },
    ]
  },
  {
    id: 'teachersToClasses',
    name: 'Teachers To Classes',
    attributes: [
      { id: 'teacherId', type: 'string', size: 255, required: true },
      { id: 'classId', type: 'string', size: 255, required: true },
    ]
  },
  {
    id: 'subjects',
    name: 'Subjects',
    attributes: [
      { id: 'name', type: 'string', size: 255, required: true },
      { id: 'description', type: 'string', size: 1024, required: false },
      { id: 'search', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'notices',
    name: 'Notices',
    attributes: [
      { id: 'activity', type: 'string', size: 1024, required: true },
      { id: 'date', type: 'string', size: 255, required: true },
      { id: 'category', type: 'string', size: 255, required: false },
      { id: 'search', type: 'string', size: 1024, required: false },
    ]
  },
  {
    id: 'userSubscriptions',
    name: 'User Subscriptions',
    attributes: [
      { id: 'userId', type: 'string', size: 255, required: true },
      { id: 'subscriptionStatus', type: 'string', size: 50, required: false, default: 'inactive' }, // 'active', 'inactive', 'expired'
      { id: 'subscriptionType', type: 'string', size: 50, required: false }, // 'basic', 'premium', 'unlimited'
      { id: 'subscriptionExpiry', type: 'datetime', required: false },
      { id: 'activationCodes', type: 'string', size: 2048, required: false }, // JSON array of used activation codes
      { id: 'examAccess', type: 'string', size: 2048, required: false }, // JSON array of accessible exam types
      { id: 'paymentHistory', type: 'string', size: 4096, required: false }, // JSON array of payment records
      { id: 'createdAt', type: 'datetime', required: false },
      { id: 'updatedAt', type: 'datetime', required: false },
    ]
  },
];

async function createDatabaseIfNotExists() {
  try {
    await databases.get(APPWRITE_DATABASE_ID!!);
    console.log('Database exists.');
  } catch (error: any) {
    if (error.code === 404) {
      try {
        await databases.create(APPWRITE_DATABASE_ID!, APPWRITE_DATABASE_NAME);
        console.log(`Database '${APPWRITE_DATABASE_NAME}' created.`);
      } catch (creationError) {
        console.error("Error creating database:", creationError);
        throw creationError;
      }
    } else if (error.code === 401) {
      // API key doesn't have permission to check database existence
      // Assume database exists and continue
      console.log('Database check skipped due to API key permissions. Assuming database exists.');
    } else {
      console.error("Error checking database:", error);
      throw error;
    }
  }
}

async function seedCollections() {
  console.log('Seeding collections...');



  for (const collection of collections) {
    try {
      await databases.getCollection(APPWRITE_DATABASE_ID!, collection.id);
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`Creating collection '${collection.name}'...`);
        await databases.createCollection(APPWRITE_DATABASE_ID!, collection.id, collection.name, [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]);
        console.log(`Collection '${collection.name}' created.`);
      } else if (error.code === 401) {
        // API key doesn't have permission to check collection existence
        // Assume collection exists and continue
        console.log(`Collection '${collection.name}' check skipped due to API key permissions. Assuming it exists.`);
      } else {
        console.error(`Error checking collection '${collection.name}':`, error);
        throw error;
      }
    }

    for (const attr of collection.attributes) {
      try {
        switch (attr.type) {
          case 'string':
            await databases.createStringAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.size || 255, attr.required, undefined, (attr as any).array || false);
            break;
          case 'integer':
            // @ts-ignore
            await databases.createIntegerAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.required, undefined, (attr as any).default ? parseInt((attr as any).default) : undefined, (attr as any).array || false);
            break;
          case 'float':
            // @ts-ignore
            await databases.createFloatAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.required, undefined, (attr as any).default ? parseFloat((attr as any).default) : undefined, (attr as any).array || false);
            break;
          case 'boolean':
            await databases.createBooleanAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.required, undefined, (attr as any).array || false);
            break;
        }
      } catch (error: any) {
        if (error.code === 401) {
          console.log(`Attribute '${attr.id}' creation skipped due to API key permissions. Assuming it exists.`);
        } else if (error.code !== 409) {
          console.error(`Error creating attribute '${attr.id}' in collection '${collection.name}':`, error);
        }
      }
    }
  }

  console.log('Collection seeding complete.');
}

const demoUsers = [
  {
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'teacher@example.com',
    password: 'password123',
    name: 'Teacher User',
    role: 'teacher',
  },
  {
    email: 'student@example.com',
    password: 'password123',
    name: 'Student User',
    role: 'student',
  },
  {
    email: 'parent@example.com',
    password: 'password123',
    name: 'Parent User',
    role: 'parent',
  },
];

async function seedDemoUsers() {
  console.log('Seeding demo users...');

  for (const userData of demoUsers) {
    try {
      const existingUsers = await users.list({
        search: userData.email,
      });

      if (existingUsers.total > 0) {
        continue;
      }

      const newUser = await users.create(
        ID.unique(),
        userData.email,
        undefined, // phone
        userData.password,
        userData.name
      );

      await users.updatePrefs(newUser.$id, { role: userData.role });

    } catch (error: any) {
      if (error.code === 401) {
        console.log(`User '${userData.email}' creation skipped due to API key permissions. Assuming user exists or will be created manually.`);
      } else {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }
  }

  console.log('Demo user seeding complete.');
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function seedExamsOnly() {
  console.log('Seeding exams only...');

  const dbId = APPWRITE_DATABASE_ID!;


  // Parse command-line args for exam type filter
  const argv = minimist(process.argv.slice(2));
  const filterType = argv.type ? String(argv.type).toLowerCase() : undefined;

  const assetsPath = path.join(process.cwd(), 'client', 'src', 'assets', 'past_questions');
  let files = fs.readdirSync(assetsPath).filter(f => f.endsWith('.json') && !f.includes('practical'));
  if (filterType) {
    files = files.filter(f => f.toLowerCase().startsWith(filterType));
    if (files.length === 0) {
      console.log(`No files found for exam type: ${filterType}`);
      return;
    }
    console.log(`Seeding only exam type: ${filterType} (${files.length} files)`);
  }
  console.log('Seeding exams from JSON files...');
  for (const file of files) {
    const filePath = path.join(assetsPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const parts = file.replace('.json', '').split('_');
    const exam_type = parts[0];
    const subject = parts.slice(1, -2).join('_');
    const exam_year = parts[parts.length - 2];
    const paper_type = parts[parts.length - 1];

    // Validation
    if (!exam_year || !exam_type || !subject || !paper_type) {
      console.log(`Skipping file ${file}: invalid parsing - type: ${exam_type}, subject: ${subject}, year: ${exam_year}, paper_type: ${paper_type}`);
      continue;
    }
    if (filterType && exam_type.toLowerCase() !== filterType) {
      continue; // Extra safety: skip if not matching filter
    }

    const title = `${exam_type} ${subject} ${exam_year} ${paper_type}`;
    
    // Only make internal exams public by default, not standardized exams
    const isStandardizedExam = ['waec', 'neco', 'jamb'].includes(exam_type.toLowerCase());
    
    const exam = {
      title,
      type: exam_type.toLowerCase(),
      subject: subject.replace(/_/g, ' '),
      year: exam_year,
      paper_type,
      ...(isStandardizedExam ? {} : { assignedTo: [] }), // Only internal exams are public by default
      mode: 'exam',
    };
    const search = [exam.title, exam.type, exam.subject, exam.year, exam.paper_type].filter(Boolean).join(' ');

    // Check if exam already exists to prevent duplication
    const existingExams = await databases.listDocuments(dbId, 'exams', [
      Query.equal('title', title)
    ]);
    if (existingExams.total > 0) {
      console.log(`Exam already exists: ${title}, skipping...`);
      continue;
    }

    const examDoc = await databases.createDocument(dbId, 'exams', ID.unique(), { ...exam, search });
    console.log(`Created exam: ${title}`);

    // Seed questions in parallel for speed, sanitize all string fields
    const sanitizeString = (val: any, max = 65535) => {
      if (typeof val !== 'string') return undefined;
      return val.length > max ? val.slice(0, max) : val;
    };
    const sanitizeOptions = (opts: any[]) =>
      Array.isArray(opts)
        ? opts.map(o => (typeof o === 'string' ? sanitizeString(o, 1024) : (o ? String(o).slice(0, 1024) : undefined))).filter(Boolean)
        : [];

    const questionPromises = data.map((q: any, i: number) => {
      const question = {
        examId: examDoc.$id,
        questionNumber: parseInt(q.number) || (i + 1),
        questionText: sanitizeString(q.text, 65535),
        options: sanitizeOptions(Object.values(q.options || {})),
        correctAnswer: sanitizeString(q.correct_answer, 500),
        explanation: sanitizeString(q.explanation, 65535),
        imageUrl: sanitizeString(q.image, 1024),
        answerUrl: sanitizeString(q.answer_url, 1024),
        section: sanitizeString(q.section, 500),
        instructions: sanitizeString(q.instructions, 65535),
      };
      return databases.createDocument(dbId, 'questions', ID.unique(), question);
    });
    await Promise.all(questionPromises);
    console.log(`Seeded ${data.length} questions for ${title}`);
  }
  console.log('Exams and questions seeded.');
}

async function seedDemoData() {
    console.log('Seeding demo data...');

    // Get user IDs
    let studentUserId, teacherUserId, adminUserId;
    try {
      const studentUserList = await users.list({ search: 'student@example.com' });
      const teacherUserList = await users.list({ search: 'teacher@example.com' });
      const adminUserList = await users.list({ search: 'admin@example.com' });

      if (studentUserList.total === 0 || teacherUserList.total === 0 || adminUserList.total === 0) {
          console.log("Demo users not found or API key lacks user permissions. Using dummy user IDs for data seeding.");
          studentUserId = 'dummy_student_id';
          teacherUserId = 'dummy_teacher_id';
          adminUserId = 'dummy_admin_id';
      } else {
          studentUserId = studentUserList.users[0].$id;
          teacherUserId = teacherUserList.users[0].$id;
          adminUserId = adminUserList.users[0].$id;
      }
    } catch (error: any) {
      if (error.code === 401) {
        console.log('User listing failed due to API key permissions. Using dummy user IDs for data seeding.');
        studentUserId = 'dummy_student_id';
        teacherUserId = 'dummy_teacher_id';
        adminUserId = 'dummy_admin_id';
      } else {
        console.error("Error accessing users:", error);
        return;
      }
    }

    // Seed classes (force reseed)
  const dbId = APPWRITE_DATABASE_ID!;
  const classesCollection = await databases.listDocuments(dbId, 'classes');
  if (classesCollection.total > 0) {
    console.log('Clearing existing classes...');
    for (const cls of classesCollection.documents) {
      await databases.deleteDocument(dbId, 'classes', cls.$id);
      await delay(10);
    }
  }
  console.log('Seeding classes...');
  const classData = [
    { name: 'JSS 1', teacherId: teacherUserId },
    { name: 'JSS 2', teacherId: teacherUserId },
    { name: 'JSS 3', teacherId: teacherUserId },
    { name: 'SS 1 Science', teacherId: teacherUserId },
    { name: 'SS 1 Arts', teacherId: teacherUserId },
    { name: 'SS 1 Commercial', teacherId: teacherUserId },
    { name: 'SS 2 Science', teacherId: teacherUserId },
    { name: 'SS 2 Arts', teacherId: teacherUserId },
    { name: 'SS 2 Commercial', teacherId: teacherUserId },
    { name: 'SS 3 Science', teacherId: teacherUserId },
    { name: 'SS 3 Arts', teacherId: teacherUserId },
    { name: 'SS 3 Commercial', teacherId: teacherUserId },
  ];
  for (const c of classData) {
    await databases.createDocument(dbId, 'classes', ID.unique(), c);
    await delay(100);
  }
  console.log('Classes seeded.');
  const seededClasses = await databases.listDocuments(dbId, 'classes');

    // Seed students (force reseed)
  const studentsCollection = await databases.listDocuments(dbId, 'students');
  if (studentsCollection.total > 0) {
    console.log('Clearing existing students...');
    for (const student of studentsCollection.documents) {
      await databases.deleteDocument(dbId, 'students', student.$id);
      await delay(10);
    }
  }
  console.log('Seeding students...');
  const studentData = [
    // JSS 1 (6 students)
    { userId: studentUserId, studentId: 'S001', firstName: 'Chinedu', lastName: 'Okafor', email: 'chinedu.okafor@school.ng', class: seededClasses.documents[0].$id, status: 'active', gender: 'male', parentName: 'Mrs. Okafor', parentPhone: '08031234567', parentEmail: 'mrs.okafor@school.ng' },
    { userId: ID.unique(), studentId: 'S002', firstName: 'Nkechi', lastName: 'Eze', email: 'nkechi.eze@school.ng', class: seededClasses.documents[0].$id, status: 'active', gender: 'female', parentName: 'Mr. Eze', parentPhone: '08021234567', parentEmail: 'mr.eze@school.ng' },
    { userId: ID.unique(), studentId: 'S003', firstName: 'Emeka', lastName: 'Nwosu', email: 'emeka.nwosu@school.ng', class: seededClasses.documents[0].$id, status: 'active', gender: 'male', parentName: 'Mrs. Nwosu', parentPhone: '08011234567', parentEmail: 'mrs.nwosu@school.ng' },
    { userId: ID.unique(), studentId: 'S004', firstName: 'Adaora', lastName: 'Okoye', email: 'adaora.okoye@school.ng', class: seededClasses.documents[0].$id, status: 'active', gender: 'female', parentName: 'Mr. Okoye', parentPhone: '08041234567', parentEmail: 'mr.okoye@school.ng' },
    { userId: ID.unique(), studentId: 'S005', firstName: 'Ifeanyi', lastName: 'Uche', email: 'ifeanyi.uche@school.ng', class: seededClasses.documents[0].$id, status: 'active', gender: 'male', parentName: 'Mrs. Uche', parentPhone: '08051234567', parentEmail: 'mrs.uche@school.ng' },
    { userId: ID.unique(), studentId: 'S006', firstName: 'Chioma', lastName: 'Nnamdi', email: 'chioma.nnamdi@school.ng', class: seededClasses.documents[0].$id, status: 'active', gender: 'female', parentName: 'Mr. Nnamdi', parentPhone: '08061234567', parentEmail: 'mr.nnamdi@school.ng' },

    // JSS 2 (5 students)
    { userId: ID.unique(), studentId: 'S007', firstName: 'Kenechukwu', lastName: 'Ibe', email: 'kenechukwu.ibe@school.ng', class: seededClasses.documents[1].$id, status: 'active', gender: 'male', parentName: 'Mrs. Ibe', parentPhone: '08071234567', parentEmail: 'mrs.ibe@school.ng' },
    { userId: ID.unique(), studentId: 'S008', firstName: 'Ngozi', lastName: 'Obi', email: 'ngozi.obi@school.ng', class: seededClasses.documents[1].$id, status: 'active', gender: 'female', parentName: 'Mr. Obi', parentPhone: '08081234567', parentEmail: 'mr.obi@school.ng' },
    { userId: ID.unique(), studentId: 'S009', firstName: 'Chukwudi', lastName: 'Anyanwu', email: 'chukwudi.anyanwu@school.ng', class: seededClasses.documents[1].$id, status: 'active', gender: 'male', parentName: 'Mrs. Anyanwu', parentPhone: '08091234567', parentEmail: 'mrs.anyanwu@school.ng' },
    { userId: ID.unique(), studentId: 'S010', firstName: 'Amara', lastName: 'Okoro', email: 'amara.okoro@school.ng', class: seededClasses.documents[1].$id, status: 'active', gender: 'female', parentName: 'Mr. Okoro', parentPhone: '08101234567', parentEmail: 'mr.okoro@school.ng' },
    { userId: ID.unique(), studentId: 'S011', firstName: 'Obinna', lastName: 'Nweke', email: 'obinna.nweke@school.ng', class: seededClasses.documents[1].$id, status: 'active', gender: 'male', parentName: 'Mrs. Nweke', parentPhone: '08111234567', parentEmail: 'mrs.nweke@school.ng' },

    // JSS 3 (4 students)
    { userId: ID.unique(), studentId: 'S012', firstName: 'Chidiebere', lastName: 'Onyeka', email: 'chidiebere.onyeka@school.ng', class: seededClasses.documents[2].$id, status: 'active', gender: 'male', parentName: 'Mrs. Onyeka', parentPhone: '08121234567', parentEmail: 'mrs.onyeka@school.ng' },
    { userId: ID.unique(), studentId: 'S013', firstName: 'Ifunanya', lastName: 'Chukwu', email: 'ifunanya.chukwu@school.ng', class: seededClasses.documents[2].$id, status: 'active', gender: 'female', parentName: 'Mr. Chukwu', parentPhone: '08131234567', parentEmail: 'mr.chukwu@school.ng' },
    { userId: ID.unique(), studentId: 'S014', firstName: 'Nnamdi', lastName: 'Okonkwo', email: 'nnamdi.okonkwo@school.ng', class: seededClasses.documents[2].$id, status: 'active', gender: 'male', parentName: 'Mrs. Okonkwo', parentPhone: '08141234567', parentEmail: 'mrs.okonkwo@school.ng' },
    { userId: ID.unique(), studentId: 'S015', firstName: 'Uchenna', lastName: 'Madu', email: 'uchenna.madu@school.ng', class: seededClasses.documents[2].$id, status: 'active', gender: 'female', parentName: 'Mr. Madu', parentPhone: '08151234567', parentEmail: 'mr.madu@school.ng' },

    // SS 1 Science (2 students)
    { userId: ID.unique(), studentId: 'S016', firstName: 'Chukwuma', lastName: 'Ekwueme', email: 'chukwuma.ekwueme@school.ng', class: seededClasses.documents[3].$id, status: 'active', gender: 'male', parentName: 'Mrs. Ekwueme', parentPhone: '08161234567', parentEmail: 'mrs.ekwueme@school.ng' },
    { userId: ID.unique(), studentId: 'S017', firstName: 'Ogechi', lastName: 'Nwachukwu', email: 'ogechi.nwachukwu@school.ng', class: seededClasses.documents[3].$id, status: 'active', gender: 'female', parentName: 'Mr. Nwachukwu', parentPhone: '08171234567', parentEmail: 'mr.nwachukwu@school.ng' },

    // SS 1 Arts (2 students)
    { userId: ID.unique(), studentId: 'S018', firstName: 'Ebuka', lastName: 'Okafor', email: 'ebuka.okafor@school.ng', class: seededClasses.documents[4].$id, status: 'active', gender: 'male', parentName: 'Mrs. Okafor', parentPhone: '08181234567', parentEmail: 'mrs.okafor2@school.ng' },
    { userId: ID.unique(), studentId: 'S019', firstName: 'Chinwe', lastName: 'Iwu', email: 'chinwe.iwu@school.ng', class: seededClasses.documents[4].$id, status: 'active', gender: 'female', parentName: 'Mr. Iwu', parentPhone: '08191234567', parentEmail: 'mr.iwu@school.ng' },

    // SS 1 Commercial (2 students)
    { userId: ID.unique(), studentId: 'S020', firstName: 'Chibuzor', lastName: 'Agu', email: 'chibuzor.agu@school.ng', class: seededClasses.documents[5].$id, status: 'active', gender: 'male', parentName: 'Mrs. Agu', parentPhone: '08201234567', parentEmail: 'mrs.agu@school.ng' },
    { userId: ID.unique(), studentId: 'S021', firstName: 'Nkiruka', lastName: 'Oguejiofor', email: 'nkiruka.oguejiofor@school.ng', class: seededClasses.documents[5].$id, status: 'active', gender: 'female', parentName: 'Mr. Oguejiofor', parentPhone: '08211234567', parentEmail: 'mr.oguejiofor@school.ng' },

    // SS 2 Science (1 student)
    { userId: ID.unique(), studentId: 'S022', firstName: 'Kamsiyochukwu', lastName: 'Okoli', email: 'kamsiyochukwu.okoli@school.ng', class: seededClasses.documents[6].$id, status: 'active', gender: 'male', parentName: 'Mrs. Okoli', parentPhone: '08221234567', parentEmail: 'mrs.okoli@school.ng' },

    // SS 3 Arts (1 student)
    { userId: ID.unique(), studentId: 'S023', firstName: 'Obianuju', lastName: 'Nduka', email: 'obianuju.nduka@school.ng', class: seededClasses.documents[10].$id, status: 'active', gender: 'female', parentName: 'Mr. Nduka', parentPhone: '08231234567', parentEmail: 'mr.nduka@school.ng' },
  ];
  for (const student of studentData) {
    const search = [student.firstName, student.lastName, student.email, student.studentId, student.class, student.status, student.gender].filter(Boolean).join(' ');
    await databases.createDocument(dbId, 'students', ID.unique(), { ...student, search });
    await delay(100);
  }
  console.log('Students seeded.');

    // Seed teachers (force reseed)
  const teachersCollection = await databases.listDocuments(dbId, 'teachers');
  if (teachersCollection.total > 0) {
    console.log('Clearing existing teachers...');
    for (const teacher of teachersCollection.documents) {
      await databases.deleteDocument(dbId, 'teachers', teacher.$id);
      await delay(10);
    }
  }
  console.log('Seeding teachers...');
  const teacherData = [
    { userId: teacherUserId, employeeId: 'T001', firstName: 'Olufemi', lastName: 'Adeyemi', email: 'olufemi.adeyemi@school.ng', subjects: ['Mathematics', 'Physics'], status: 'active', gender: 'male', classIds: [seededClasses.documents[0].$id, seededClasses.documents[1].$id] },
    { userId: ID.unique(), employeeId: 'T002', firstName: 'Grace', lastName: 'Nnamdi', email: 'grace.nnamdi@school.ng', subjects: ['English Language', 'Literature in English'], status: 'active', gender: 'female', classIds: [seededClasses.documents[1].$id, seededClasses.documents[2].$id] },
    { userId: ID.unique(), employeeId: 'T003', firstName: 'Musa', lastName: 'Ibrahim', email: 'musa.ibrahim@school.ng', subjects: ['Biology', 'Chemistry'], status: 'active', gender: 'male', classIds: [seededClasses.documents[3].$id, seededClasses.documents[6].$id] },
    { userId: ID.unique(), employeeId: 'T004', firstName: 'Chiamaka', lastName: 'Okeke', email: 'chiamaka.okeke@school.ng', subjects: ['Civic Education', 'Government'], status: 'active', gender: 'female', classIds: [seededClasses.documents[4].$id, seededClasses.documents[7].$id] },
    { userId: ID.unique(), employeeId: 'T005', firstName: 'Babatunde', lastName: 'Ogun', email: 'babatunde.ogun@school.ng', subjects: ['Economics', 'Commerce'], status: 'active', gender: 'male', classIds: [seededClasses.documents[5].$id, seededClasses.documents[8].$id] },
    { userId: ID.unique(), employeeId: 'T006', firstName: 'Nkechi', lastName: 'Obi', email: 'nkechi.obi@school.ng', subjects: ['Mathematics', 'Further Mathematics'], status: 'active', gender: 'female', classIds: [seededClasses.documents[9].$id, seededClasses.documents[10].$id] },
    { userId: ID.unique(), employeeId: 'T007', firstName: 'Chukwudi', lastName: 'Eze', email: 'chukwudi.eze@school.ng', subjects: ['Physics', 'Chemistry'], status: 'active', gender: 'male', classIds: [seededClasses.documents[6].$id, seededClasses.documents[9].$id] },
    { userId: ID.unique(), employeeId: 'T008', firstName: 'Adaora', lastName: 'Nwachukwu', email: 'adaora.nwachukwu@school.ng', subjects: ['English Language', 'Literature in English'], status: 'active', gender: 'female', classIds: [seededClasses.documents[7].$id, seededClasses.documents[10].$id] },
    { userId: ID.unique(), employeeId: 'T009', firstName: 'Ifeanyi', lastName: 'Okoro', email: 'ifeanyi.okoro@school.ng', subjects: ['Geography', 'History'], status: 'active', gender: 'male', classIds: [seededClasses.documents[4].$id, seededClasses.documents[7].$id] },
    { userId: ID.unique(), employeeId: 'T010', firstName: 'Chioma', lastName: 'Anyanwu', email: 'chioma.anyanwu@school.ng', subjects: ['Accounting', 'Commerce'], status: 'active', gender: 'female', classIds: [seededClasses.documents[5].$id, seededClasses.documents[8].$id] },
    { userId: ID.unique(), employeeId: 'T011', firstName: 'Obinna', lastName: 'Madu', email: 'obinna.madu@school.ng', subjects: ['Computer Studies', 'Basic Technology'], status: 'active', gender: 'male', classIds: [seededClasses.documents[0].$id, seededClasses.documents[1].$id, seededClasses.documents[2].$id] },
    { userId: ID.unique(), employeeId: 'T012', firstName: 'Ifunanya', lastName: 'Onyeka', email: 'ifunanya.onyeka@school.ng', subjects: ['Home Economics', 'Physical and Health Education'], status: 'active', gender: 'female', classIds: [seededClasses.documents[1].$id, seededClasses.documents[2].$id] },
  ];
  for (const teacher of teacherData) {
    const search = [teacher.firstName, teacher.lastName, teacher.email, teacher.employeeId, ...(teacher.subjects || []), teacher.status, teacher.gender, ...(teacher.classIds || [])].filter(Boolean).join(' ');
    await databases.createDocument(dbId, 'teachers', ID.unique(), { ...teacher, search });
    await delay(100);
  }
  console.log('Teachers seeded.');
  // IMPORTANT: Do NOT touch exams or questions in this seeding flow
  console.log('Skipping exams/questions seeding: existing data will be preserved.');

  const seededStudents = await databases.listDocuments(dbId, 'students');
  const seededExams = await databases.listDocuments(dbId, 'exams');
  const seededTeachers = await databases.listDocuments(dbId, 'teachers');

    // Seed exam attempts
  const examAttemptsCollection = await databases.listDocuments(dbId, 'examAttempts');
    if (examAttemptsCollection.total === 0 && seededStudents.total > 0 && seededExams.total > 0) {
        console.log('Seeding exam attempts...');
        for (const student of seededStudents.documents) {
            for (const exam of seededExams.documents) {
                const attempt = {
                    examId: exam.$id,
                    studentId: student.$id,
                    answers: JSON.stringify([{ "question": "...", "selectedOption": "..." }]),
                    score: Math.floor(Math.random() * 100),
                    totalQuestions: 1,
                    correctAnswers: Math.floor(Math.random() * 2),
                    timeSpent: Math.floor(Math.random() * 60),
                    completedAt: new Date().toISOString(),
                };
                await databases.createDocument(dbId, 'examAttempts', ID.unique(), attempt);
                await delay(100);
            }
        }
        console.log('Exam attempts seeded.');
    }

    // Seed payments
  const paymentsCollection = await databases.listDocuments(dbId, 'payments');
    if (paymentsCollection.total === 0 && seededStudents.total > 0) {
        console.log('Seeding payments...');
        for (const student of seededStudents.documents) {
            const paymentData = { studentId: student.$id, amount: 50000.00, purpose: 'School Fees', status: 'pending' };
            await databases.createDocument(dbId, 'payments', ID.unique(), paymentData);
            await delay(100);
        }
        console.log('Payments seeded.');
    }

  // Seed attendance records (normalized)
  const attendanceRecordsCollection = await databases.listDocuments(dbId, 'attendanceRecords');
  if (attendanceRecordsCollection.total === 0 && seededClasses.total > 0) {
    console.log('Seeding attendance records...');
    for (const aClass of seededClasses.documents) {
            const classStudents = await databases.listDocuments(dbId, 'students', [
        Query.equal('classId', aClass.$id)
      ]);
      if (classStudents.total > 0) {
        for (const student of classStudents.documents) {
          const attendanceRecord = {
            classId: aClass.$id,
            date: new Date().toISOString(),
            studentId: student.$id,
            status: 'present',
          };
                    await databases.createDocument(dbId, 'attendanceRecords', ID.unique(), attendanceRecord);
          await delay(20);
        }
      }
    }
    console.log('Attendance records seeded.');
  }

    // Seed messages
  const messagesCollection = await databases.listDocuments(dbId, 'messages');
    if (messagesCollection.total === 0 && seededStudents.total > 0 && seededTeachers.total > 0) {
        console.log('Seeding messages...');
        const studentId = seededStudents.documents[0].$id;
        const teacherId = seededTeachers.documents[0].$id;
        const messageData = [
            { senderId: teacherId, recipientId: studentId, subject: 'Welcome', content: 'Welcome to the new school year!', isRead: false, messageType: 'notification' },
            { senderId: studentId, recipientId: teacherId, subject: 'Re: Welcome', content: 'Thank you!', isRead: false, messageType: 'personal' },
        ];
        for (const message of messageData) {
            await databases.createDocument(dbId, 'messages', ID.unique(), message);
            await delay(100);
        }
        console.log('Messages seeded.');
    }

    // Seed resources
  const resourcesCollection = await databases.listDocuments(dbId, 'resources');
  if (resourcesCollection.total === 0 && seededTeachers.total > 0) {
        console.log('Seeding resources...');
        const teacherId = seededTeachers.documents[0].$id;
        const resourceData = [
            { title: 'Mathematics Textbook', description: 'JSS 1 Mathematics Textbook', type: 'pdf', subject: 'Mathematics', class: 'JSS 1A', uploadedBy: teacherId, isPublic: true },
            { title: 'English Language Video', description: 'A video on nouns', type: 'video', subject: 'English', class: 'JSS 1', uploadedBy: teacherId, isPublic: true },
        ];
        for (const resource of resourceData) {
            await databases.createDocument(dbId, 'resources', ID.unique(), resource);
            await delay(100);
        }
        console.log('Resources seeded.');
    }

    // Seed grades
  const gradesCollection = await databases.listDocuments(dbId, 'grades');
  if (gradesCollection.total === 0 && seededStudents.total > 0 && seededExams.total > 0 && seededTeachers.total > 0) {
        console.log('Seeding grades...');
        const teacherId = seededTeachers.documents[0].$id;
        for (const student of seededStudents.documents) {
            for (const exam of seededExams.documents) {
                const gradeData = {
                    studentId: student.$id,
                    subject: exam.subject,
                    examType: exam.type,
                    score: Math.floor(Math.random() * 100),
                    totalMarks: 100,
                    grade: ['A', 'B', 'C', 'D', 'F'][Math.floor(Math.random() * 5)],
                    term: 'First Term',
                    academicYear: '2024/2025',
                    teacherId: teacherId
                };
                await databases.createDocument(dbId, 'grades', ID.unique(), gradeData);
                await delay(100);
            }
        }
        console.log('Grades seeded.');
    }

  // Seed subjects (force reseed with Nigerian secondary school subjects)
  const subjectsCollection = await databases.listDocuments(dbId, 'subjects');
  if (subjectsCollection.total > 0) {
    console.log('Clearing existing subjects...');
    for (const subject of subjectsCollection.documents) {
      await databases.deleteDocument(dbId, 'subjects', subject.$id);
      await delay(10);
    }
  }
  console.log('Seeding subjects...');
  const subjectData = [
    // Core subjects (JSS & SS)
    { name: 'Mathematics', description: 'Mathematics for all classes' },
    { name: 'English Language', description: 'English Language for all classes' },
    { name: 'Civic Education', description: 'Civic Education' },
    { name: 'Basic Science', description: 'Basic Science for JSS' },
    { name: 'Basic Technology', description: 'Basic Technology for JSS' },
    
    // Sciences
    { name: 'Biology', description: 'Biology for science students' },
    { name: 'Chemistry', description: 'Chemistry for science students' },
    { name: 'Physics', description: 'Physics for science students' },
    { name: 'Agricultural Science', description: 'Agricultural Science' },
    { name: 'Further Mathematics', description: 'Further Mathematics for science students' },
    
    // Arts
    { name: 'Literature in English', description: 'Literature in English for arts students' },
    { name: 'Government', description: 'Government for arts and commercial students' },
    { name: 'History', description: 'History for arts students' },
    { name: 'Christian Religious Studies', description: 'CRS' },
    { name: 'Islamic Religious Studies', description: 'IRS' },
    { name: 'Geography', description: 'Geography' },
    
    // Commercial
    { name: 'Economics', description: 'Economics for arts and commercial students' },
    { name: 'Commerce', description: 'Commerce for commercial students' },
    { name: 'Accounting', description: 'Accounting for commercial students' },
    { name: 'Financial Accounting', description: 'Financial Accounting' },
    
    // General/Vocational
    { name: 'Computer Studies', description: 'Computer Studies' },
    { name: 'Home Economics', description: 'Home Economics' },
    { name: 'Physical and Health Education', description: 'PHE' },
    { name: 'Music', description: 'Music' },
    { name: 'Fine Arts', description: 'Fine Arts and Visual Arts' },
    { name: 'French', description: 'French Language' },
    { name: 'Yoruba', description: 'Yoruba Language' },
    { name: 'Igbo', description: 'Igbo Language' },
    { name: 'Hausa', description: 'Hausa Language' },
  ];
  for (const subject of subjectData) {
    const search = [subject.name, subject.description].filter(Boolean).join(' ');
    await databases.createDocument(dbId, 'subjects', ID.unique(), { ...subject, search });
    await delay(100);
  }
  console.log('Subjects seeded.');

    // Seed school information
  const schoolCollection = await databases.listDocuments(dbId, 'school');
  if (schoolCollection.total === 0) {
    console.log('Seeding school information...');
    const schoolData = {
      schoolName: 'Ohman Foundation Secondary School',
      address: '123 Independence Avenue, Awka, Anambra State, Nigeria',
      phone: '+234 803 123 4567',
      email: 'info@ohmanfoundation.edu.ng',
      website: 'https://ohmanfoundation.edu.ng',
      motto: 'Excellence Through Knowledge',
      currentTerm: 'First Term',
      academicYear: '2024/2025',
    };
    await databases.createDocument(dbId, 'school', ID.unique(), schoolData);
    console.log('School information seeded.');
  }

    // Seed video meetings
  const videoMeetingsCollection = await databases.listDocuments(dbId, 'videoMeetings');
    if (videoMeetingsCollection.total === 0 && seededTeachers.total > 0) {
        console.log('Seeding video meetings...');
        const teacherId = seededTeachers.documents[0].$id;
        const meetingData = {
            topic: 'JSS 1 Mathematics Class',
            roomId: ID.unique(),
            createdBy: teacherId,
            allowedRoles: ['student'],
            classId: 'JSS 1A',
            teacherId: teacherId,
            isActive: true,
            participantCount: 0,
        };
  await databases.createDocument(dbId, 'videoMeetings', ID.unique(), meetingData);
        console.log('Video meetings seeded.');
    }

    // Seed chat messages
  const chatMessagesCollection = await databases.listDocuments(dbId, 'chatMessages');
    if (chatMessagesCollection.total === 0 && seededStudents.total > 0 && seededTeachers.total > 0) {
        console.log('Seeding chat messages...');
        const studentId = seededStudents.documents[0].$id;
        const teacherId = seededTeachers.documents[0].$id;
        const conversationId = `chat_${studentId}_${teacherId}`;
        const chatData = [
            { conversationId, senderId: studentId, content: 'Hello Sir, I have a question.' },
            { conversationId, senderId: teacherId, content: 'Hello, how can I help you?' },
        ];
        for (const chat of chatData) {
            await databases.createDocument(dbId, 'chatMessages', ID.unique(), chat);
            await delay(100);
        }
        console.log('Chat messages seeded.');
    }

    // Seed forum threads
  const forumThreadsCollection = await databases.listDocuments(dbId, 'forumThreads');
  if (forumThreadsCollection.total === 0 && seededStudents.total > 0 && seededTeachers.total > 0) {
        console.log('Seeding forum threads...');
        const studentId = seededStudents.documents[0].$id;
        const teacherId = seededTeachers.documents[0].$id;
        const threadData = {
            title: 'Doubts about Photosynthesis',
            content: 'Can someone explain the process of photosynthesis again?',
            createdBy: studentId,
        };
  const parentThread = await databases.createDocument(dbId, 'forumThreads', ID.unique(), threadData);
        await delay(100);
        const replyData = {
            content: 'Sure, I can help with that. Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight into chemical energy.',
            createdBy: teacherId,
            parentThreadId: parentThread.$id,
        };
  await databases.createDocument(dbId, 'forumThreads', ID.unique(), replyData);
        console.log('Forum threads seeded.');
    }

    // Seed activities
  const activitiesCollection = await databases.listDocuments(dbId, 'activities');
  if (activitiesCollection.total === 0) {
        console.log('Seeding activities...');
        const activityData = [
            { activity: "23 new students registered successfully", date: new Date().toISOString(), type: 'new_student' },
            { activity: "School fees payment received from 18 students", date: new Date(Date.now() - 15 * 60 * 1000).toISOString(), type: 'payment_received' },
            { activity: "New JAMB questions uploaded for 2025 exams", date: new Date(Date.now() - 60 * 60 * 1000).toISOString(), type: 'exam_uploaded' },
            { activity: "Payment overdue alert for 5 students", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'payment_overdue' },
        ];
        for (const activity of activityData) {
            await databases.createDocument(dbId, 'activities', ID.unique(), activity);
            await delay(100);
        }
        console.log('Activities seeded.');
    }

    console.log('Demo data seeding complete.');
}

async function unassignStandardizedExams() {
  console.log('Unassigning WAEC, NECO, and JAMB exams...');

  try {
    const dbId = APPWRITE_DATABASE_ID!;
    const standardizedTypes = ['waec', 'neco', 'jamb'];

    // Get all exams and filter for standardized ones
    const result = await databases.listDocuments(dbId, 'exams', [Query.limit(1000)]);
    const standardizedExams = result.documents.filter(exam =>
      standardizedTypes.includes(exam.type?.toLowerCase())
    );

    console.log(`Found ${standardizedExams.length} standardized exams to unassign`);

    for (const exam of standardizedExams) {
      console.log(`Unassigning: ${exam.title}`);
      // Remove the assignedTo field entirely by setting it to null
      await databases.updateDocument(dbId, 'exams', exam.$id, { assignedTo: null });
    }

    console.log('✅ All WAEC, NECO, and JAMB exams have been unassigned!');

  } catch (error) {
    console.error('❌ Error unassigning exams:', error);
  }
}

async function main() {
  console.log('Starting database setup and attribute updates...');
  await createDatabaseIfNotExists();
  // Ensure new attributes required by Phase 1 exist without dropping collections
  await ensurePhase1Attributes();
  // Ensure collections and attributes exist (non-destructive)
  await seedCollections();
  // Unassign WAEC, NECO, and JAMB exams from all roles
  await unassignStandardizedExams();
  // Seed users, classes, students, teachers, payments, attendance, messages, etc.
  await seedDemoUsers();
  await seedDemoData();
  // Explicitly skip all exams/questions seeding paths
  console.log('Done. Exams and questions collections were not modified.');
}

main();

// Ensures Phase 1 attributes exist on existing collections without destructive changes
async function ensurePhase1Attributes() {
  const dbId = APPWRITE_DATABASE_ID!;
  console.log('Ensuring Phase 1 attributes exist...');
  // Helper wrappers to create attributes if not exists (ignore 409 conflict)
  async function safeCreateStringAttribute(collectionId: string, id: string, size = 255, required = false, array = false) {
    try {
      // @ts-ignore
      await databases.createStringAttribute(dbId, collectionId, id, size, required, undefined, array);
      console.log(`Created string attribute ${collectionId}.${id}`);
    } catch (e: any) {
      if (e?.code !== 409) console.warn(`Could not create ${collectionId}.${id}:`, e?.message || e);
    }
  }
  async function safeCreateIntegerAttribute(collectionId: string, id: string, required = false, array = false) {
    try {
      // @ts-ignore
      await databases.createIntegerAttribute(dbId, collectionId, id, required, undefined, undefined, undefined, array);
      console.log(`Created integer attribute ${collectionId}.${id}`);
    } catch (e: any) {
      if (e?.code !== 409) console.warn(`Could not create ${collectionId}.${id}:`, e?.message || e);
    }
  }

  // Exams: assignedTo (string[]), mode (string)
  await safeCreateStringAttribute('exams', 'assignedTo', 255, false, true);
  await safeCreateStringAttribute('exams', 'mode', 50, false, false);

  // ExamAttempts: subjects (string[]), timePerQuestion (integer)
  await safeCreateStringAttribute('examAttempts', 'subjects', 255, false, true);
  await safeCreateIntegerAttribute('examAttempts', 'timePerQuestion', false, false);
}
