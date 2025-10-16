import { Request, Response } from 'express';
import { auth } from '../middleware';
import { logError } from '../logger';
import { Client, Databases, Query } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export const registerDebugRoutes = (app: any) => {
  // Appwrite connectivity test
  app.get('/api/debug/appwrite', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'exams', [Query.limit(1)]);
      res.json({ success: true, count: result.documents.length });
    } catch (error) {
      logError('Appwrite connectivity test failed', error);
      res.status(500).json({ message: 'Appwrite connectivity test failed' });
    }
  });

  // Exam subjects analysis
  app.get('/api/debug/exam-subjects', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const examsByType: Record<string, any[]> = {};
      let offset = 0;
      
      while (true) {
        const page = await databases.listDocuments(
          APPWRITE_DATABASE_ID!,
          'exams',
          [Query.limit(100), Query.offset(offset)]
        );
        
        for (const doc of page.documents as any[]) {
          const type = String(doc.type || 'unknown').toLowerCase();
          const subject = String(doc.subject || 'unknown');
          
          if (!examsByType[type]) examsByType[type] = [];
          
          // Check for questions
          let questionCount = 0;
          if (Array.isArray(doc.questions)) {
            questionCount = doc.questions.length;
          } else {
            const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
              Query.equal('examId', String(doc.$id)),
              Query.limit(1)
            ]);
            questionCount = qRes.total || 0;
          }
          
          examsByType[type].push({
            id: doc.$id,
            title: doc.title,
            subject,
            questionCount,
            hasQuestions: questionCount > 0
          });
        }
        
        offset += page.documents.length;
        if (offset >= (page.total || offset) || page.documents.length === 0) break;
      }
      
      // Summary
      const summary: Record<string, any> = {};
      for (const [type, exams] of Object.entries(examsByType)) {
        const subjects = new Set(exams.map(e => e.subject.toLowerCase()));
        const withQuestions = exams.filter(e => e.hasQuestions);
        summary[type] = {
          totalExams: exams.length,
          uniqueSubjects: Array.from(subjects),
          examsWithQuestions: withQuestions.length,
          examsWithoutQuestions: exams.length - withQuestions.length
        };
      }
      
      res.json({ summary, details: examsByType });
    } catch (error) {
      logError('Failed to analyze exam subjects', error);
      res.status(500).json({ message: 'Failed to analyze exam subjects' });
    }
  });

  // Students debug info
  app.get('/api/debug/students', auth, async (req: Request, res: Response) => {
    try {
      const sessionUser: any = (req as any).user;
      if (sessionUser?.prefs?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const result = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'students', [Query.limit(1)]);
      res.json({ success: true, count: result.documents.length, student: result.documents[0] });
    } catch (error) {
      logError('Failed to fetch students debug info', error);
      res.status(500).json({ message: 'Failed to fetch students debug info' });
    }
  });
};