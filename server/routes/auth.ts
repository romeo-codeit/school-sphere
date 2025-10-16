import { Request, Response } from 'express';
import { auth } from '../middleware';
import { logError, logInfo } from '../logger';
import { Client, Users, ID, Databases, Query } from 'node-appwrite';
import { validateBody } from '../middleware/validation';
import { userRegistrationSchema, subscriptionActivationSchema } from '../validation/schemas';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const users = new Users(client);
const databases = new Databases(client);

export const registerAuthRoutes = (app: any) => {
  // User registration endpoint that creates user profiles with pending approval
  app.post('/api/users/register', validateBody(userRegistrationSchema), async (req: Request, res: Response) => {
    try {
      const { email, password, name, role = 'student' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
      }

      // Lock down allowed roles during self-registration
      const allowedSelfRegistrationRoles = new Set(['student', 'guest']);
      if (!allowedSelfRegistrationRoles.has(String(role))) {
        return res.status(400).json({ message: 'Invalid role for self-registration' });
      }

      // Create user account
      const newUser = await users.create(ID.unique(), email, password, name);
      await users.updatePrefs(newUser.$id, { role });

      // Create user profile; auto-approve guests, require approval for others
      const profileData = {
        userId: newUser.$id,
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: email,
        role: role,
        accountStatus: role === 'guest' ? 'approved' : 'pending',
        subscriptionStatus: 'inactive',
      };

      await databases.createDocument(APPWRITE_DATABASE_ID!, 'userProfiles', ID.unique(), profileData);

      res.json({
        message: role === 'guest'
          ? 'Guest account created successfully. You can sign in now. Subscription is required to access practice exams.'
          : 'Account created successfully. Please wait for admin approval.',
        user: newUser,
        status: role === 'guest' ? 'guest_created' : 'pending_approval'
      });
    } catch (error: any) {
      logError('Registration error', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  // JWT cookie endpoint for client-side auth
  app.post('/api/auth/jwt-cookie', async (req: Request, res: Response) => {
    try {
      const token = String((req.body || {}).jwt || '');
      if (!token) return res.status(400).json({ message: 'Missing jwt' });
      // Very light validation; full validation occurs in auth middleware
      const csrfToken = Math.random().toString(36).slice(2);
      const isProd = app.get('env') === 'production';
      res.cookie('aw_jwt', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({ ok: true, csrfToken });
    } catch (error) {
      logError('JWT cookie error', error);
      res.status(500).json({ message: 'Failed to set auth cookie' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    const isProd = app.get('env') === 'production';
    res.cookie('aw_jwt', '', { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: 0 });
    res.cookie('csrf_token', '', { httpOnly: false, secure: isProd, sameSite: 'strict', path: '/', maxAge: 0 });
    return res.json({ ok: true });
  });

  // Get current user info
  app.get('/api/users/me', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const profile = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (profile.documents.length === 0) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      const userProfile = profile.documents[0];
      return res.json({
        id: sessionUser.$id,
        email: sessionUser.email,
        name: sessionUser.name,
        role: sessionUser.prefs?.role || 'student',
        profile: userProfile
      });
    } catch (error) {
      logError('Failed to get user profile', error);
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  });

  // Get user subscription status
  app.get('/api/users/subscription', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const profile = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (profile.documents.length === 0) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      const userProfile = profile.documents[0];
      const status = userProfile.subscriptionStatus || 'inactive';
      const expiry = userProfile.subscriptionExpiry ? new Date(userProfile.subscriptionExpiry) : null;
      const examAccess = status === 'active' && (!expiry || expiry > new Date());

      return res.json({ subscriptionStatus: status, subscriptionExpiry: expiry, examAccess });
    } catch (error) {
      logError('Failed to get subscription status', error);
      res.status(500).json({ message: 'Failed to get subscription status' });
    }
  });

  // Activate subscription with code
  app.post('/api/users/activate-subscription', auth, validateBody(subscriptionActivationSchema), async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { code } = req.body;
      if (!code) return res.status(400).json({ message: 'Activation code is required' });

      // Find the activation code
      const codes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'activationCodes', [
        Query.equal('code', String(code)),
        Query.equal('used', false),
        Query.limit(1)
      ]);

      if (codes.documents.length === 0) {
        return res.status(400).json({ message: 'Invalid or already used activation code' });
      }

      const activationCode = codes.documents[0];
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30); // 30 days from now

      // Update user profile
      await databases.updateDocument(APPWRITE_DATABASE_ID!, 'userProfiles', userId, {
        subscriptionStatus: 'active',
        subscriptionExpiry: expiry.toISOString(),
      });

      // Mark code as used
      await databases.updateDocument(APPWRITE_DATABASE_ID!, 'activationCodes', activationCode.$id, {
        used: true,
        usedBy: userId,
        usedAt: new Date().toISOString(),
      });

      return res.json({ message: 'Subscription activated', subscriptionStatus: 'active', subscriptionExpiry: expiry.toISOString() });
    } catch (error) {
      logError('Failed to activate subscription', error);
      res.status(500).json({ message: 'Failed to activate subscription' });
    }
  });

  // Delete user account and all linked data
  app.delete('/api/users/self', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      const userId = sessionUser?.$id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      logInfo('Starting user deletion process', { userId });

      // 1. Delete user profile
      const profiles = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'userProfiles', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (profiles.documents.length > 0) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'userProfiles', profiles.documents[0].$id);
        logInfo('Deleted user profile', { userId });
      }

      // 2. Delete student record if exists
      const students = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (students.documents.length > 0) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'students', students.documents[0].$id);
        logInfo('Deleted student record', { userId });
      }

      // 3. Delete teacher record if exists
      const teachers = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'teachers', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (teachers.documents.length > 0) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'teachers', teachers.documents[0].$id);
        logInfo('Deleted teacher record', { userId });
      }

      // 4. Delete exam attempts
      const attempts = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAttempts', [
        Query.equal('userId', userId),
        Query.limit(1000)
      ]);

      for (const attempt of attempts.documents) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'examAttempts', attempt.$id);
      }
      logInfo('Deleted exam attempts', { userId, count: attempts.documents.length });

      // 5. Delete exam assignments
      const assignments = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'examAssignments', [
        Query.equal('userId', userId),
        Query.limit(1000)
      ]);

      for (const assignment of assignments.documents) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'examAssignments', assignment.$id);
      }
      logInfo('Deleted exam assignments', { userId, count: assignments.documents.length });

      // 6. Delete messages where user is sender or recipient
      const sentMessages = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'messages', [
        Query.equal('senderId', userId),
        Query.limit(1000)
      ]);

      for (const message of sentMessages.documents) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'messages', message.$id);
      }

      const receivedMessages = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'messages', [
        Query.equal('recipientId', userId),
        Query.limit(1000)
      ]);

      for (const message of receivedMessages.documents) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'messages', message.$id);
      }
      logInfo('Deleted messages', { userId, sent: sentMessages.documents.length, received: receivedMessages.documents.length });

      // 7. Delete notifications
      const notifications = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'notifications', [
        Query.equal('userId', userId),
        Query.limit(1000)
      ]);

      for (const notification of notifications.documents) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'notifications', notification.$id);
      }
      logInfo('Deleted notifications', { userId, count: notifications.documents.length });

      // 8. Delete grades/attendance records
      const grades = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'grades', [
        Query.equal('studentId', userId),
        Query.limit(1000)
      ]);

      for (const grade of grades.documents) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'grades', grade.$id);
      }

      const attendance = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'attendance', [
        Query.equal('studentId', userId),
        Query.limit(1000)
      ]);

      for (const record of attendance.documents) {
        await databases.deleteDocument(APPWRITE_DATABASE_ID!, 'attendance', record.$id);
      }
      logInfo('Deleted grades and attendance', { userId, grades: grades.documents.length, attendance: attendance.documents.length });

      // 9. Finally, delete the user account
      await users.delete(userId);
      logInfo('Deleted user account', { userId });

      return res.json({ 
        ok: true, 
        message: 'User account and all linked data deleted successfully',
        deleted: {
          profile: profiles.documents.length > 0,
          student: students.documents.length > 0,
          teacher: teachers.documents.length > 0,
          attempts: attempts.documents.length,
          assignments: assignments.documents.length,
          messages: sentMessages.documents.length + receivedMessages.documents.length,
          notifications: notifications.documents.length,
          grades: grades.documents.length,
          attendance: attendance.documents.length
        }
      });
    } catch (e) {
      logError('Failed to delete account', e);
      return res.status(500).json({ message: 'Failed to delete account' });
    }
  });
};