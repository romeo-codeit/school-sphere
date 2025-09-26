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
  const session = req.headers.authorization?.split(' ')[1];

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT!)
    .setProject(APPWRITE_PROJECT_ID!)
    .setJWT(session);

  const account = new Account(client);

  req.appwrite = { client, account };

  next();
};