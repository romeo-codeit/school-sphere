import { Client, Account, Databases } from 'appwrite';

console.log('Loading Appwrite configuration...');
console.log('VITE_APPWRITE_ENDPOINT:', import.meta.env.VITE_APPWRITE_ENDPOINT);
console.log('VITE_APPWRITE_PROJECT_ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
console.log('VITE_APPWRITE_DATABASE_ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID);

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID) {
  throw new Error("Missing Appwrite environment variables. Please check your .env file and ensure the dev server is restarted.");
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

export default client;
