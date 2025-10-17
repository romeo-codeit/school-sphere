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
  const usingCookieAuthInitial = !headerToken && !!cookieToken;
  const initialSession = headerToken || cookieToken;

  if (!initialSession) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const buildClient = (jwt: string) => new Client()
    .setEndpoint(APPWRITE_ENDPOINT!)
    .setProject(APPWRITE_PROJECT_ID!)
    .setJWT(jwt);

  const tryAuthenticate = async (jwt: string, cookieMode: boolean) => {
    const client = buildClient(jwt);
    const account = new Account(client);
    const user = await account.get();
    // CSRF protection for cookie-authenticated state-changing requests
    if (cookieMode && ['POST','PUT','PATCH','DELETE'].includes(req.method.toUpperCase())) {
      const csrfCookie = cookies['csrf_token'];
      const csrfHeader = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) as string | undefined;
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        throw Object.assign(new Error('CSRF token invalid or missing'), { statusCode: 403 });
      }
    }
    req.appwrite = { client, account };
    (req as any).user = user;
  };

  (async () => {
    try {
      // First try header token (if present)
      await tryAuthenticate(initialSession, usingCookieAuthInitial);
      return next();
    } catch (e: any) {
      // If header token failed and we have a cookie token, try cookie fallback
      if (headerToken && cookieToken) {
        try {
          await tryAuthenticate(cookieToken, true);
          return next();
        } catch (inner: any) {
          const status = inner?.statusCode === 403 ? 403 : 401;
          return res.status(status).json({ message: status === 403 ? 'CSRF token invalid or missing' : 'Invalid or expired token' });
        }
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  })();
};