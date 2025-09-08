import { Client, Users, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  throw new Error("Missing Appwrite environment variables. Please check your .env file.");
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const users = new Users(client);

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
      // Check if user already exists
      const existingUsers = await users.list({
        search: userData.email,
      });

      if (existingUsers.total > 0) {
        console.log(`User with email ${userData.email} already exists. Skipping.`);
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

      console.log(`Successfully created ${userData.role} user: ${userData.email}`);
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }

  console.log('Demo user seeding complete.');
}

seedDemoUsers();
