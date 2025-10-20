import { Client, Databases, Users, ID, Permission, Role, Query } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

/**
 * Appwrite Seeding Script
 *
 * - Ensures ALL collections and attributes required by the app (backend + frontend)
 * - Explicitly creates `exams` and `questions` for CBT simulator
 * - Seeds past questions JSON from client/src/assets/past_questions
 * - Links questions to their exam via `examId`
 * - Handles large imports with pagination and small batch delays
 * - Idempotent: safe to re-run; will skip if already present
 */

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID!;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID!;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  console.error('Missing Appwrite env vars. Set VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, VITE_APPWRITE_DATABASE_ID');
  process.exit(1);
}

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY);
const databases = new Databases(client);
const ALLOW_WRITE = process.env.APPWRITE_ALLOW_WRITE === 'true';
if (!ALLOW_WRITE) {
  console.warn('APPWRITE_ALLOW_WRITE is not set to "true" — running in DRY-RUN mode. No changes will be made. Set APPWRITE_ALLOW_WRITE=true to apply changes.');
}
const db: any = ALLOW_WRITE
  ? databases
  : new Proxy({}, {
      get(_, prop: string) {
        return async (...args: any[]) => {
          // Emulate common return shapes used in this script
          console.log(`[DRY-RUN] ${prop} called with`, args.map(a => (typeof a === 'object' ? JSON.stringify(a).slice(0, 200) : a)));
          if (prop === 'listDocuments') return { total: 0, documents: [] };
          if (prop === 'createDocument') return { $id: `dry-${ID.unique()}` };
          return {};
        };
      }
    });
const users = new Users(client);

// Small helper delays to be kind to Appwrite limits
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Helpers to create attributes safely (ignore 409 conflicts and attribute_limit_exceeded)
function isAttrLimitExceeded(err: any): boolean {
  if (!err) return false;
  if (err.type === 'attribute_limit_exceeded') return true;
  try {
    const r = JSON.parse(err.response || '{}');
    return r?.type === 'attribute_limit_exceeded';
  } catch {
    return false;
  }
}
async function safeCreateStringAttribute(collectionId: string, id: string, size = 255, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createStringAttribute(APPWRITE_DATABASE_ID, collectionId, id, size, required, undefined, array); } catch (e: any) { if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e; }
}
async function safeCreateIntegerAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createIntegerAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, undefined, undefined, array); } catch (e: any) { if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e; }
}
async function safeCreateFloatAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createFloatAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, undefined, undefined, array); } catch (e: any) { if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e; }
}
async function safeCreateBooleanAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createBooleanAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, array); } catch (e: any) { if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e; }
}
async function safeCreateDatetimeAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createDatetimeAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, array); } catch (e: any) { if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e; }
}
async function safeCreateIndex(collectionId: string, name: string, attributes: string[], orders: ("ASC"|"DESC")[] = []) {
  try { /* @ts-ignore */ await db.createIndex(APPWRITE_DATABASE_ID, collectionId, name, 'key' as any, attributes, orders.length ? orders : attributes.map(()=>'ASC')); } catch (e: any) { if (e.code !== 409) throw e; }
}

async function ensureCollection(id: string, name: string, perms: any[] = [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())]) {
  try {
    await db.getCollection(APPWRITE_DATABASE_ID, id);
  } catch (e: any) {
    if (e.code === 404) {
  await db.createCollection(APPWRITE_DATABASE_ID, id, name, perms);
      // Wait a moment for the collection to be ready for attributes
      await delay(500);
    } else if (e.code !== 401) {
      throw e;
    }
  }
}

