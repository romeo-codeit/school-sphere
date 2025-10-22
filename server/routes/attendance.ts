import { Request, Response } from 'express';
import { auth } from '../middleware';
import { logError } from '../logger';
import { Client, Databases, ID, Query } from 'node-appwrite';
import NotificationService from '../services/notificationService';
import { z } from 'zod';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const notificationService = new NotificationService(databases);

const createSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  studentId: z.string().min(1),
  status: z.string().min(1),
});

const updateSchema = z.object({
  classId: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
});

export const registerAttendanceRoutes = (app: any) => {
  // Batch create attendance records for a class (optional broadcast)
  app.post('/api/attendance/batch', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!['admin', 'teacher'].includes(String(role))) {
        return res.status(403).json({ message: 'Only teachers and admins can record attendance' });
      }

      const { classId, date, records, notifyClass } = req.body || {};
      if (!classId || !date || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: 'classId, date and records[] are required' });
      }

      // Validate individual records minimally
      const toCreate = records.map((r: any) => ({
        classId: String(classId),
        date: String(date),
        studentId: String(r.studentId),
        status: String(r.status || 'present'),
      }));

      // Create documents sequentially to avoid Appwrite rate errors
      const created: any[] = [];
      for (const rec of toCreate) {
        const doc = await databases.createDocument(
          APPWRITE_DATABASE_ID!,
          'attendanceRecords',
          ID.unique(),
          rec
        );
        created.push(doc);
      }

      // Optional broadcast to all class members
      if (notifyClass) {
        try {
          // Fetch class students and map to userIds
          const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [
            Query.equal('classId', String(classId)),
            Query.limit(100)
          ]);
          const userIds = students.documents
            .map((s: any) => s.userId)
            .filter(Boolean)
            .map(String);
          if (userIds.length > 0) {
            await notificationService.notifyAttendanceMarked(userIds, String(classId), String(date));
          }
        } catch (e) {
          // Best-effort notifications only
        }
      }

      return res.status(201).json({ count: created.length, records: created });
    } catch (error) {
      logError('Failed to create batch attendance records', error);
      return res.status(500).json({ message: 'Failed to create batch attendance records' });
    }
  });
  // Create attendanceRecord (used by offline queue)
  app.post('/api/attendance', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!['admin', 'teacher'].includes(String(role))) {
        return res.status(403).json({ message: 'Only teachers and admins can record attendance' });
      }

      const parsed = createSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
      }

      const doc = await databases.createDocument(
        APPWRITE_DATABASE_ID!,
        'attendanceRecords',
        ID.unique(),
        parsed.data
      );

      // Optional: notify student when their attendance is recorded
      try {
        const studentId = String(parsed.data.studentId);
        const classId = String(parsed.data.classId);
        const date = String(parsed.data.date);
        // Lookup student userId
        const student = await databases.getDocument(APPWRITE_DATABASE_ID!, 'students', studentId);
        if (student?.userId) {
          await notificationService.notifyAttendanceMarked([String(student.userId)], classId, date);
        }
      } catch (e) {
        // Best-effort only
      }
      return res.status(201).json(doc);
    } catch (error) {
      logError('Failed to create attendance record', error);
      return res.status(500).json({ message: 'Failed to create attendance record' });
    }
  });

  // Update attendanceRecord
  app.put('/api/attendance/:id', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!['admin', 'teacher'].includes(String(role))) {
        return res.status(403).json({ message: 'Only teachers and admins can update attendance' });
      }

      const id = String(req.params.id || '');
      if (!id) return res.status(400).json({ message: 'Missing id' });

      const parsed = updateSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
      }

      const updated = await databases.updateDocument(
        APPWRITE_DATABASE_ID!,
        'attendanceRecords',
        id,
        parsed.data
      );
      return res.json(updated);
    } catch (error) {
      logError('Failed to update attendance record', error);
      return res.status(500).json({ message: 'Failed to update attendance record' });
    }
  });

  // Delete attendanceRecord
  app.delete('/api/attendance/:id', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const role = sessionUser?.prefs?.role;
      if (!['admin', 'teacher'].includes(String(role))) {
        return res.status(403).json({ message: 'Only teachers and admins can delete attendance' });
      }

      const id = String(req.params.id || '');
      if (!id) return res.status(400).json({ message: 'Missing id' });

      await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'attendanceRecords', id);
      return res.json({ ok: true });
    } catch (error) {
      logError('Failed to delete attendance record', error);
      return res.status(500).json({ message: 'Failed to delete attendance record' });
    }
  });
};
