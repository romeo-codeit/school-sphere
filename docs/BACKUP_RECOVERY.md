## Backup and Recovery Runbook

This runbook documents how to back up and restore Appwrite data for SchoolSphere. It focuses on Appwrite Database collections, which hold most application state. Storage (files) and Functions are noted separately.

### Scope

- Appwrite Database: full export/import of collections (IDs preserved)
- Appwrite Storage: pointers documented; see notes for large-file handling
- Configuration/Collections schema: expected to exist already in the target environment

### Prerequisites

- Environment variables set in .env:
  - VITE_APPWRITE_ENDPOINT
  - VITE_APPWRITE_PROJECT_ID
  - VITE_APPWRITE_DATABASE_ID
  - APPWRITE_API_KEY (project API key with read/write to all collections)
- Node.js environment with tsx available (installed in this repo)

### One-time Setup (Windows PowerShell)

```powershell
# Ensure dependencies
npm install

# Verify env
echo $env:VITE_APPWRITE_ENDPOINT
echo $env:VITE_APPWRITE_PROJECT_ID
echo $env:VITE_APPWRITE_DATABASE_ID
echo $env:APPWRITE_API_KEY
```

## Backup Procedures

There are two levels: Ad-hoc (manual) and Scheduled (automated).

### A. Manual Backup

Exports all collections to JSON under backups/<timestamp>/database.

```powershell
npm run backup:db
# or using helper script (ensures working directory)
./scripts/windows/run-backup.ps1
```

Artifacts:
- backups/<ISO8601 timestamp>/metadata.json
- backups/<timestamp>/database/<collectionId>.json

### B. Scheduled Backup

Use Windows Task Scheduler on the server:

Option 1 — Scripted:

```powershell
# Creates or updates a daily 02:00 task
./scripts/windows/schedule-backup.ps1 -TaskName "SchoolSphere Nightly Backup" -WorkingDir "C:\Users\romeo\Downloads\dev\SchoolSphere" -Time "02:00"
```

Option 2 — Manual via Task Scheduler:
1) Create a basic task → Trigger: Daily at 02:00
2) Action: Start a program
  - Program/script: powershell.exe
  - Add arguments: -NoProfile -ExecutionPolicy Bypass -File "C:\Users\romeo\Downloads\dev\SchoolSphere\scripts\windows\run-backup.ps1"
3) Ensure the task runs under a user with access to the repo and Node
4) Verify next day that backups/ contains a new timestamped folder

Retention:
- Keep 14 daily backups and 8 weekly backups (manual pruning or a follow-up script)

Offsite Copy (recommended):
- Mirror backups/ to a secure cloud bucket (e.g., S3, Azure Blob) using rclone or vendor tooling

## Recovery Procedures

Use when restoring to a new environment or rolling back data.

### A. Non-destructive Restore (Upsert)

This imports documents, updating if they already exist by $id. Good for partial recovery.

```powershell
# Replace the path with the backup you want
npm run restore:db -- backups/2025-10-15T02-00-03.123Z
```

### B. Wipe-and-Restore (Destructive)

This will delete all documents in target collections first. Only use when you intend to fully replace data.

```powershell
npm run restore:db -- backups/2025-10-15T02-00-03.123Z --wipe
```

### Verification Checklist

After restore completes:
- Review console output for failures
- Spot-check critical collections (students, teachers, classes, exams, attendance)
- Log in to the app and verify dashboards and lists load
- Run health check: http://localhost:5000/health
- Confirm existence of a new folder under `backups/` with timestamp matching the run.
- Inspect `backups/<timestamp>/metadata.json` for collection counts.
- Optionally test a non-destructive restore:

```powershell
npm run restore:db -- backups/<timestamp>
```

## Notes on Appwrite Storage (Files)

If your app uses Appwrite Storage for uploaded files (e.g., resources, images), you need to back up files too. Options:

- Appwrite built-in backups (Enterprise/Cloud features) if available
- API-based export (iterate buckets/files and stream to disk) — can be added as a future script
- Infrastructure-level backups of the Appwrite volume (self-hosted)

For now, this runbook covers database documents. File fields in documents will be restored as-is; however, actual file blobs must exist in Appwrite Storage for links to work.

## Troubleshooting

- Missing env vars → Ensure .env is loaded (npm scripts use tsx which loads dotenv/config in server scripts). For backup/restore we rely on dotenv/config via import.
- 401/403 errors → The API key lacks permissions. Create an API key with appropriate scopes.
- Large datasets → Scripts paginate by 100; adjust if you hit API limits.
- Rate limiting → If using Appwrite Cloud with strict limits, insert small delays between requests or run during off-peak hours.

## Security

- Treat backups/ as sensitive: restrict filesystem permissions.
- If copying offsite, encrypt at rest and in transit.
- Never commit backups/ to Git.

## Runbook Change Log

- 2025-10-15: Initial version with backup/restore scripts and scheduling guidance.
