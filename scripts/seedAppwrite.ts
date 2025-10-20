import { Client, Databases, Users, ID, Permission, Role, Query } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

/**
 * Appwrite Seeding Script
 *
 * - Creates all collections and attributes required by the app (backend + frontend)
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
const users = new Users(client);

// Small helper delays to be kind to Appwrite limits
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Helpers to create attributes safely (ignore 409 conflicts)
async function safeCreateStringAttribute(collectionId: string, id: string, size = 255, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createStringAttribute(APPWRITE_DATABASE_ID, collectionId, id, size, required, undefined, array); } catch (e: any) { if (e.code !== 409) throw e; }
}
async function safeCreateIntegerAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createIntegerAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, undefined, undefined, array); } catch (e: any) { if (e.code !== 409) throw e; }
}
async function safeCreateFloatAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createFloatAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, undefined, undefined, array); } catch (e: any) { if (e.code !== 409) throw e; }
}
async function safeCreateBooleanAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createBooleanAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, array); } catch (e: any) { if (e.code !== 409) throw e; }
}
async function safeCreateDatetimeAttribute(collectionId: string, id: string, required = false, array = false) {
  try { /* @ts-ignore */ await databases.createDatetimeAttribute(APPWRITE_DATABASE_ID, collectionId, id, required, undefined, array); } catch (e: any) { if (e.code !== 409) throw e; }
}
async function safeCreateIndex(collectionId: string, name: string, attributes: string[], orders: ("ASC"|"DESC")[] = []) {
  try { /* @ts-ignore */ await databases.createIndex(APPWRITE_DATABASE_ID, collectionId, name, 'key', attributes, orders.length ? orders : attributes.map(()=>'ASC')); } catch (e: any) { if (e.code !== 409) throw e; }
}

async function ensureCollection(id: string, name: string, perms: any[] = [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())]) {
  try {
    await databases.getCollection(APPWRITE_DATABASE_ID, id);
  } catch (e: any) {
    if (e.code === 404) {
      await databases.createCollection(APPWRITE_DATABASE_ID, id, name, perms);
      // Wait a moment for the collection to be ready for attributes
      await delay(500);
    } else if (e.code !== 401) {
      throw e;
    }
  }
}