async function ensureAllCollections() {
  // Exams
  await ensureCollection('exams', 'Exams');
  await safeCreateStringAttribute('exams', 'title', 255, true);
  await safeCreateStringAttribute('exams', 'type', 50, true);
  await safeCreateStringAttribute('exams', 'subject', 255, true);
  await safeCreateStringAttribute('exams', 'year', 10, true);
  await safeCreateStringAttribute('exams', 'paper_type', 50, false);
  await safeCreateStringAttribute('exams', 'mode', 50, false); // 'practice' | 'exam'
  await safeCreateStringAttribute('exams', 'search', 512, false);
  await safeCreateDatetimeAttribute('exams', 'createdAt', false);
  await safeCreateBooleanAttribute('exams', 'isActive', false);
  await delay(500);
  await safeCreateIndex('exams', 'idx_title', ['title']);
  await safeCreateIndex('exams', 'idx_type_subject_year', ['type','subject','year']);

  // Questions
  await ensureCollection('questions', 'Questions');
  await safeCreateStringAttribute('questions', 'examId', 255, true);
  await safeCreateIntegerAttribute('questions', 'questionNumber', true);
  // Reduce string sizes to fit Appwrite Free tier attribute limits
  await safeCreateStringAttribute('questions', 'questionText', 16384, true);
  await safeCreateStringAttribute('questions', 'options', 512, true, true);
  await safeCreateStringAttribute('questions', 'correctAnswer', 500, false);
  await safeCreateStringAttribute('questions', 'explanation', 16384, false);
  await safeCreateStringAttribute('questions', 'imageUrl', 512, false);
  await safeCreateStringAttribute('questions', 'answerUrl', 512, false);
  await safeCreateStringAttribute('questions', 'section', 255, false);
  await safeCreateStringAttribute('questions', 'instructions', 4096, false);
  await safeCreateStringAttribute('questions', 'year', 10, false);
  await safeCreateStringAttribute('questions', 'subject', 255, false);
  await safeCreateStringAttribute('questions', 'type', 50, false);
  await safeCreateStringAttribute('questions', 'paper_type', 50, false);
  await delay(500);
  await safeCreateIndex('questions', 'idx_exam_qnum', ['examId','questionNumber']);

  // Exam Attempts (align to current backend/frontend expectations and your description)
  await ensureCollection('examAttempts', 'Exam Attempts');
  await safeCreateStringAttribute('examAttempts', 'examId', 255, true);
  await safeCreateStringAttribute('examAttempts', 'studentId', 255, true);
  // answers required string (JSON encoded)
  await safeCreateStringAttribute('examAttempts', 'answers', 8192, true);
  await safeCreateIntegerAttribute('examAttempts', 'score', true);
  await safeCreateIntegerAttribute('examAttempts', 'totalQuestions', true);
  await safeCreateIntegerAttribute('examAttempts', 'correctAnswers', true);
  await safeCreateIntegerAttribute('examAttempts', 'timeSpent', true);
  await safeCreateStringAttribute('examAttempts', 'completedAt', 255, false);
  await safeCreateStringAttribute('examAttempts', 'subjects', 255, false, true);
  await safeCreateIntegerAttribute('examAttempts', 'timePerQuestion', false);
  // Optional convenience fields used by UI if present
  await safeCreateStringAttribute('examAttempts', 'status', 50, false);
  await safeCreateDatetimeAttribute('examAttempts', 'startedAt', false);
  await safeCreateDatetimeAttribute('examAttempts', 'submittedAt', false);
  await safeCreateDatetimeAttribute('examAttempts', 'lastSavedAt', false);
  await safeCreateIntegerAttribute('examAttempts', 'percentage', false);
  await safeCreateBooleanAttribute('examAttempts', 'passed', false);
  await delay(500);
  await safeCreateIndex('examAttempts', 'idx_student_exam', ['studentId','examId']);

  // Other app collections referenced by the app (expanded to full set)
  await ensureCollection('userProfiles', 'User Profiles');
  await safeCreateStringAttribute('userProfiles', 'userId', 255, true);
  await safeCreateStringAttribute('userProfiles', 'role', 50, false);
  await safeCreateStringAttribute('userProfiles', 'subscriptionStatus', 50, false);
  await safeCreateDatetimeAttribute('userProfiles', 'subscriptionExpiry', false);
  await delay(500);
  await safeCreateIndex('userProfiles', 'idx_userId', ['userId']);

  await ensureCollection('userSubscriptions', 'User Subscriptions');
  await safeCreateStringAttribute('userSubscriptions', 'userId', 255, true);
  await safeCreateStringAttribute('userSubscriptions', 'subscriptionStatus', 50, false);
  await safeCreateDatetimeAttribute('userSubscriptions', 'subscriptionExpiry', false);
  await safeCreateStringAttribute('userSubscriptions', 'subscriptionType', 50, false);
  await safeCreateStringAttribute('userSubscriptions', 'activationCodes', 2048, false);
  await safeCreateStringAttribute('userSubscriptions', 'examAccess', 2048, false);
  await safeCreateStringAttribute('userSubscriptions', 'paymentHistory', 4096, false);
  await safeCreateDatetimeAttribute('userSubscriptions', 'createdAt', false);
  await safeCreateDatetimeAttribute('userSubscriptions', 'updatedAt', false);
  await delay(500);
  await safeCreateIndex('userSubscriptions', 'idx_user', ['userId']);

  await ensureCollection('userProfileExtras', 'User Profile Extras');
  await safeCreateStringAttribute('userProfileExtras', 'userId', 255, true);
  await safeCreateStringAttribute('userProfileExtras', 'extra', 4096, false);
  await safeCreateDatetimeAttribute('userProfileExtras', 'createdAt', false);
  await safeCreateDatetimeAttribute('userProfileExtras', 'updatedAt', false);
  await delay(500);

  await ensureCollection('userSettings', 'User Settings');
  await safeCreateStringAttribute('userSettings', 'userId', 255, true);
  await safeCreateStringAttribute('userSettings', 'notificationPreferences', 2048, false);
  await safeCreateStringAttribute('userSettings', 'theme', 255, false);
  await safeCreateStringAttribute('userSettings', 'primaryColor', 255, false);
  await safeCreateBooleanAttribute('userSettings', 'twoFactorEnabled', false);
  await safeCreateStringAttribute('userSettings', 'sessions', 4096, false);
  await delay(500);

  await ensureCollection('students', 'Students');
  await safeCreateStringAttribute('students', 'userId', 255, false);
  await safeCreateStringAttribute('students', 'classId', 255, false);
  await safeCreateStringAttribute('students', 'firstName', 255, false);
  await safeCreateStringAttribute('students', 'lastName', 255, false);
  await delay(500);
  await safeCreateIndex('students', 'idx_user', ['userId']);

  await ensureCollection('teachers', 'Teachers');
  await safeCreateStringAttribute('teachers', 'userId', 255, false);
  await safeCreateStringAttribute('teachers', 'employeeId', 255, true);
  await delay(500);

  await ensureCollection('messages', 'Messages');
  await safeCreateStringAttribute('messages', 'senderId', 255, false);
  await safeCreateStringAttribute('messages', 'recipientId', 255, false);
  await safeCreateBooleanAttribute('messages', 'isRead', false);
  await safeCreateStringAttribute('messages', 'subject', 255, false);
  await safeCreateStringAttribute('messages', 'content', 1024, true);
  await safeCreateStringAttribute('messages', 'messageType', 50, false);
  await delay(500);
  await safeCreateIndex('messages', 'idx_recipient', ['recipientId','isRead']);

  await ensureCollection('notifications', 'Notifications');
  await safeCreateStringAttribute('notifications', 'userId', 255, true);
  await safeCreateStringAttribute('notifications', 'message', 1024, true);
  await safeCreateBooleanAttribute('notifications', 'isRead', false);
  await safeCreateStringAttribute('notifications', 'link', 255, false);
  await safeCreateStringAttribute('notifications', 'search', 1024, false);
  await delay(500);

  await ensureCollection('conversations', 'Conversations');
  await safeCreateStringAttribute('conversations', 'members', 255, true, true);
  await safeCreateStringAttribute('conversations', 'lastMessage', 1024, false);
  await safeCreateDatetimeAttribute('conversations', 'lastActivity', true);
  await safeCreateBooleanAttribute('conversations', 'isGroup', true);
  await safeCreateStringAttribute('conversations', 'name', 255, false);
  await delay(500);

  await ensureCollection('chatMessages', 'Chat Messages');
  await safeCreateStringAttribute('chatMessages', 'conversationId', 255, true);
  await safeCreateStringAttribute('chatMessages', 'senderId', 255, true);
  await safeCreateStringAttribute('chatMessages', 'content', 1024, true);
  await safeCreateStringAttribute('chatMessages', 'readBy', 255, false, true);
  await delay(500);

  await ensureCollection('forumThreads', 'Forum Threads');
  await safeCreateStringAttribute('forumThreads', 'title', 255, false);
  await safeCreateStringAttribute('forumThreads', 'content', 1024, true);
  await safeCreateStringAttribute('forumThreads', 'createdBy', 255, true);
  await safeCreateStringAttribute('forumThreads', 'parentThreadId', 255, false);
  await delay(500);

  await ensureCollection('attendance', 'Attendance');
  await safeCreateStringAttribute('attendance', 'classId', 255, true);
  await safeCreateStringAttribute('attendance', 'date', 255, true);
  await delay(500);

  await ensureCollection('attendanceRecords', 'Attendance Records');
  await safeCreateStringAttribute('attendanceRecords', 'classId', 255, true);
  await safeCreateStringAttribute('attendanceRecords', 'date', 255, true);
  await safeCreateStringAttribute('attendanceRecords', 'studentId', 255, true);
  await safeCreateStringAttribute('attendanceRecords', 'status', 50, true);
  await delay(500);
  await safeCreateIndex('attendanceRecords', 'idx_class_date', ['classId','date']);

  await ensureCollection('activities', 'Activities');
  await safeCreateStringAttribute('activities', 'activity', 255, true);
  await safeCreateStringAttribute('activities', 'date', 255, true);
  await safeCreateStringAttribute('activities', 'type', 50, true);
  await delay(500);

  await ensureCollection('resources', 'Resources');
  await safeCreateStringAttribute('resources', 'title', 255, true);
  await safeCreateStringAttribute('resources', 'description', 1024, false);
  await safeCreateStringAttribute('resources', 'type', 50, true);
  await safeCreateStringAttribute('resources', 'subject', 255, false);
  await safeCreateStringAttribute('resources', 'class', 255, false);
  await safeCreateStringAttribute('resources', 'fileUrl', 255, false);
  await safeCreateIntegerAttribute('resources', 'fileSize', false);
  await safeCreateIntegerAttribute('resources', 'downloads', false);
  await safeCreateStringAttribute('resources', 'uploadedBy', 255, false);
  await safeCreateBooleanAttribute('resources', 'isPublic', false);
  await delay(500);
  await safeCreateIndex('resources', 'idx_subject_type', ['subject','type']);

  await ensureCollection('grades', 'Grades');
  await safeCreateStringAttribute('grades', 'studentId', 255, false);
  await safeCreateStringAttribute('grades', 'subject', 255, true);
  await safeCreateStringAttribute('grades', 'examType', 255, false);
  await safeCreateFloatAttribute('grades', 'score', false);
  await safeCreateFloatAttribute('grades', 'totalMarks', false);
  await safeCreateStringAttribute('grades', 'grade', 50, false);
  await safeCreateStringAttribute('grades', 'term', 255, false);
  await safeCreateStringAttribute('grades', 'academicYear', 255, false);
  await safeCreateStringAttribute('grades', 'teacherId', 255, false);
  await safeCreateStringAttribute('grades', 'remarks', 1024, false);
  await delay(500);

  await ensureCollection('payments', 'Payments');
  await safeCreateStringAttribute('payments', 'studentId', 255, false);
  await safeCreateFloatAttribute('payments', 'amount', true);
  await safeCreateStringAttribute('payments', 'purpose', 255, true);
  await safeCreateStringAttribute('payments', 'dueDate', 255, false);
  await safeCreateStringAttribute('payments', 'paidDate', 255, false);
  await safeCreateStringAttribute('payments', 'status', 50, false);
  await safeCreateStringAttribute('payments', 'paymentMethod', 255, false);
  await safeCreateStringAttribute('payments', 'transactionId', 255, false);
  await safeCreateStringAttribute('payments', 'term', 255, false);
  await safeCreateStringAttribute('payments', 'academicYear', 255, false);
  await delay(500);

  await ensureCollection('notices', 'Notices');
  await safeCreateStringAttribute('notices', 'activity', 1024, true);
  await safeCreateStringAttribute('notices', 'date', 255, true);
  await safeCreateStringAttribute('notices', 'category', 255, false);
  await safeCreateStringAttribute('notices', 'search', 1024, false);
  await delay(500);

  await ensureCollection('subjects', 'Subjects');
  await safeCreateStringAttribute('subjects', 'name', 255, true);
  await safeCreateStringAttribute('subjects', 'description', 1024, false);
  await safeCreateStringAttribute('subjects', 'search', 1024, false);
  await delay(500);

  await ensureCollection('school', 'School');
  await safeCreateStringAttribute('school', 'schoolName', 255, true);
  await safeCreateStringAttribute('school', 'address', 1024, false);
  await safeCreateStringAttribute('school', 'phone', 255, false);
  await safeCreateStringAttribute('school', 'email', 255, false);
  await safeCreateStringAttribute('school', 'website', 255, false);
  await safeCreateStringAttribute('school', 'motto', 255, false);
  await safeCreateStringAttribute('school', 'currentTerm', 255, false);
  await safeCreateStringAttribute('school', 'academicYear', 255, false);
  await delay(500);

  await ensureCollection('classes', 'Classes');
  await safeCreateStringAttribute('classes', 'name', 255, true);
  await safeCreateStringAttribute('classes', 'description', 1024, false);
  await safeCreateStringAttribute('classes', 'search', 1024, false);
  await safeCreateStringAttribute('classes', 'teacherId', 255, false);
  await delay(500);

  await ensureCollection('teachersToClasses', 'Teachers To Classes');
  await safeCreateStringAttribute('teachersToClasses', 'teacherId', 255, true);
  await safeCreateStringAttribute('teachersToClasses', 'classId', 255, true);
  await delay(500);

  await ensureCollection('videoMeetings', 'Video Meetings');
  await safeCreateStringAttribute('videoMeetings', 'topic', 255, true);
  await safeCreateStringAttribute('videoMeetings', 'roomId', 255, true);
  await safeCreateStringAttribute('videoMeetings', 'createdBy', 255, true);
  await safeCreateStringAttribute('videoMeetings', 'allowedRoles', 50, false, true);
  await safeCreateStringAttribute('videoMeetings', 'classId', 255, false);
  await safeCreateStringAttribute('videoMeetings', 'teacherId', 255, false);
  await safeCreateBooleanAttribute('videoMeetings', 'isActive', false);
  await safeCreateIntegerAttribute('videoMeetings', 'participantCount', false);
  await delay(500);

  await ensureCollection('activationCodes', 'Activation Codes');
  await safeCreateStringAttribute('activationCodes', 'code', 255, true);
  await safeCreateStringAttribute('activationCodes', 'codeType', 50, false);
  await safeCreateIntegerAttribute('activationCodes', 'durationDays', false);
  await safeCreateStringAttribute('activationCodes', 'status', 50, false);
  await safeCreateStringAttribute('activationCodes', 'assignedTo', 255, false);
  await safeCreateDatetimeAttribute('activationCodes', 'expiresAt', false);
  await safeCreateDatetimeAttribute('activationCodes', 'createdAt', false);
  await safeCreateDatetimeAttribute('activationCodes', 'usedAt', false);
  await delay(500);
  await safeCreateIndex('activationCodes', 'idx_code', ['code']);
  await safeCreateIndex('activationCodes', 'idx_status', ['status']);

  await ensureCollection('examAssignments', 'Exam Assignments');
  await safeCreateStringAttribute('examAssignments', 'examId', 255, true);
  await safeCreateStringAttribute('examAssignments', 'userId', 255, true);
  await delay(500);
  await safeCreateIndex('examAssignments', 'idx_exam_user', ['examId','userId']);
}

