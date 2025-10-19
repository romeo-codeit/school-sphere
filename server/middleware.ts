import { Client, Account } from 'node-appwrite';
import { Request, Response, NextFunction } from 'express';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;

declare global {
  namespace Express {
    interface Request {
      appwrite?: { client: Client; account: Account };
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Simplified authentication - allow requests without strict JWT validation for exam functionality
  const getCookies = (cookieHeader?: string): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!cookieHeader) return out;
    cookieHeader.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > -1) {
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        out[k] = decodeURIComponent(v);
      }
    });
    return out;
  };

  const cookies = getCookies(req.headers.cookie);
  const headerToken = req.headers.authorization?.split(' ')[1];
  const cookieToken = cookies['aw_jwt'];
  const initialSession = headerToken || cookieToken;

  // For exam-related endpoints, allow requests without strict authentication
  const isExamEndpoint = req.path.includes('/api/cbt/') && (
    req.path.includes('/subjects/') || 
    req.path.includes('/years/') || 
    req.path.includes('/exams/') ||
    req.path.includes('/attempts/')
  );

  if (!initialSession && !isExamEndpoint) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const buildClient = (jwt?: string) => {
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT!)
      .setProject(APPWRITE_PROJECT_ID!);
    
    if (jwt) {
      client.setJWT(jwt);
    }
    
    return client;
  };

  const tryAuthenticate = async (jwt?: string) => {
    const client = buildClient(jwt);
    const account = new Account(client);
    
    try {
      const user = await account.get();
      req.appwrite = { client, account };
      (req as any).user = user;
    } catch (error) {
      // For exam endpoints, create a mock user if authentication fails
      if (isExamEndpoint) {
        const mockUser = {
          $id: 'guest-user',
          prefs: { role: 'guest' }
        };
        req.appwrite = { client, account };
        (req as any).user = mockUser;
      } else {
        throw error;
      }
    }
  };

  (async () => {
    try {
      await tryAuthenticate(initialSession);
      return next();
    } catch (e: any) {
      if (isExamEndpoint) {
        // For exam endpoints, allow with mock user
        try {
          await tryAuthenticate();
          return next();
        } catch (inner: any) {
          return res.status(500).json({ message: 'Service temporarily unavailable' });
        }
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  })();
};