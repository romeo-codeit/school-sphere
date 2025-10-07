"""
Appwrite Phase 1 Migration (Non-Destructive)

What it does:
- Ensures the following attributes exist (creates if missing; ignores if already exist):
  - exams.assignedTo: string[]
  - exams.mode: string
  - examAttempts.subjects: string[]
  - examAttempts.timePerQuestion: integer
- Backfills defaults for existing documents without overwriting existing values:
  - exams: assignedTo = [] (if missing), mode = 'exam' (if missing)
  - examAttempts: subjects = [] (if missing), timePerQuestion = 0 (if missing)

Safety:
- Never deletes documents or collections
- Skips attribute creation if already present (handles 409 conflict)

Run in Google Colab:
1) !pip install appwrite
2) Set the environment variables below or edit the constants
3) Run this script (copy/paste into a cell) or upload and run with %run

Required API Key scopes (Server key):
- databases.read, collections.read, attributes.write, documents.read, documents.write
"""

import os
import time
from typing import Any, Dict, List

try:
    from appwrite.client import Client
    from appwrite.services.databases import Databases
    from appwrite.exception import AppwriteException
    from appwrite.query import Query
except Exception as e:
    raise SystemExit("Please install the Appwrite SDK first: !pip install appwrite")


# ---- Configuration ----
ENDPOINT = os.environ.get("APPWRITE_ENDPOINT") or os.environ.get("VITE_APPWRITE_ENDPOINT") or ""
PROJECT_ID = os.environ.get("APPWRITE_PROJECT_ID") or os.environ.get("VITE_APPWRITE_PROJECT_ID") or ""
API_KEY = os.environ.get("APPWRITE_API_KEY") or ""
DATABASE_ID = os.environ.get("APPWRITE_DATABASE_ID") or os.environ.get("VITE_APPWRITE_DATABASE_ID") or ""

# Set to False to apply changes. When True, will only print planned actions.
DRY_RUN = False

# Collection IDs (as used in your project)
EXAMS = "exams"
EXAM_ATTEMPTS = "examAttempts"


def get_client() -> Client:
    if not ENDPOINT or not PROJECT_ID or not API_KEY or not DATABASE_ID:
        raise SystemExit(
            "Missing required configuration. Set ENV vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID"
        )
    client = Client()
    client.set_endpoint(ENDPOINT)
    client.set_project(PROJECT_ID)
    client.set_key(API_KEY)
    return client


def safe_create_string_attribute(databases: Databases, collection_id: str, key: str, size: int = 255, required: bool = False, array: bool = False):
    try:
        databases.create_string_attribute(DATABASE_ID, collection_id, key, size, required, None, array)
        print(f"[ok] Created string attribute {collection_id}.{key} (array={array})")
    except AppwriteException as e:
        if e.code == 409:
            print(f"[skip] Attribute {collection_id}.{key} already exists")
        else:
            print(f"[warn] Could not create {collection_id}.{key}: {e}")


def safe_create_integer_attribute(databases: Databases, collection_id: str, key: str, required: bool = False, array: bool = False):
    try:
        # Use named params to avoid passing array into the default position
        databases.create_integer_attribute(
            database_id=DATABASE_ID,
            collection_id=collection_id,
            key=key,
            required=required,
            min=None,
            max=None,
            default=None,
            array=array,
        )
        print(f"[ok] Created integer attribute {collection_id}.{key}")
    except AppwriteException as e:
        if e.code == 409:
            print(f"[skip] Attribute {collection_id}.{key} already exists")
        else:
            print(f"[warn] Could not create {collection_id}.{key}: {e}")


def ensure_attributes(databases: Databases):
    print("Ensuring Phase 1 attributes exist...")
    # Exams
    safe_create_string_attribute(databases, EXAMS, "assignedTo", 255, False, True)
    safe_create_string_attribute(databases, EXAMS, "mode", 50, False, False)
    # ExamAttempts
    safe_create_string_attribute(databases, EXAM_ATTEMPTS, "subjects", 255, False, True)
    safe_create_integer_attribute(databases, EXAM_ATTEMPTS, "timePerQuestion", False, False)