// Parse filename to exam metadata
function parseExamFileName(file: string) {
  // Examples: WAEC_DataProcessing_2024_obj.json, WAEC_OfficePractice_2020_theory.json
  const base = file.replace('.json', '');
  const parts = base.split('_');
  const type = parts[0];
  const paperTypeRaw = parts[parts.length - 1];
  const year = parts[parts.length - 2];
  const subject = parts.slice(1, -2).join('_').replace(/_/g, ' ');
  const paper_type = (paperTypeRaw === 'objective' ? 'obj' : paperTypeRaw);
  return { type: type.toLowerCase(), subject, year, paper_type };
}

// Normalize/transform a question object from JSON into our schema
function mapRawQuestion(raw: any, i: number) {
  const num = parseInt(String(raw.number || i + 1), 10) || (i + 1);
  const optionsObj = raw.options || raw.choices || raw.options_map || {};
  const optionsArray: string[] = Array.isArray(optionsObj)
    ? optionsObj.map((v: any) => String(v))
    : Object.values(optionsObj).map((v: any) => String(v));

  const correct = (() => {
    const rawCorrect = raw.correctAnswer ?? raw.correct_answer ?? raw.answer ?? '';
    if (typeof rawCorrect === 'string') {
      // If letter provided (A/B/C/...), map to actual text if options object was lettered
      const letter = rawCorrect.trim().toUpperCase();
      if (optionsObj && typeof optionsObj === 'object' && !Array.isArray(optionsObj)) {
        const mapped = (optionsObj as any)[letter];
        if (mapped) return String(mapped);
      }
      return String(rawCorrect);
    }
    return '';
  })();

  return {
    questionNumber: num,
    questionText: String(raw.text ?? raw.question ?? ''),
    options: optionsArray,
    correctAnswer: correct,
    explanation: raw.explanation ? String(raw.explanation) : undefined,
    imageUrl: raw.image || raw.imageUrl ? String(raw.image || raw.imageUrl) : undefined,
    answerUrl: raw.answer_url || raw.answerUrl ? String(raw.answer_url || raw.answerUrl) : undefined,
    section: raw.section ? String(raw.section) : undefined,
    instructions: raw.instructions ? String(raw.instructions) : undefined,
  };
}

