import { Databases, Query } from 'node-appwrite';

const APPWRITE_DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

// Helper function to convert URLs to CDN URLs
const toCDNUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return url; // Return as-is for now, can be enhanced later
};

// Optimized function to fetch questions for practice exams
export async function fetchPracticeExamQuestions(
  databases: Databases,
  type: string, 
  selectedSubjects: string[], 
  yearParam?: string, 
  paperTypeParam?: 'objective' | 'theory' | 'obj'
): Promise<any[]> {
  const normalize = (s: string) => String(s || '').trim().toLowerCase();
  const normalizeKey = (s: string) => normalize(s).replace(/[^a-z0-9]/g, '');
  const canonicalSubject = (s: string) => {
    const k = normalizeKey(s);
    if (k.startsWith('english') || k.includes('useofenglish')) return 'english';
    if (k === 'agric' || k.startsWith('agric') || k.includes('agriculturalscience')) return 'agriculturalscience';
    return k;
  };

  const canonicalSelectedSubjects = selectedSubjects.map(s => canonicalSubject(s));
  const allQuestions: any[] = [];

  // Build database queries, filter type in-memory to be resilient to data variants
  const examQueries: any[] = [];

  // Add year filter if specified
  if (yearParam) {
    examQueries.push(Query.equal('year', yearParam));
  }

  // If a paper type filter is requested (WAEC/NECO), add it if present in schema
  if (paperTypeParam) {
    const pt = (paperTypeParam === 'obj' ? 'obj' : paperTypeParam);
    try { examQueries.push(Query.equal('paper_type', pt)); } catch {}
  }

  // Fetch all exams matching the type and year criteria
  let examOffset = 0;
  const matchingExams: any[] = [];

  while (true) {
    const examResults = await databases.listDocuments(
      APPWRITE_DATABASE_ID!,
      'exams',
      [...examQueries, Query.limit(100), Query.offset(examOffset)]
    );

    if (examResults.documents.length === 0) break;

    // Filter exams by subject in memory (since Appwrite doesn't support complex subject filtering)
    for (const exam of examResults.documents) {
      const docType = normalize((exam as any).type || '');
      const titleLower = normalize((exam as any).title || '');
      const typeMatches = docType === type || titleLower.includes(type);
      if (!typeMatches) continue;
      const examSubjectRaw = String((exam as any).subject || '');
      const examSubject = canonicalSubject(examSubjectRaw);

      if (canonicalSelectedSubjects.includes(examSubject)) {
        matchingExams.push(exam);
      }
    }

    examOffset += examResults.documents.length;
    if (examOffset >= (examResults.total || examOffset)) break;
  }

  // Now fetch questions for all matching exams in parallel
  const questionPromises = matchingExams.map(async (exam) => {
    const questions: any[] = [];

    // Check if exam has embedded questions
    if (Array.isArray((exam as any).questions) && (exam as any).questions.length > 0) {
      const examSubjectRaw = String((exam as any).subject || '');
      for (const q of (exam as any).questions) {
        const text = (q as any).question ?? (q as any).questionText ?? (q as any).text ?? '';
        const opts = (q as any).options ?? [];
        const correct = (q as any).correctAnswer ?? (q as any).answer ?? '';
        const mapped = {
          question: text,
          options: opts,
          correctAnswer: correct,
          explanation: (q as any).explanation ?? undefined,
          imageUrl: toCDNUrl((q as any).imageUrl ?? (q as any).image),
          answerUrl: (q as any).answerUrl ?? (q as any).answer_url ?? undefined,
          subject: (canonicalSubject(examSubjectRaw) === 'english') ? 'English' : (exam as any).subject,
        };
        questions.push(mapped);
      }
    } else {
      // Fetch from questions collection
      let qOffset = 0;
      while (true) {
        const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
          Query.equal('examId', String(exam.$id)),
          Query.limit(100),
          Query.offset(qOffset),
        ]);

        if (qRes.documents.length === 0) break;

        const examSubjectRaw = String((exam as any).subject || '');
        for (const q of qRes.documents) {
          const text = (q as any).question ?? (q as any).questionText ?? (q as any).text ?? '';
          const opts = (q as any).options ?? [];
          const correct = (q as any).correctAnswer ?? (q as any).answer ?? '';
          const mapped = {
            question: text,
            options: opts,
            correctAnswer: correct,
            explanation: (q as any).explanation ?? undefined,
            imageUrl: toCDNUrl((q as any).imageUrl ?? (q as any).image),
            answerUrl: (q as any).answerUrl ?? (q as any).answer_url ?? undefined,
            subject: (canonicalSubject(examSubjectRaw) === 'english') ? 'English' : (exam as any).subject,
          };
          questions.push(mapped);
        }

        qOffset += qRes.documents.length;
        if (qOffset >= (qRes.total || qOffset)) break;
      }
    }

    return questions;
  });

  const questionArrays = await Promise.all(questionPromises);
  for (const qArray of questionArrays) {
    allQuestions.push(...qArray);
  }

  return allQuestions;
}