import { Client, Users, ID, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const APPWRITE_DATABASE_NAME = "EduManageDB";

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
      { id: 'address', type: 'string', size: 1024, required: false },
      { id: 'parentName', type: 'string', size: 255, required: false },
      { id: 'parentPhone', type: 'string', size: 255, required: false },
      { id: 'parentEmail', type: 'string', size: 255, required: false },
      { id: 'class', type: 'string', size: 255, required: true },
      { id: 'enrollmentDate', type: 'string', size: 255, required: false },
      { id: 'status', type: 'string', size: 50, required: false },
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
    ]
  },
  {
    id: 'exams',
    name: 'Exams',
    attributes: [
        { id: 'title', type: 'string', size: 255, required: true },
        { id: 'type', type: 'string', size: 50, required: true },
        { id: 'subject', type: 'string', size: 255, required: true },
        { id: 'questions', type: 'string', size: 1024, required: true },
        { id: 'duration', type: 'integer', required: false },
        { id: 'totalMarks', type: 'integer', required: false },
        { id: 'passingMarks', type: 'integer', required: false },
        { id: 'createdBy', type: 'string', size: 255, required: false },
        { id: 'isActive', type: 'boolean', required: false },
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
        { id: 'studentId', type: 'string', size: 255, required: false },
        { id: 'date', type: 'string', size: 255, required: true },
        { id: 'status', type: 'string', size: 50, required: true },
        { id: 'remarks', type: 'string', size: 1024, required: false },
        { id: 'markedBy', type: 'string', size: 255, required: false },
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
];

async function createDatabaseIfNotExists() {
  try {
    await databases.get(APPWRITE_DATABASE_ID!!);
  } catch (error: any) {
    if (error.code === 404) {
      try {
        await databases.create(APPWRITE_DATABASE_ID!, APPWRITE_DATABASE_NAME);
        console.log(`Database '${APPWRITE_DATABASE_NAME}' created.`);
      } catch (creationError) {
        console.error("Error creating database:", creationError);
        throw creationError;
      }
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
    } catch (error) {
      console.log(`Creating collection '${collection.name}'...`);
      await databases.createCollection(APPWRITE_DATABASE_ID!, collection.id, collection.name, [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]);
      console.log(`Collection '${collection.name}' created.`);
    }

    for (const attr of collection.attributes) {
      try {
        switch (attr.type) {
          case 'string':
            await databases.createStringAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.size || 255, attr.required, undefined, attr.array);
            break;
          case 'integer':
            // @ts-ignore
            await databases.createIntegerAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.required, undefined, undefined, attr.array);
            break;
          case 'float':
            // @ts-ignore
            await databases.createFloatAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.required, undefined, undefined, attr.array);
            break;
          case 'boolean':
            await databases.createBooleanAttribute(APPWRITE_DATABASE_ID!, collection.id, attr.id, attr.required, undefined, attr.array);
            break;
        }
      } catch (error: any) {
        if (error.code !== 409) {
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

    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }

  console.log('Demo user seeding complete.');
}

async function seedDemoData() {
  console.log('Seeding demo data...');

  // Get user IDs
  const studentUserList = await users.list({ search: 'student@example.com' });
  const teacherUserList = await users.list({ search: 'teacher@example.com' });

  if (studentUserList.total === 0 || teacherUserList.total === 0) {
    console.error("Could not find demo users. Aborting data seeding.");
    return;
  }
  const studentUserId = studentUserList.users[0].$id;
  const teacherUserId = teacherUserList.users[0].$id;

  let studentId = '';

  // Create a student record
  try {
    const studentData = {
      userId: studentUserId,
      studentId: 'S001',
      firstName: 'Student',
      lastName: 'User',
      email: 'student@example.com',
      class: 'JSS 1A',
      status: 'active',
    };
    const studentDoc = await databases.createDocument(APPWRITE_DATABASE_ID!, 'students', ID.unique(), studentData);
    studentId = studentDoc.$id;
    console.log('Student record created.');
  } catch (error: any) {
    if (error.code !== 409) console.error('Error creating student record:', error);
  }

  // Create a teacher record
  try {
    const teacherData = {
        userId: teacherUserId,
        employeeId: 'T001',
        firstName: 'Teacher',
        lastName: 'User',
        email: 'teacher@example.com',
        subjects: ['Mathematics', 'Physics'],
        status: 'active',
    };
    await databases.createDocument(APPWRITE_DATABASE_ID!, 'teachers', ID.unique(), teacherData);
    console.log('Teacher record created.');
  } catch (error: any) {
    if (error.code !== 409) console.error('Error creating teacher record:', error);
  }

  // Create an exam
  try {
    const examData = {
        title: 'JAMB Practice Test',
        type: 'jamb',
        subject: 'Mathematics',
        questions: JSON.stringify([{ "question": "What is 2+2?", "options": ["3", "4", "5"], "answer": "4" }]),
        duration: 60,
        createdBy: teacherUserId,
        isActive: true,
    };
    await databases.createDocument(APPWRITE_DATABASE_ID!, 'exams', ID.unique(), examData);
    console.log('JAMB exam record created.');

    const waecExamData = {
        title: 'WAEC Practice Test',
        type: 'waec',
        subject: 'English',
        questions: JSON.stringify([{ "question": "What is a noun?", "options": ["Person, place, or thing", "An action word", "A describing word"], "answer": "Person, place, or thing" }]),
        duration: 60,
        createdBy: teacherUserId,
        isActive: true,
    };
    await databases.createDocument(APPWRITE_DATABASE_ID!, 'exams', ID.unique(), waecExamData);
    console.log('WAEC exam record created.');

    const necoExamData = {
        title: 'NECO Practice Test',
        type: 'neco',
        subject: 'Biology',
        questions: JSON.stringify([{ "question": "What is photosynthesis?", "options": ["The process of making food in plants", "The process of respiration", "The process of digestion"], "answer": "The process of making food in plants" }]),
        duration: 60,
        createdBy: teacherUserId,
        isActive: true,
    };
    await databases.createDocument(APPWRITE_DATABASE_ID!, 'exams', ID.unique(), necoExamData);
    console.log('NECO exam record created.');

  } catch (error: any) {
    if (error.code !== 409) console.error('Error creating exam record:', error);
  }

  // Create a payment record
  if (studentId) {
      try {
        const paymentData = {
            studentId: studentId,
            amount: 50000.00,
            purpose: 'School Fees',
            status: 'pending',
        };
        await databases.createDocument(APPWRITE_DATABASE_ID!, 'payments', ID.unique(), paymentData);
        console.log('Payment record created.');
      } catch (error: any) {
        if (error.code !== 409) console.error('Error creating payment record:', error);
      }
  }

  // Create an attendance record
  if (studentId) {
      try {
        const attendanceData = {
            studentId: studentId,
            date: new Date().toISOString(),
            status: 'present',
            markedBy: teacherUserId,
        };
        await databases.createDocument(APPWRITE_DATABASE_ID!, 'attendance', ID.unique(), attendanceData);
        console.log('Attendance record created.');
      } catch (error: any) {
        if (error.code !== 409) console.error('Error creating attendance record:', error);
      }
  }
}

async function main() {
  await createDatabaseIfNotExists();
  await seedCollections();
  await seedDemoUsers();
  await seedDemoData();
}

main();