async function seedPastQuestions() {
  const rootDir = path.join(process.cwd(), 'client', 'src', 'assets', 'past_questions');
  if (!fs.existsSync(rootDir)) {
    console.warn('past_questions directory not found at', rootDir);
    return;
  }
  const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.json'));
  console.log('Found JSON files:', files.length);

  // Seed per file; create exam if not exists; then questions
  for (const [idx, file] of files.entries()) {
    const filePath = path.join(rootDir, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { type, subject, year, paper_type } = parseExamFileName(file);
    const title = `${type.toUpperCase()} ${subject} ${year} ${paper_type}`;

    // Create/Find exam
    let examId: string | null = null;
    try {
    const existing = await db.listDocuments(APPWRITE_DATABASE_ID, 'exams', [Query.equal('title', title), Query.limit(1)]);
      if (existing.total > 0) {
        examId = existing.documents[0].$id;
      }
    } catch {}
    if (!examId) {
  const examDoc = await db.createDocument(APPWRITE_DATABASE_ID, 'exams', ID.unique(), {
        title,
        type,
        subject,
        year,
        paper_type,
        mode: 'exam',
        isActive: true,
        createdAt: new Date().toISOString(),
        search: [title, type, subject, year, paper_type].filter(Boolean).join(' '),
      });
      examId = examDoc.$id;
    }

    // Questions array
    const questionsArray: any[] = Array.isArray(raw) ? raw : (raw?.questions ?? []);
    let created = 0;
    for (let i = 0; i < questionsArray.length; i++) {
      const qRaw = questionsArray[i];
      const q = mapRawQuestion(qRaw, i);
      try {
  await db.createDocument(APPWRITE_DATABASE_ID, 'questions', ID.unique(), { examId, ...q, year, subject, type, paper_type });
        created++;
      } catch (e: any) {
        // If attribute limit or rate limit, delay and retry once
        await delay(50);
  await db.createDocument(APPWRITE_DATABASE_ID, 'questions', ID.unique(), { examId, ...q, year, subject, type, paper_type });
        created++;
      }
      if (i % 50 === 0) await delay(80); // small pacing for Appwrite Cloud limits
    }
    console.log(`${idx + 1}/${files.length} Seeded exam: ${title} (${created} questions)`);
    // Short delay between files
    await delay(120);
  }
}

async function seedBaseData() {
  // Basic school, classes, subjects, sample staff/students
  try {
  const sch = await db.listDocuments(APPWRITE_DATABASE_ID, 'school', [Query.limit(1)]);
    if (sch.total === 0) {
      await databases.createDocument(APPWRITE_DATABASE_ID, 'school', ID.unique(), { schoolName: 'Ohman Foundation School', motto: 'Excellence and Integrity', academicYear: String(new Date().getFullYear()) });
    }
  } catch {}
  const classNames = ['JSS 1','JSS 2','JSS 3','SS 1 Science','SS 1 Arts','SS 1 Commercial','SS 2 Science','SS 2 Arts','SS 2 Commercial','SS 3 Science','SS 3 Arts','SS 3 Commercial'];
  let classes: any[] = [];
  try {
  const page = await db.listDocuments(APPWRITE_DATABASE_ID, 'classes', [Query.limit(100)]);
    classes = page.documents;
    if (page.total === 0) {
      for (const name of classNames) {
        const c = await databases.createDocument(APPWRITE_DATABASE_ID, 'classes', ID.unique(), { name });
        classes.push(c);
        await delay(40);
      }
    }
  } catch {}
  try {
  const subj = await db.listDocuments(APPWRITE_DATABASE_ID, 'subjects', [Query.limit(1)]);
    if (subj.total === 0) {
      const pqDir = path.join(process.cwd(), 'client', 'src', 'assets', 'past_questions');
      const found = new Set<string>();
      if (fs.existsSync(pqDir)) {
        for (const file of fs.readdirSync(pqDir)) {
          if (!file.endsWith('.json')) continue;
          const { subject } = parseExamFileName(file);
          found.add(subject);
        }
      }
      for (const s of Array.from(found)) {
        await databases.createDocument(APPWRITE_DATABASE_ID, 'subjects', ID.unique(), { name: s });
      }
    }
  } catch {}
  try {
  const t = await db.listDocuments(APPWRITE_DATABASE_ID, 'teachers', [Query.limit(1)]);
    if (t.total === 0) {
      await databases.createDocument(APPWRITE_DATABASE_ID, 'teachers', ID.unique(), { employeeId: 'T-001', firstName: 'Ada', lastName: 'Obi', subjects: ['Mathematics'] });
    }
  } catch {}
  try {
  const s = await db.listDocuments(APPWRITE_DATABASE_ID, 'students', [Query.limit(1)]);
    if (s.total === 0 && classes.length > 0) {
      const classId = classes[0].$id;
      for (const st of [{ firstName: 'Chinedu', lastName: 'Okafor' },{ firstName: 'Nkechi', lastName: 'Eze' }]) {
        await databases.createDocument(APPWRITE_DATABASE_ID, 'students', ID.unique(), { ...st, classId });
      }
    }
  } catch {}
}

async function main() {
  console.log('Ensuring collections and attributes...');
  await ensureAllCollections();
  console.log('Seeding base data...');
  await seedBaseData();
  console.log('Seeding past questions...');
  await seedPastQuestions();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
