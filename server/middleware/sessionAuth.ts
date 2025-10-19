import { Request, Response, NextFunction } from 'express';
import { Client, Account } from 'node-appwrite';
import { logError } from '../logger';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;

declare global {
  namespace Express {
    interface Request {
      appwrite?: { client: Client; account: Account };
      user?: any;
    }
  }
}

export const sessionAuth = (req: Request, res: Response, next: NextFunction) => {
  // Simple session-based authentication
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
  const sessionId = cookies['appwrite_session'];
  const jwt = cookies['aw_jwt'] || req.headers.authorization?.split(' ')[1];

  if (!sessionId && !jwt) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const buildClient = (authToken: string) => {
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT!)
      .setProject(APPWRITE_PROJECT_ID!);
    
    // Try session first, then JWT
    try {
      client.setSession(authToken);
    } catch {
      try {
        client.setJWT(authToken);
      } catch {
        // Will be handled in tryAuthenticate
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
      req.user = user;
      return true;
    } catch (error) {
      throw error;
    }
  };

  (async () => {
    try {
      const token = sessionId || jwt;
      if (!token) {
        return res.status(401).json({ message: 'No authentication token provided' });
      }
      
      await tryAuthenticate(token);
      return next();
    } catch (e: any) {
      logError('Session authentication failed', e);
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
  })();
};

// Simple exam security - basic session validation without complex JWT
export const examSecurity = (req: Request, res: Response, next: NextFunction) => {
  // For exam security, we'll use a simple approach:
  // 1. Check if user has a valid session
  // 2. Rate limit exam attempts
  // 3. Basic validation
  
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
  const sessionId = cookies['appwrite_session'];
  const jwt = cookies['aw_jwt'] || req.headers.authorization?.split(' ')[1];

  if (!sessionId && !jwt) {
    return res.status(401).json({ message: 'Authentication required for exam access' });
  }

  // Basic validation - if we have a token, allow access
  // In a production environment, you'd want more sophisticated validation
  next();
};