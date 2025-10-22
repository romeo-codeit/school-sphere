import "dotenv/config";
import { Client, Databases, ID, Models, Query } from "node-appwrite";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Appwrite Database Backup Script
 * - Exports ALL collections in the configured database to JSON files.
 * - Output structure: backups/<ISO8601>/database/<collectionId>.json
 *
 * Required env:
 *  - VITE_APPWRITE_ENDPOINT
 *  - VITE_APPWRITE_PROJECT_ID
 *  - APPWRITE_API_KEY (must have project-wide read access)
 *  - VITE_APPWRITE_DATABASE_ID
 */

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  console.error("Missing required Appwrite env vars. Check VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, VITE_APPWRITE_DATABASE_ID");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function listAllCollections(databaseId: string) {
  const result: Models.Collection[] = [] as any;
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await databases.listCollections(databaseId, [
      Query.limit(limit),
      Query.offset(offset),
    ]);
    const arr = (res as any).collections || [];
    for (const c of arr) result.push(c);
    if (arr.length < limit) break;
    offset += arr.length;
  }
  return result;
}

async function listAllDocuments(databaseId: string, collectionId: string) {
  const docs: any[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await databases.listDocuments(databaseId, collectionId, [
      Query.limit(limit),
      Query.offset(offset),
    ]);
    const arr = (res as any).documents || [];
    docs.push(...arr);
    if (arr.length < limit) break;
    offset += arr.length;
  }
  return docs;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:]/g, "-");
  const baseDir = path.join(process.cwd(), "backups", stamp);
  const dbDir = path.join(baseDir, "database");

  await ensureDir(dbDir);

  console.log("Enumerating collections...");
  const collections = await listAllCollections(APPWRITE_DATABASE_ID!);

  const meta: Record<string, any> = {
    createdAt: new Date().toISOString(),
    endpoint: APPWRITE_ENDPOINT,
    projectId: APPWRITE_PROJECT_ID,
    databaseId: APPWRITE_DATABASE_ID,
    collections: [] as Array<{ id: string; name?: string; count: number }>,
  };

  for (const col of collections) {
    const collectionId = (col as any).$id as string;
    const name = (col as any).name as string | undefined;
    console.log(`Backing up collection: ${collectionId}${name ? ` (${name})` : ''}`);
    const docs = await listAllDocuments(APPWRITE_DATABASE_ID!, collectionId);
    await fs.writeFile(
      path.join(dbDir, `${collectionId}.json`),
      JSON.stringify({ collectionId, name, documents: docs }, null, 2),
      "utf8"
    );
    meta.collections.push({ id: collectionId, name, count: docs.length });
  }

  await fs.writeFile(path.join(baseDir, "metadata.json"), JSON.stringify(meta, null, 2), "utf8");
  console.log(`Backup completed: ${baseDir}`);
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
