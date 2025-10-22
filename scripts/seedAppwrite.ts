import { Client, Databases, Users, ID, Permission, Role, Query } from 'node-appwrite';
import 'dotenv/config';
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

const client = new Client().setEndpoint(APPWRITE_ENDPOINT!).setProject(APPWRITE_PROJECT_ID!).setKey(APPWRITE_API_KEY);
const databases = new Databases(client);
const users = new Users(client);
const ALLOW_WRITE = process.env.APPWRITE_ALLOW_WRITE === 'true';
// Seeding performance knobs (safe defaults for Appwrite free tier)
const SEED_Q_CONCURRENCY = Math.max(1, parseInt(process.env.SEED_Q_CONCURRENCY || '5', 10));
const SEED_BATCH_PAUSE_MS = Math.max(0, parseInt(process.env.SEED_BATCH_PAUSE_MS || '40', 10));
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

const usersProxy: any = ALLOW_WRITE
  ? users
  : new Proxy({}, {
      get(_, prop: string) {
        return async (...args: any[]) => {
          console.log(`[DRY-RUN] users.${prop} called with`, args.map(a => (typeof a === 'object' ? JSON.stringify(a).slice(0, 200) : a)));
          if (prop === 'list') return { total: 0, users: [] };
          if (prop === 'create') return { $id: `dry-user-${ID.unique()}`, email: args[1] || 'dry@example.com' };
          return {};
        };
      }
    });
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimitOrTransient(e: any) {
  const code = e?.code;
  const type = e?.type || '';
  return code === 429 || code === 503 || code === 500 || /rate|limit|too_many/i.test(String(type || e?.message || ''));
}

async function withRetry<T>(action: () => Promise<T>, label: string, maxRetries = 3, baseDelay = 250): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  while (attempt < maxRetries) {
    try {
      return await action();
    } catch (e: any) {
      lastErr = e;
      if (isRateLimitOrTransient(e)) {
        const wait = baseDelay * (attempt + 1);
        console.warn(`[retry] ${label} attempt ${attempt + 1}/${maxRetries} due to ${e?.type || e?.code}; waiting ${wait}ms`);
        await delay(wait);
        attempt++;
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

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
  try {
    /* @ts-ignore */ await withRetry(() => db.createStringAttribute(APPWRITE_DATABASE_ID, collectionId, id, size, required, undefined, array), `attr:string ${collectionId}.${id}`, 5, 400);
  } catch (e: any) {
    if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e;
  }
}
async function safeCreateIntegerAttribute(collectionId: string, id: string, required = false, array = false) {
  try {
    /* @ts-ignore */ await withRetry(() => db.createIntegerAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, undefined, undefined, array), `attr:integer ${collectionId}.${id}`, 5, 400);
  } catch (e: any) {
    if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e;
  }
}
async function safeCreateFloatAttribute(collectionId: string, id: string, required = false, array = false) {
  try {
    /* @ts-ignore */ await withRetry(() => db.createFloatAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, undefined, undefined, array), `attr:float ${collectionId}.${id}`, 5, 400);
  } catch (e: any) {
    if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e;
  }
}
async function safeCreateBooleanAttribute(collectionId: string, id: string, required = false, array = false) {
  try {
    /* @ts-ignore */ await withRetry(() => db.createBooleanAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, array), `attr:boolean ${collectionId}.${id}`, 5, 400);
  } catch (e: any) {
    if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e;
  }
}
async function safeCreateDatetimeAttribute(collectionId: string, id: string, required = false, array = false) {
  try {
    /* @ts-ignore */ await withRetry(() => db.createDatetimeAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, array), `attr:datetime ${collectionId}.${id}`, 5, 400);
  } catch (e: any) {
    if (e.code !== 409 && !isAttrLimitExceeded(e)) throw e;
  }
}
async function safeCreateIndex(collectionId: string, name: string, attributes: string[], orders: ("ASC"|"DESC")[] = []) {
  try {
    /* @ts-ignore */ await withRetry(() => db.createIndex(APPWRITE_DATABASE_ID, collectionId, name, 'key' as any, attributes, orders.length ? orders : attributes.map(()=>'ASC')), `index ${collectionId}.${name}`, 5, 400);
  } catch (e: any) {
    if (e.code !== 409) throw e;
  }
}

