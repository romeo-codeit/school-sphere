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
  // Support Authorization header or HttpOnly cookie-based JWT
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
  const usingCookieAuth = !headerToken && !!cookieToken;
  const session = headerToken || cookieToken;

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT!)
    .setProject(APPWRITE_PROJECT_ID!)
    .setJWT(session);

  const account = new Account(client);

  // Verify JWT by calling get() on account
  account.get()
    .then((user) => {
      // CSRF protection for cookie-authenticated state-changing requests
      if (usingCookieAuth && ['POST','PUT','PATCH','DELETE'].includes(req.method.toUpperCase())) {
        const csrfCookie = cookies['csrf_token'];
        const csrfHeader = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) as string | undefined;
        if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
          return res.status(403).json({ message: 'CSRF token invalid or missing' });
        }
      }

      req.appwrite = { client, account };
      // Attach user info for RBAC checks
      (req as any).user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: 'Invalid or expired token' });
    });
};