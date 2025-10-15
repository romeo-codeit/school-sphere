import "dotenv/config";
import { Client, Databases, ID } from "node-appwrite";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Appwrite Database Restore Script
 * - Imports documents from a backup folder created by backup-appwrite.ts
 * - Default behavior is upsert (create if not exists, update if exists by $id)
 * - Use --wipe to delete all documents in target collections before import
 *
 * Usage:
 *   tsx scripts/restore-appwrite.ts backups/<timestamp>
 *   tsx scripts/restore-appwrite.ts backups/<timestamp> --wipe
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

async function rimraf(dir: string) {
  try { await fs.rm(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

async function listAllDocuments(databaseId: string, collectionId: string) {
  const docs: any[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await databases.listDocuments(databaseId, collectionId, [
      // @ts-ignore
      { key: 'limit', value: limit },
      { key: 'offset', value: offset },
    ] as any);
    const arr = (res as any).documents || [];
    docs.push(...arr);
    if (arr.length < limit) break;
    offset += arr.length;
  }
  return docs;
}

async function deleteAllDocuments(databaseId: string, collectionId: string) {
  const docs = await listAllDocuments(databaseId, collectionId);
  for (const d of docs) {
    try {
      await databases.deleteDocument(databaseId, collectionId, String(d.$id));
    } catch (e) {
      console.warn("Delete failed for", collectionId, d.$id, e);
    }
  }
}

async function main() {
  const inputDir = process.argv[2];
  const wipe = process.argv.includes("--wipe");
  if (!inputDir) {
    console.error("Usage: tsx scripts/restore-appwrite.ts backups/<timestamp> [--wipe]");
    process.exit(1);
  }

  const baseDir = path.isAbsolute(inputDir) ? inputDir : path.join(process.cwd(), inputDir);
  const dbDir = path.join(baseDir, "database");

  const entries = await fs.readdir(dbDir);
  const files = entries.filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error("No collection json files found in", dbDir);
    process.exit(1);
  }

  for (const file of files) {
    const full = path.join(dbDir, file);
    const { collectionId, documents } = JSON.parse(await fs.readFile(full, "utf8"));
    console.log(`Restoring collection: ${collectionId} (${documents.length} docs)${wipe ? " [wipe]" : ""}`);

    if (wipe) {
      await deleteAllDocuments(APPWRITE_DATABASE_ID!, collectionId);
    }

    for (const doc of documents) {
      const id = String(doc.$id || ID.unique());
      const { $createdAt, $updatedAt, $databaseId, $collectionId, $permissions, ...data } = doc;
      try {
        // try create first
        await databases.createDocument(APPWRITE_DATABASE_ID!, collectionId, id, data, $permissions);
      } catch (e: any) {
        const message = String(e?.message || "");
        if (message.includes("already exists") || e?.code === 409) {
          // upsert -> update existing
          await databases.updateDocument(APPWRITE_DATABASE_ID!, collectionId, id, data, $permissions);
        } else {
          console.warn("Create/Update failed for", collectionId, id, message);
        }
      }
    }
  }

  console.log("Restore completed from:", baseDir);
}

main().catch((err) => {
  console.error("Restore failed:", err);
  process.exit(1);
});
