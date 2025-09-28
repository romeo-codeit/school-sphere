import { Client, Users, ID, Databases, Permission, Role, Query } from 'node-appwrite';
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
      { id: 'extra', type: 'string', size: 2048, required: false }, // JSON for any extra fields
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
      { id: 'address', type: 'string', size: 1024, required: false },
      { id: 'parentName', type: 'string', size: 255, required: false },
      { id: 'parentPhone', type: 'string', size: 255, required: false },
      { id: 'parentEmail', type: 'string', size: 255, required: false },
      { id: 'classId', type: 'string', size: 255, required: false },
      { id: 'enrollmentDate', type: 'string', size: 255, required: false },
      { id: 'status', type: 'string', size: 50, required: false },
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
        { id: 'classIds', type: 'string', size: 255, required: false, array: true },
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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedDemoData() {
    console.log('Seeding demo data...');

    // Get user IDs
    const studentUserList = await users.list({ search: 'student@example.com' });
    const teacherUserList = await users.list({ search: 'teacher@example.com' });
    const adminUserList = await users.list({ search: 'admin@example.com' });

    if (studentUserList.total === 0 || teacherUserList.total === 0 || adminUserList.total === 0) {
        console.error("Could not find demo users. Aborting data seeding.");
        return;
    }
    const studentUserId = studentUserList.users[0].$id;
    const teacherUserId = teacherUserList.users[0].$id;
    const adminUserId = adminUserList.users[0].$id;

    // Seed classes
    const classesCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'classes');
    if (classesCollection.total === 0) {
        console.log('Seeding classes...');
        const classData = [
            { name: 'SS1 Science', teacherId: teacherUserId },
            { name: 'SS2 Arts', teacherId: teacherUserId },
        ];
        for (const c of classData) {
            await databases.createDocument(APPWRITE_DATABASE_ID, 'classes', ID.unique(), c);
            await delay(100);
        }
        console.log('Classes seeded.');
    }
    const seededClasses = await databases.listDocuments(APPWRITE_DATABASE_ID, 'classes');
    const class1Id = seededClasses.documents[0].$id;
    const class2Id = seededClasses.documents[1].$id;

    // Seed students
    const studentsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'students');
    if (studentsCollection.total === 0) {
        console.log('Seeding students...');
        const studentData = [
            { userId: studentUserId, studentId: 'S001', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', classId: class1Id, status: 'active' },
            { userId: ID.unique(), studentId: 'S002', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', classId: class1Id, status: 'active' },
            { userId: ID.unique(), studentId: 'S003', firstName: 'Peter', lastName: 'Jones', email: 'peter.jones@example.com', classId: class1Id, status: 'active' },
            { userId: ID.unique(), studentId: 'S004', firstName: 'Mary', lastName: 'Williams', email: 'mary.williams@example.com', classId: class2Id, status: 'active' },
            { userId: ID.unique(), studentId: 'S005', firstName: 'David', lastName: 'Brown', email: 'david.brown@example.com', classId: class2Id, status: 'active' },
        ];
        for (const student of studentData) {
            await databases.createDocument(APPWRITE_DATABASE_ID, 'students', ID.unique(), student);
            await delay(100);
        }
        console.log('Students seeded.');
    }

    // Seed teachers
    const teachersCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'teachers');
    if (teachersCollection.total === 0) {
        console.log('Seeding teachers...');
        const teacherData = [
            { userId: teacherUserId, employeeId: 'T001', firstName: 'Peter', lastName: 'Jones', email: 'peter.jones@example.com', subjects: ['Mathematics', 'Physics'], status: 'active', classIds: [class1Id, class2Id] },
            { userId: ID.unique(), employeeId: 'T002', firstName: 'Mary', lastName: 'Williams', email: 'mary.williams@example.com', subjects: ['English', 'History'], status: 'active', classIds: [] },
            { userId: ID.unique(), employeeId: 'T003', firstName: 'David', lastName: 'Brown', email: 'david.brown@example.com', subjects: ['Biology', 'Chemistry'], status: 'active', classIds: [] },
        ];
        for (const teacher of teacherData) {
            await databases.createDocument(APPWRITE_DATABASE_ID, 'teachers', ID.unique(), teacher);
            await delay(100);
        }
        console.log('Teachers seeded.');
    }

    // Seed exams
    const examsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'exams');
    if (examsCollection.total === 0) {
        console.log('Seeding exams...');
        const examData = [
            { title: 'JAMB Practice Test', type: 'jamb', subject: 'Mathematics', questions: JSON.stringify([{ "question": "What is 2+2?", "options": ["3", "4", "5"], "answer": "4" }]), duration: 60, createdBy: teacherUserId, isActive: true },
            { title: 'WAEC Practice Test', type: 'waec', subject: 'English', questions: JSON.stringify([{ "question": "What is a noun?", "options": ["Person, place, or thing", "An action word", "A describing word"], "answer": "Person, place, or thing" }]), duration: 60, createdBy: teacherUserId, isActive: true },
            { title: 'NECO Practice Test', type: 'neco', subject: 'Biology', questions: JSON.stringify([{ "question": "What is photosynthesis?", "options": ["The process of making food in plants", "The process of respiration", "The process of digestion"], "answer": "The process of making food in plants" }]), duration: 60, createdBy: teacherUserId, isActive: true },
            { title: 'Internal Physics Test', type: 'internal', subject: 'Physics', questions: JSON.stringify([{ "question": "What is the formula for force?", "options": ["m*a", "m/a", "m+a"], "answer": "m*a" }]), duration: 30, createdBy: teacherUserId, isActive: true },
            { title: 'Internal Chemistry Test', type: 'internal', subject: 'Chemistry', questions: JSON.stringify([{ "question": "What is the chemical symbol for water?", "options": ["H2O", "CO2", "O2"], "answer": "H2O" }]), duration: 30, createdBy: teacherUserId, isActive: true },
        ];
        for (const exam of examData) {
            await databases.createDocument(APPWRITE_DATABASE_ID, 'exams', ID.unique(), exam);
            await delay(100);
        }
        console.log('Exams seeded.');
    }

    const seededStudents = await databases.listDocuments(APPWRITE_DATABASE_ID, 'students');
    const seededExams = await databases.listDocuments(APPWRITE_DATABASE_ID, 'exams');
    const seededTeachers = await databases.listDocuments(APPWRITE_DATABASE_ID, 'teachers');

    // Seed exam attempts
    const examAttemptsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'examAttempts');
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
                await databases.createDocument(APPWRITE_DATABASE_ID, 'examAttempts', ID.unique(), attempt);
                await delay(100);
            }
        }
        console.log('Exam attempts seeded.');
    }

    // Seed payments
    const paymentsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'payments');
    if (paymentsCollection.total === 0 && seededStudents.total > 0) {
        console.log('Seeding payments...');
        for (const student of seededStudents.documents) {
            const paymentData = { studentId: student.$id, amount: 50000.00, purpose: 'School Fees', status: 'pending' };
            await databases.createDocument(APPWRITE_DATABASE_ID, 'payments', ID.unique(), paymentData);
            await delay(100);
        }
        console.log('Payments seeded.');
    }

  // Seed attendance records (normalized)
  const attendanceRecordsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'attendanceRecords');
  if (attendanceRecordsCollection.total === 0 && seededClasses.total > 0) {
    console.log('Seeding attendance records...');
    for (const aClass of seededClasses.documents) {
      const classStudents = await databases.listDocuments(APPWRITE_DATABASE_ID, 'students', [
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
          await databases.createDocument(APPWRITE_DATABASE_ID, 'attendanceRecords', ID.unique(), attendanceRecord);
          await delay(20);
        }
      }
    }
    console.log('Attendance records seeded.');
  }

    // Seed messages
    const messagesCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'messages');
    if (messagesCollection.total === 0 && seededStudents.total > 0 && seededTeachers.total > 0) {
        console.log('Seeding messages...');
        const studentId = seededStudents.documents[0].$id;
        const teacherId = seededTeachers.documents[0].$id;
        const messageData = [
            { senderId: teacherId, recipientId: studentId, subject: 'Welcome', content: 'Welcome to the new school year!', isRead: false, messageType: 'notification' },
            { senderId: studentId, recipientId: teacherId, subject: 'Re: Welcome', content: 'Thank you!', isRead: false, messageType: 'personal' },
        ];
        for (const message of messageData) {
            await databases.createDocument(APPWRITE_DATABASE_ID, 'messages', ID.unique(), message);
            await delay(100);
        }
        console.log('Messages seeded.');
    }

    // Seed resources
    const resourcesCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'resources');
    if (resourcesCollection.total === 0 && seededTeachers.total > 0) {
        console.log('Seeding resources...');
        const teacherId = seededTeachers.documents[0].$id;
        const resourceData = [
            { title: 'Mathematics Textbook', description: 'JSS 1 Mathematics Textbook', type: 'pdf', subject: 'Mathematics', class: 'JSS 1A', uploadedBy: teacherId, isPublic: true },
            { title: 'English Language Video', description: 'A video on nouns', type: 'video', subject: 'English', class: 'JSS 1', uploadedBy: teacherId, isPublic: true },
        ];
        for (const resource of resourceData) {
            await databases.createDocument(APPWRITE_DATABASE_ID, 'resources', ID.unique(), resource);
            await delay(100);
        }
        console.log('Resources seeded.');
    }

    // Seed grades
    const gradesCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'grades');
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
                await databases.createDocument(APPWRITE_DATABASE_ID, 'grades', ID.unique(), gradeData);
                await delay(100);
            }
        }
        console.log('Grades seeded.');
    }

  // Seed subjects
  const subjectsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'subjects');
  if (subjectsCollection.total === 0) {
    console.log('Seeding subjects...');
    const subjectData = [
      { name: 'Mathematics', description: 'Mathematics for all classes' },
      { name: 'English', description: 'English Language' },
      { name: 'Biology', description: 'Biology for science students' },
      { name: 'Chemistry', description: 'Chemistry for science students' },
      { name: 'Physics', description: 'Physics for science students' },
      { name: 'History', description: 'History for arts students' },
    ];
    for (const subject of subjectData) {
      await databases.createDocument(APPWRITE_DATABASE_ID, 'subjects', ID.unique(), subject);
      await delay(100);
    }
    console.log('Subjects seeded.');
  }

    // Seed video meetings
    const videoMeetingsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'videoMeetings');
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
        await databases.createDocument(APPWRITE_DATABASE_ID, 'videoMeetings', ID.unique(), meetingData);
        console.log('Video meetings seeded.');
    }

    // Seed chat messages
    const chatMessagesCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'chatMessages');
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
            await databases.createDocument(APPWRITE_DATABASE_ID, 'chatMessages', ID.unique(), chat);
            await delay(100);
        }
        console.log('Chat messages seeded.');
    }

    // Seed forum threads
    const forumThreadsCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'forumThreads');
    if (forumThreadsCollection.total === 0 && seededStudents.total > 0 && seededTeachers.total > 0) {
        console.log('Seeding forum threads...');
        const studentId = seededStudents.documents[0].$id;
        const teacherId = seededTeachers.documents[0].$id;
        const threadData = {
            title: 'Doubts about Photosynthesis',
            content: 'Can someone explain the process of photosynthesis again?',
            createdBy: studentId,
        };
        const parentThread = await databases.createDocument(APPWRITE_DATABASE_ID, 'forumThreads', ID.unique(), threadData);
        await delay(100);
        const replyData = {
            content: 'Sure, I can help with that. Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight into chemical energy.',
            createdBy: teacherId,
            parentThreadId: parentThread.$id,
        };
        await databases.createDocument(APPWRITE_DATABASE_ID, 'forumThreads', ID.unique(), replyData);
        console.log('Forum threads seeded.');
    }

    // Seed activities
    const activitiesCollection = await databases.listDocuments(APPWRITE_DATABASE_ID, 'activities');
    if (activitiesCollection.total === 0) {
        console.log('Seeding activities...');
        const activityData = [
            { activity: "New student registration completed", date: new Date().toISOString(), type: 'new_student' },
            { activity: "Payment received from student", date: new Date(Date.now() - 15 * 60 * 1000).toISOString(), type: 'payment_received' },
            { activity: "New JAMB questions uploaded", date: new Date(Date.now() - 60 * 60 * 1000).toISOString(), type: 'exam_uploaded' },
            { activity: "Payment overdue alert for 3 students", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'payment_overdue' },
        ];
        for (const activity of activityData) {
            await databases.createDocument(APPWRITE_DATABASE_ID, 'activities', ID.unique(), activity);
            await delay(100);
        }
        console.log('Activities seeded.');
    }

    console.log('Demo data seeding complete.');
}

async function main() {
  await createDatabaseIfNotExists();
  await seedCollections();
  await seedDemoUsers();
  await seedDemoData();
}

main();