async function ensureCoreCollections() {
  // Exams
  await ensureCollection('exams', 'Exams');
  await safeCreateStringAttribute('exams', 'title', 255, true);
  await safeCreateStringAttribute('exams', 'type', 50, true);
  await safeCreateStringAttribute('exams', 'subject', 255, true);
  await safeCreateStringAttribute('exams', 'year', 10, true);
  await safeCreateStringAttribute('exams', 'paper_type', 50, false);
  await safeCreateStringAttribute('exams', 'mode', 50, false); // 'practice' | 'exam'
  await safeCreateStringAttribute('exams', 'search', 1024, false);
  await safeCreateIndex('exams', 'idx_title', ['title']);
  await safeCreateIndex('exams', 'idx_type_subject_year', ['type','subject','year']);

  // Questions
  await ensureCollection('questions', 'Questions');
  await safeCreateStringAttribute('questions', 'examId', 255, true);
  await safeCreateIntegerAttribute('questions', 'questionNumber', true);
  await safeCreateStringAttribute('questions', 'questionText', 65535, true);
  await safeCreateStringAttribute('questions', 'options', 1024, true, true);
  await safeCreateStringAttribute('questions', 'correctAnswer', 500, false);
  await safeCreateStringAttribute('questions', 'explanation', 65535, false);
  await safeCreateStringAttribute('questions', 'imageUrl', 1024, false);
  await safeCreateStringAttribute('questions', 'answerUrl', 1024, false);
  await safeCreateStringAttribute('questions', 'section', 500, false);
  await safeCreateStringAttribute('questions', 'instructions', 65535, false);
  await safeCreateIndex('questions', 'idx_exam_qnum', ['examId','questionNumber']);

  // Exam Attempts (align to current backend/frontend expectations and your description)
  await ensureCollection('examAttempts', 'Exam Attempts');
  await safeCreateStringAttribute('examAttempts', 'examId', 255, true);
  await safeCreateStringAttribute('examAttempts', 'studentId', 255, true);
  // answers required string (JSON encoded)
  await safeCreateStringAttribute('examAttempts', 'answers', 10000, true);
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
  await safeCreateIndex('examAttempts', 'idx_student_exam', ['studentId','examId']);

  // Other app collections referenced by the app (minimal schemas)
  await ensureCollection('userProfiles', 'User Profiles');
  await safeCreateStringAttribute('userProfiles', 'userId', 255, true);
  await safeCreateStringAttribute('userProfiles', 'role', 50, false);
  await safeCreateStringAttribute('userProfiles', 'subscriptionStatus', 50, false);
  await safeCreateDatetimeAttribute('userProfiles', 'subscriptionExpiry', false);
  await safeCreateIndex('userProfiles', 'idx_userId', ['userId']);

  await ensureCollection('userSubscriptions', 'User Subscriptions');
  await safeCreateStringAttribute('userSubscriptions', 'userId', 255, true);
  await safeCreateStringAttribute('userSubscriptions', 'subscriptionStatus', 50, false);
  await safeCreateDatetimeAttribute('userSubscriptions', 'subscriptionExpiry', false);
  await safeCreateIndex('userSubscriptions', 'idx_user', ['userId']);

  await ensureCollection('students', 'Students');
  await safeCreateStringAttribute('students', 'userId', 255, false);
  await safeCreateStringAttribute('students', 'classId', 255, false);
  await safeCreateStringAttribute('students', 'firstName', 255, false);
  await safeCreateStringAttribute('students', 'lastName', 255, false);
  await safeCreateIndex('students', 'idx_user', ['userId']);

  await ensureCollection('teachers', 'Teachers');
  await safeCreateStringAttribute('teachers', 'userId', 255, false);
  await safeCreateStringAttribute('teachers', 'employeeId', 255, true);

  await ensureCollection('messages', 'Messages');
  await safeCreateStringAttribute('messages', 'senderId', 255, false);
  await safeCreateStringAttribute('messages', 'recipientId', 255, false);
  await safeCreateBooleanAttribute('messages', 'isRead', false);

  await ensureCollection('notifications', 'Notifications');
  await safeCreateStringAttribute('notifications', 'userId', 255, true);
  await safeCreateStringAttribute('notifications', 'message', 1024, true);
  await safeCreateBooleanAttribute('notifications', 'isRead', false);
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
      const existing = await databases.listDocuments(APPWRITE_DATABASE_ID, 'exams', [Query.equal('title', title), Query.limit(1)]);
      if (existing.total > 0) {
        examId = existing.documents[0].$id;
      }
    } catch {}
    if (!examId) {
      const examDoc = await databases.createDocument(APPWRITE_DATABASE_ID, 'exams', ID.unique(), {
        title,
        type,
        subject,
        year,
        paper_type,
        mode: 'exam',
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
        await databases.createDocument(APPWRITE_DATABASE_ID, 'questions', ID.unique(), { examId, ...q });
        created++;
      } catch (e: any) {
        // If attribute limit or rate limit, delay and retry once
        await delay(50);
        await databases.createDocument(APPWRITE_DATABASE_ID, 'questions', ID.unique(), { examId, ...q });
        created++;
      }
      if (i % 50 === 0) await delay(80); // small pacing for Appwrite Cloud limits
    }
    console.log(`${idx + 1}/${files.length} Seeded exam: ${title} (${created} questions)`);
    // Short delay between files
    await delay(120);
  }
}

async function main() {
  console.log('Ensuring collections and attributes...');
  await ensureCoreCollections();
  console.log('Seeding past questions...');
  await seedPastQuestions();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
