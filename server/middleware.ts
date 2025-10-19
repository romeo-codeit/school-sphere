import { Client, Account } from 'node-appwrite';
import { Request, Response, NextFunction } from 'express';
import { logError } from './logger';

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
  // Simplified authentication - support both JWT and session-based auth
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
  const sessionId = cookies['appwrite_session'];
  
  // Try to get token from any source
  const token = headerToken || cookieToken || sessionId;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const buildClient = (authToken: string) => {
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT!)
      .setProject(APPWRITE_PROJECT_ID!);
    
    // Try JWT first, then session
    try {
      client.setJWT(authToken);
    } catch {
      try {
        client.setSession(authToken);
      } catch {
        // If both fail, we'll handle it in the tryAuthenticate function
      }
    }
    
    return client;
  };

  const tryAuthenticate = async (authToken: string) => {
    const client = buildClient(authToken);
    const account = new Account(client);
    
    try {
      const user = await account.get();
      req.appwrite = { client, account };
      (req as any).user = user;
      return true;
    } catch (error) {
      // If JWT fails, try session
      if (authToken !== sessionId) {
        try {
          const sessionClient = new Client()
            .setEndpoint(APPWRITE_ENDPOINT!)
            .setProject(APPWRITE_PROJECT_ID!)
            .setSession(authToken);
          const sessionAccount = new Account(sessionClient);
          const user = await sessionAccount.get();
          req.appwrite = { client: sessionClient, account: sessionAccount };
          (req as any).user = user;
          return true;
        } catch (sessionError) {
          throw error; // Throw original error
        }
      }
      throw error;
    }
  };

  (async () => {
    try {
      await tryAuthenticate(token);
      return next();
    } catch (e: any) {
      logError('Authentication failed', e);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  })();
};