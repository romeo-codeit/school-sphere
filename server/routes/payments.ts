import { Request, Response } from 'express';
import { auth } from '../middleware';
import { logError } from '../logger';
import { Client, Databases, ID, Query } from 'node-appwrite';
import { validateBody, validateQuery } from '../middleware/validation';
import { paymentCreateSchema, paymentUpdateSchema, paymentQuerySchema } from '../validation/schemas';
import NotificationService from '../services/notificationService';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const notificationService = new NotificationService(databases);

export const registerPaymentRoutes = (app: any) => {
  // List payments with optional filters
  app.get('/api/payments', auth, validateQuery(paymentQuerySchema), async (req: Request, res: Response) => {
    try {
      const { studentId, status } = req.query as { studentId?: string; status?: string };
      const queries: any[] = [Query.orderDesc('$createdAt'), Query.limit(100)];
      if (studentId) queries.push(Query.equal('studentId', String(studentId)));
      if (status) queries.push(Query.equal('status', String(status)));

      const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'payments', queries);
      res.json(page.documents);
    } catch (error) {
      logError('Failed to list payments', error);
      res.status(500).json({ message: 'Failed to list payments' });
    }
  });

  // Create a payment record
  app.post('/api/payments', auth, validateBody(paymentCreateSchema), async (req: Request, res: Response) => {
    try {
      const payload = req.body as any;
      const doc = await databases.createDocument(APPWRITE_DATABASE_ID!, 'payments', ID.unique(), {
        ...payload,
        status: payload.status || 'pending',
      });

      // Notify student of pending payment
      try {
        const student = await databases.getDocument(APPWRITE_DATABASE_ID!, 'students', String(payload.studentId));
        const userId = String((student as any).userId || '');
        if (userId) {
          await notificationService.notifyPendingPayment(
            userId,
            Number(payload.amount),
            String(payload.dueDate || ''),
            String(payload.purpose || 'School Fees')
          );
        }
      } catch (e) {
        logError('Failed to send pending payment notification', e);
      }

      res.status(201).json(doc);
    } catch (error) {
      logError('Failed to create payment', error);
      res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  // Update a payment record
  app.put('/api/payments/:id', auth, validateBody(paymentUpdateSchema), async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || '');
      if (!id) return res.status(400).json({ message: 'Missing id' });

      let previous: any = null;
      try { previous = await databases.getDocument(APPWRITE_DATABASE_ID!, 'payments', id); } catch {}

      const updated = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'payments', id, req.body as any);

      // If status changed to paid, notify student and admins
      try {
        const prevStatus = String(previous?.status || '');
        const nextStatus = String((updated as any).status || '');
        if (prevStatus !== 'paid' && nextStatus === 'paid') {
          const studentId = String((updated as any).studentId || '');
          const student = await databases.getDocument(APPWRITE_DATABASE_ID!, 'students', studentId);
          const userId = String((student as any).userId || '');
          const amount = Number((updated as any).amount || 0);
          const reference = String((updated as any).transactionId || updated.$id);
          if (userId) {
            await notificationService.notifyPaymentConfirmed(userId, amount, reference);
          }
          try {
            const admins = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [
              Query.equal('role', 'admin'),
              Query.limit(100),
            ]);
            const adminIds = admins.documents.map((d: any) => d.userId).filter(Boolean);
            const studentName = `${(student as any).firstName || ''} ${(student as any).lastName || ''}`.trim() || String(studentId);
            await Promise.all(
              adminIds.map((aid: string) =>
                notificationService
                  .notifyAdminPaymentReceived(aid, studentName, amount, reference)
                  .catch((e) => logError('Admin payment notification failed', e))
              )
            );
          } catch (e) {
            logError('Failed to notify admins of payment', e);
          }
        }
      } catch (e) {
        logError('Payment notification hook failed', e);
      }

      res.json(updated);
    } catch (error) {
      logError('Failed to update payment', error);
      res.status(500).json({ message: 'Failed to update payment' });
    }
  });

  // Delete a payment record
  app.delete('/api/payments/:id', auth, async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || '');
      if (!id) return res.status(400).json({ message: 'Missing id' });
      await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'payments', id);
      res.json({ ok: true });
    } catch (error) {
      logError('Failed to delete payment', error);
      res.status(500).json({ message: 'Failed to delete payment' });
    }
  });
};