def wait_for_attribute(databases: Databases, collection_id: str, key: str, timeout_sec: int = 60):
    """Wait until a newly created attribute appears in the collection schema (eventual consistency)."""
    start = time.time()
    while time.time() - start < timeout_sec:
        try:
            col = databases.get_collection(DATABASE_ID, collection_id)
            attrs = col.get("attributes", [])
            if any((a.get("key") == key) for a in attrs):
                return True
        except AppwriteException:
            pass
        time.sleep(1)
    print(f"[warn] Attribute {collection_id}.{key} not visible after {timeout_sec}s; updates may fail temporarily.")
    return False


def list_all_documents(databases: Databases, collection_id: str, batch: int = 100) -> List[Dict[str, Any]]:
    docs: List[Dict[str, Any]] = []
    offset = 0
    total = None
    while True:
        res = databases.list_documents(DATABASE_ID, collection_id, [Query.limit(batch), Query.offset(offset)])
        if total is None:
            total = res["total"] if "total" in res else None
        documents = res.get("documents", [])
        docs.extend(documents)
        offset += len(documents)
        if len(documents) == 0 or (total is not None and offset >= total):
            break
        # Optional: short sleep to avoid hitting free-tier rate limits
        time.sleep(0.02)
    return docs


def backfill_exams(databases: Databases):
    print("Backfilling exams defaults (assignedTo=[], mode='exam') where missing...")
    docs = list_all_documents(databases, EXAMS)
    updated = 0
    for d in docs:
        payload: Dict[str, Any] = {}
        if "assignedTo" not in d or d.get("assignedTo") is None:
            payload["assignedTo"] = []
        if "mode" not in d or d.get("mode") is None:
            payload["mode"] = "exam"
        if payload:
            if DRY_RUN:
                print(f"[dry-run] Would update exams/{d['$id']} with {payload}")
            else:
                try:
                    databases.update_document(DATABASE_ID, EXAMS, d["$id"], payload)
                    updated += 1
                except AppwriteException as e:
                    print(f"[warn] Failed to update exams/{d['$id']}: {e}")
    print(f"Exams backfill complete. Updated: {updated}")


def backfill_exam_attempts(databases: Databases):
    print("Backfilling examAttempts defaults (subjects=[], timePerQuestion=0) where missing...")
    docs = list_all_documents(databases, EXAM_ATTEMPTS)
    updated = 0
    for d in docs:
        payload: Dict[str, Any] = {}
        if "subjects" not in d or d.get("subjects") is None:
            payload["subjects"] = []
        if "timePerQuestion" not in d or d.get("timePerQuestion") is None:
            payload["timePerQuestion"] = 0
        if payload:
            if DRY_RUN:
                print(f"[dry-run] Would update examAttempts/{d['$id']} with {payload}")
            else:
                try:
                    databases.update_document(DATABASE_ID, EXAM_ATTEMPTS, d["$id"], payload)
                    updated += 1
                except AppwriteException as e:
                    print(f"[warn] Failed to update examAttempts/{d['$id']}: {e}")
    print(f"ExamAttempts backfill complete. Updated: {updated}")


def main():
    client = get_client()
    databases = Databases(client)
    # Basic connectivity check
    try:
        databases.get(DATABASE_ID)
    except AppwriteException as e:
        raise SystemExit(f"Database connection failed: {e}")

    ensure_attributes(databases)
    # Wait for attributes to become visible before updates
    wait_for_attribute(databases, EXAM_ATTEMPTS, "timePerQuestion", timeout_sec=30)
    backfill_exams(databases)
    backfill_exam_attempts(databases)
    print("\nDone.")


if __name__ == "__main__":
    main()
