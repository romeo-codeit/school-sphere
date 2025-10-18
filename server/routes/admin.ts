import { Request, Response } from 'express';
import { auth } from '../middleware';
import { logError } from '../logger';
import { Client, Users, ID, Databases, Query } from 'node-appwrite';
import { validateBody } from '../middleware/validation';
import { userCreationSchema, schoolSettingsSchema, activationCodeSchema } from '../validation/schemas';
import NotificationService from '../services/notificationService';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);
const databases = new Databases(client);
const notificationService = new NotificationService(databases);

export const registerAdminRoutes = (app: any) => {
  // Admin-only user management
  app.post('/api/users', auth, validateBody(userCreationSchema), async (req: Request, res: Response) => {
    const sessionUser: any = (req as any).user;
    if (sessionUser?.prefs?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Optional: restrict roles that admins can assign
    const allowedAdminAssignableRoles = new Set(['admin', 'teacher', 'student', 'parent']);
    if (!allowedAdminAssignableRoles.has(String(role))) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    try {
      const newUser = await users.create(
        ID.unique(),
        email,
        undefined, // phoneNumber
        password,
        name
      );

      await users.updatePrefs(newUser.$id, { role });

      return res.status(201).json(newUser);
    } catch (error) {
      logError('Failed to create user', error);
      return res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Get all users (admin only)
  app.get('/api/users', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const teachers = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachers', [Query.limit(100)]);
      const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [Query.limit(100)]);
      const users = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [Query.limit(100)]);
      
      const usersCombined = users.documents.map((user: any) => ({
        ...user,
        type: teachers.documents.find((t: any) => t.userId === user.userId) ? 'teacher' : 
              students.documents.find((s: any) => s.userId === user.userId) ? 'student' : 'user'
      }));

      return res.json(usersCombined);
    } catch (e) {
      logError('Failed to fetch users', e);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // School settings management
  app.get('/api/school', auth, async (req: Request, res: Response) => {
    try {
      const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'school', [Query.limit(1)]);
      return res.json(page);
    } catch (error) {
      logError('Failed to fetch school settings', error);
      res.status(500).json({ message: 'Failed to fetch school settings' });
    }
  });

  app.put('/api/school', auth, validateBody(schoolSettingsSchema), async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { name, address, phone, email, website, logo } = req.body;

      const existing = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'school', [Query.limit(1)]);
      
      if (existing.documents.length > 0) {
        const doc = await databases.updateDocument(APPWRITE_DATABASE_ID!, 'school', existing.documents[0].$id, {
          name,
          address,
          phone,
          email,
          website,
          logo,
        });
        return res.json(doc);
      } else {
        const doc = await databases.createDocument(APPWRITE_DATABASE_ID!, 'school', ID.unique(), {
          name,
          address,
          phone,
          email,
          website,
          logo,
        });
        return res.json(doc);
      }
    } catch (error) {
      logError('Failed to update school settings', error);
      res.status(500).json({ message: 'Failed to update school settings' });
    }
  });

  // Activation codes management
  app.post('/api/admin/activation-codes', auth, validateBody(activationCodeSchema), async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const { count = 10, prefix = 'OHM', length = 10, codeType = 'trial_30d' } = (req.body || {}) as any;
      const codes: any[] = [];

      for (let i = 0; i < count; i++) {
        const code = prefix + Math.random().toString(36).substring(2, 2 + length).toUpperCase();
        const doc = await databases.createDocument(APPWRITE_DATABASE_ID!, 'activationCodes', ID.unique(), {
          code,
          codeType,
          used: false,
          createdAt: new Date().toISOString(),
        });
        codes.push(doc);
      }

      return res.json({ codes });
    } catch (error) {
      logError('Failed to generate codes', error);
      res.status(500).json({ message: 'Failed to generate codes' });
    }
  });

  app.get('/api/admin/activation-codes', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      const page = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'activationCodes', [Query.limit(100)]);
      return res.json({ codes: page.documents, total: page.total });
    } catch (error) {
      logError('Failed to list codes', error);
      res.status(500).json({ message: 'Failed to list codes' });
    }
  });

  // Pending accounts management
  app.get('/api/admin/pending-accounts', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [
        Query.equal('accountStatus', 'pending'),
        Query.limit(100)
      ]);

      res.json({ accounts: result.documents, total: result.total });
    } catch (error) {
      logError('Error fetching pending accounts', error);
      res.status(500).json({ message: 'Failed to fetch pending accounts' });
    }
  });

  app.post('/api/admin/approve-account/:userId', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const userId = req.params.userId;
  const { role } = (req.body || {}) as { role?: string };
      if (!userId) return res.status(400).json({ message: 'User ID is required' });

      // Update user profile to approved
      const profiles = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (profiles.documents.length === 0) {
        return res.status(404).json({ message: 'User profile not found' });
      }

  const profileDoc: any = profiles.documents[0];
  const requestedRole = typeof role === 'string' ? role.trim() : undefined;
  const assignedRole = requestedRole && requestedRole.length > 0 ? requestedRole : profileDoc.role || 'student';

      await databases.updateDocument(APPWRITE_DATABASE_ID!, 'userProfiles', profileDoc.$id, {
        accountStatus: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: sessionUser.$id,
        role: assignedRole,
      });

      try {
        await users.updatePrefs(userId, { role: assignedRole });
      } catch (error) {
        logError('Failed to update user role during approval', error);
      }

      try {
        await notificationService.notifyAccountApproved(userId, assignedRole);
      } catch (error) {
        logError('Failed to send account approval notification', error);
      }

      res.json({ message: 'Account approved successfully' });
    } catch (error) {
      logError('Error approving account', error);
      res.status(500).json({ message: 'Failed to approve account' });
    }
  });

  app.post('/api/admin/reject-account/:userId', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const userId = req.params.userId;
  const { reason } = (req.body || {}) as { reason?: string };
      if (!userId) return res.status(400).json({ message: 'User ID is required' });

      // Update user profile to rejected
      const profiles = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (profiles.documents.length === 0) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      const safeReason = typeof reason === 'string' ? reason.trim() : undefined;

      await databases.updateDocument(APPWRITE_DATABASE_ID!, 'userProfiles', profiles.documents[0].$id, {
        accountStatus: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: sessionUser.$id,
        rejectionReason: safeReason || null,
      });

      try {
        const reasonForNotification = safeReason ? safeReason.slice(0, 180) : undefined;
        await notificationService.notifyAccountRejected(userId, reasonForNotification);
      } catch (error) {
        logError('Failed to send account rejection notification', error);
      }

      res.json({ message: 'Account rejected' });
    } catch (error) {
      logError('Error rejecting account', error);
      res.status(500).json({ message: 'Failed to reject account' });
    }
  });

  // Admin health check
  app.get('/api/admin/health', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const collections = ['userProfiles','userSubscriptions','userProfileExtras','students','teachers','exams','questions','examAttempts','messages','notifications'];
      const counts: Record<string, number> = {};

      for (const col of collections) {
        try {
          const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, col, [Query.limit(1)]);
          counts[col] = result.total || 0;
        } catch (e) {
          counts[col] = -1; // indicates not accessible/not present
        }
      }

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        collections: counts,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      logError('Health endpoint error', error);
      res.status(500).json({ message: 'Health check failed' });
    }
  });
};