async function ensureCollection(id: string, name: string, perms: any[] = [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())]) {
  try {
    await withRetry(() => db.getCollection(APPWRITE_DATABASE_ID, id), `getCollection ${id}`, 4, 300);
  } catch (e: any) {
    if (e.code === 404) {
  await withRetry(() => db.createCollection(APPWRITE_DATABASE_ID, id, name, perms), `createCollection ${id}`, 5, 400);
      // Wait a moment for the collection to be ready for attributes
      await delay(500);
    } else if (e.code !== 401) {
      throw e;
    }
  }
}

async function ensureAllCollections() {
  // Delete and recreate examAttempts collection to split attributes (optional)
  if (process.env.RECREATE_EXAM_ATTEMPTS === 'true') {
    console.log('Recreating examAttempts collection with split attributes...');
    try {
      await databases.deleteCollection(APPWRITE_DATABASE_ID!, 'examAttempts');
      console.log('Deleted old examAttempts collection');
      await delay(1000); // Wait for deletion to complete
    } catch (e: any) {
      console.log('examAttempts collection did not exist or could not be deleted:', e?.message || e);
    }
  }
  // Exams - SKIPPED: Never alter or touch exams collection
  // await ensureCollection('exams', 'Exams');
  // await safeCreateStringAttribute('exams', 'title', 255, true);
  // await safeCreateStringAttribute('exams', 'type', 50, true);
  // await safeCreateStringAttribute('exams', 'subject', 255, true);
  // await safeCreateStringAttribute('exams', 'year', 10, true);
  // await safeCreateStringAttribute('exams', 'paper_type', 50, false);
  // await safeCreateStringAttribute('exams', 'mode', 50, false); // 'practice' | 'exam'
  // await safeCreateStringAttribute('exams', 'search', 512, false);
  // await safeCreateDatetimeAttribute('exams', 'createdAt', false);
  // await safeCreateBooleanAttribute('exams', 'isActive', false);
  // await delay(500);
  // await safeCreateIndex('exams', 'idx_title', ['title']);
  // await safeCreateIndex('exams', 'idx_type_subject_year', ['type','subject','year']);

  // Questions - SKIPPED: Never alter or touch questions collection
  // await ensureCollection('questions', 'Questions');
  // await safeCreateStringAttribute('questions', 'examId', 255, true);
  // await safeCreateIntegerAttribute('questions', 'questionNumber', true);
  // // Reduce string sizes to fit Appwrite Free tier attribute limits
  // await safeCreateStringAttribute('questions', 'questionText', 16384, true);
  //   // Options not required to support theory questions
  //   await safeCreateStringAttribute('questions', 'options', 1024, false, true);
  //   // correctAnswer may be long for theory; allow large size
  //   await safeCreateStringAttribute('questions', 'correctAnswer', 65535, false);
  // await safeCreateStringAttribute('questions', 'explanation', 16384, false);
  // await safeCreateStringAttribute('questions', 'imageUrl', 512, false);
  // await safeCreateStringAttribute('questions', 'answerUrl', 512, false);
  // await safeCreateStringAttribute('questions', 'section', 255, false);
  // await safeCreateStringAttribute('questions', 'instructions', 4096, false);
  // await safeCreateStringAttribute('questions', 'year', 10, false);
  // await safeCreateStringAttribute('questions', 'subject', 255, false);
  // await safeCreateStringAttribute('questions', 'type', 50, false);
  // await safeCreateStringAttribute('questions', 'paper_type', 50, false);
  // await delay(500);
  // await safeCreateIndex('questions', 'idx_exam_qnum', ['examId','questionNumber']);

  // Exam Attempts - CORE (required fields only, under 10-attribute limit)
  await ensureCollection('examAttempts', 'Exam Attempts');
  await safeCreateStringAttribute('examAttempts', 'examId', 255, true);
  await safeCreateStringAttribute('examAttempts', 'studentId', 255, true);
  await safeCreateStringAttribute('examAttempts', 'answers', 8192, true);
  await safeCreateIntegerAttribute('examAttempts', 'score', true);
  await safeCreateIntegerAttribute('examAttempts', 'totalQuestions', true);
  await safeCreateIntegerAttribute('examAttempts', 'correctAnswers', true);
  await safeCreateIntegerAttribute('examAttempts', 'timeSpent', true);
  await safeCreateStringAttribute('examAttempts', 'status', 50, false); // in_progress, completed
  await delay(500);
  await safeCreateIndex('examAttempts', 'idx_student_exam', ['studentId','examId']);

  // Exam Attempt Details - EXTENDED (optional analytics, under 10-attribute limit)
  await ensureCollection('examAttemptDetails', 'Exam Attempt Details');
  await safeCreateStringAttribute('examAttemptDetails', 'attemptId', 255, true); // FK to examAttempts.$id
  await safeCreateStringAttribute('examAttemptDetails', 'completedAt', 255, false);
  await safeCreateStringAttribute('examAttemptDetails', 'subjects', 255, false, true);
  await safeCreateIntegerAttribute('examAttemptDetails', 'timePerQuestion', false);
  await safeCreateDatetimeAttribute('examAttemptDetails', 'startedAt', false);
  await safeCreateDatetimeAttribute('examAttemptDetails', 'submittedAt', false);
  await safeCreateDatetimeAttribute('examAttemptDetails', 'lastSavedAt', false);
  await safeCreateIntegerAttribute('examAttemptDetails', 'percentage', false);
  await safeCreateBooleanAttribute('examAttemptDetails', 'passed', false);
  await delay(500);
  await safeCreateIndex('examAttemptDetails', 'idx_attempt', ['attemptId']);

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
  // Indexes for faster filters
  await safeCreateIndex('payments', 'idx_payment_student', ['studentId']);
  await safeCreateIndex('payments', 'idx_payment_status', ['status']);
  await safeCreateIndex('payments', 'idx_payment_student_status', ['studentId','status']);
  await safeCreateIndex('payments', 'idx_payment_duedate', ['dueDate']);

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

  const MAX_CORRECT = 500;
  const rawCorrect = raw.correctAnswer ?? raw.correct_answer ?? raw.answer ?? '';
  let correct: string = '';
  if (typeof rawCorrect === 'string') {
    // If letter provided (A/B/C/...), map to actual text if options object was lettered
    const letter = rawCorrect.trim().toUpperCase();
    if (optionsObj && typeof optionsObj === 'object' && !Array.isArray(optionsObj) && letter && letter.length <= 2) {
      const mapped = (optionsObj as any)[letter];
      if (mapped) {
        correct = String(mapped);
      } else {
        correct = String(rawCorrect);
      }
    } else {
      correct = String(rawCorrect);
    }
  }
  const isTheory = optionsArray.length === 0;
  // For theory, move long answers into explanation and keep correctAnswer <= 500
  let explanation: string | undefined = raw.explanation ? String(raw.explanation) : undefined;
  if (isTheory) {
    if (!explanation && typeof rawCorrect === 'string' && rawCorrect.trim().length > 0) {
      explanation = String(rawCorrect);
    }
    if (typeof correct === 'string' && correct.length > MAX_CORRECT) {
      correct = correct.slice(0, MAX_CORRECT);
    }
  } else {
    // For objective, still ensure limit safety
    if (typeof correct === 'string' && correct.length > MAX_CORRECT) {
      correct = correct.slice(0, MAX_CORRECT);
    }
  }

  return {
    questionNumber: num,
    questionText: String(raw.text ?? raw.question ?? ''),
    options: optionsArray,
    correctAnswer: correct,
    explanation,
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
      const examDoc: any = await withRetry(() => db.createDocument(APPWRITE_DATABASE_ID, 'exams', ID.unique(), {
        title,
        type,
        subject,
        year,
        paper_type,
        mode: 'exam',
        isActive: true,
        createdAt: new Date().toISOString(),
        search: [title, type, subject, year, paper_type].filter(Boolean).join(' '),
      }), `create exam ${title}`);
      examId = examDoc.$id;
    }

    // Questions array
    const questionsArray: any[] = Array.isArray(raw) ? raw : (raw?.questions ?? []);
    // Skip if this exam already has questions (idempotent fast-path)
    try {
  const existingQs = await db.listDocuments(APPWRITE_DATABASE_ID, 'questions', [Query.equal('examId', examId!), Query.limit(1)]);
      if (existingQs.total > 0) {
        console.log(`${idx + 1}/${files.length} Skip (already seeded): ${title}`);
        continue;
      }
    } catch {}

    console.log(`${idx + 1}/${files.length} Seeding exam: ${title} (${questionsArray.length} questions) with concurrency=${SEED_Q_CONCURRENCY}`);
    let created = 0;
    const mkPayload = (qRaw: any, i: number) => {
      const base: any = { examId, ...mapRawQuestion(qRaw, i), year, subject, type, paper_type };
      // Guard against legacy schema limits (e.g., correctAnswer <= 500 chars)
      if (typeof base.correctAnswer === 'string' && base.correctAnswer.length > 480) {
        base.explanation = (base.explanation ? String(base.explanation) + '\n\n' : '') + base.correctAnswer;
        base.correctAnswer = String(base.correctAnswer).slice(0, 480);
      }
      // Ensure strings for string fields
      if (base.questionText != null) base.questionText = String(base.questionText);
      if (base.explanation != null) base.explanation = String(base.explanation);
      if (base.answerUrl != null) base.answerUrl = String(base.answerUrl);
      if (base.imageUrl != null) base.imageUrl = String(base.imageUrl);
      if (base.section != null) base.section = String(base.section);
      if (base.instructions != null) base.instructions = String(base.instructions);
      return base;
    };
    // Process in chunks to control concurrency
    for (let start = 0; start < questionsArray.length; start += SEED_Q_CONCURRENCY) {
      const slice = questionsArray.slice(start, start + SEED_Q_CONCURRENCY);
      await Promise.all(slice.map(async (qRaw, j) => {
        const idxGlobal = start + j;
        const label = `create question ${title} #${idxGlobal + 1}`;
        let payload = mkPayload(qRaw, idxGlobal);
        try {
          await withRetry(() => db.createDocument(APPWRITE_DATABASE_ID, 'questions', ID.unique(), payload), label);
          created++;
        } catch (e: any) {
          // Fallback: aggressive sanitize and try once more
          try {
            if (typeof payload.correctAnswer === 'string' && payload.correctAnswer.length > 0) {
              payload.explanation = (payload.explanation ? String(payload.explanation) + '\n\n' : '') + payload.correctAnswer;
            }
            payload.correctAnswer = payload.correctAnswer ? String(payload.correctAnswer).slice(0, 300) : '';
            if (Array.isArray(payload.options)) {
              payload.options = payload.options.map((s: any) => String(s).slice(0, 300)).slice(0, 10);
            }
            payload.questionText = String(payload.questionText).slice(0, 16000);
            if (payload.explanation) payload.explanation = String(payload.explanation).slice(0, 16000);
            await withRetry(() => db.createDocument(APPWRITE_DATABASE_ID, 'questions', ID.unique(), payload), label + ' [sanitized]');
            created++;
          } catch (e2: any) {
            console.warn(`[skip] ${label}: ${e2?.type || e2?.code || e2}`);
          }
        }
      }));
      if (SEED_BATCH_PAUSE_MS > 0) await delay(SEED_BATCH_PAUSE_MS);
    }
    console.log(`${idx + 1}/${files.length} Seeded exam: ${title} (${created}/${questionsArray.length})`);
    // Short delay between files to keep average QPS gentle
    await delay(Math.max(60, SEED_BATCH_PAUSE_MS));
  }
}

async function seedBaseData() {
  // Basic school, classes, subjects, sample staff/students
  try {
  const sch = await db.listDocuments(APPWRITE_DATABASE_ID, 'school', [Query.limit(1)]);
    if (sch.total === 0) {
      await db.createDocument(APPWRITE_DATABASE_ID, 'school', ID.unique(), { schoolName: 'Ohman Foundation School', motto: 'Excellence and Integrity', academicYear: String(new Date().getFullYear()) });
    }
  } catch {}
  const classNames = ['JSS 1','JSS 2','JSS 3','SS 1 Science','SS 1 Arts','SS 1 Commercial','SS 2 Science','SS 2 Arts','SS 2 Commercial','SS 3 Science','SS 3 Arts','SS 3 Commercial'];
  let classes: any[] = [];
  try {
  const page = await db.listDocuments(APPWRITE_DATABASE_ID, 'classes', [Query.limit(100)]);
    classes = page.documents;
    if (page.total === 0) {
      for (const name of classNames) {
        const c = await db.createDocument(APPWRITE_DATABASE_ID, 'classes', ID.unique(), { name });
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
        await db.createDocument(APPWRITE_DATABASE_ID, 'subjects', ID.unique(), { name: s });
      }
    }
  } catch {}
  try {
  const t = await db.listDocuments(APPWRITE_DATABASE_ID, 'teachers', [Query.limit(1)]);
    if (t.total === 0) {
      await db.createDocument(APPWRITE_DATABASE_ID, 'teachers', ID.unique(), { employeeId: 'T-001', firstName: 'Ada', lastName: 'Obi', subjects: ['Mathematics'] });
    }
  } catch {}
  try {
  const s = await db.listDocuments(APPWRITE_DATABASE_ID, 'students', [Query.limit(1)]);
    if (s.total === 0 && classes.length > 0) {
      const classId = classes[0].$id;
      for (const st of [{ firstName: 'Chinedu', lastName: 'Okafor' },{ firstName: 'Nkechi', lastName: 'Eze' }]) {
        await db.createDocument(APPWRITE_DATABASE_ID, 'students', ID.unique(), { ...st, classId });
      }
    }
  } catch {}
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  if (!adminEmail || !adminPassword) {
    console.log('Skipping admin user creation: ADMIN_EMAIL and ADMIN_PASSWORD not set');
    return;
  }

  try {
    // Check if admin user already exists
    const existingUsers = await usersProxy.list([Query.equal('email', adminEmail), Query.limit(1)]);
    if (existingUsers.total > 0) {
      console.log('Admin user already exists, skipping creation');
      const userId = existingUsers.users[0].$id;

      // Ensure userProfile exists
      const existingProfile = await db.listDocuments(APPWRITE_DATABASE_ID, 'userProfiles', [Query.equal('userId', userId), Query.limit(1)]);
      if (existingProfile.total === 0) {
        await db.createDocument(APPWRITE_DATABASE_ID, 'userProfiles', ID.unique(), {
          userId,
          role: 'admin',
          subscriptionStatus: 'active',
        });
        console.log('Created userProfile for existing admin user');
      }

      // Ensure user preferences have the correct role
      try {
        await usersProxy.updatePrefs(userId, { role: 'admin' });
        console.log('Updated user preferences with admin role');
      } catch (error: any) {
        console.warn('Could not update user preferences:', error.message);
      }
      return;
    }

    // Create new admin user
    const user = await usersProxy.create(ID.unique(), adminEmail, undefined, adminPassword, adminName);
    console.log('Created admin user:', user.email);

    // Update user preferences with role
    await usersProxy.updatePrefs(user.$id, { role: 'admin' });
    console.log('Updated user preferences with admin role');

    // Create userProfile
    await db.createDocument(APPWRITE_DATABASE_ID, 'userProfiles', ID.unique(), {
      userId: user.$id,
      role: 'admin',
      subscriptionStatus: 'active',
    });
    console.log('Created userProfile for admin user');

  } catch (error: any) {
    console.error('Failed to create admin user:', error.message);
  }
}

async function main() {
  console.log('Ensuring collections and attributes...');
  await ensureAllCollections();
  console.log('Seeding base data...');
  await seedBaseData();
  console.log('Seeding admin user...');
  await seedAdminUser();
  console.log('Seeding past questions...');
  // await seedPastQuestions(); // SKIPPED: Never alter or touch exams/questions collections
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
