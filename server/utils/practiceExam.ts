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

  // Normalize requested paper type once; map "objective" -> "obj"
  const requestedPaperType: 'obj' | 'theory' | undefined = paperTypeParam
    ? ((String(paperTypeParam).toLowerCase() === 'objective' || String(paperTypeParam).toLowerCase() === 'obj')
        ? 'obj'
        : 'theory')
    : undefined;

  // Helper to normalize a question's paper type, falling back to inferring
  // by presence of options (objective) vs no options (theory)
  const resolveQuestionPaperType = (q: any): 'obj' | 'theory' => {
    const raw = (q?.paper_type ?? q?.paperType ?? q?.type ?? '') as string;
    const n = String(raw || '').toLowerCase();
    if (n === 'objective' || n === 'obj') return 'obj';
    if (n === 'theory') return 'theory';
    const opts = (q?.options ?? []) as any[];
    return Array.isArray(opts) && opts.length > 0 ? 'obj' : 'theory';
  };

  const canonicalSelectedSubjects = selectedSubjects.map(s => canonicalSubject(s));
  const allQuestions: any[] = [];

  // Build database queries, filter type in-memory to be resilient to data variants
  const examQueries: any[] = [];

  // Add year filter if specified
  if (yearParam) {
    examQueries.push(Query.equal('year', yearParam));
  }

  // IMPORTANT: Do NOT filter by paper type at the exam level.
  // Many datasets store paper type per-question, not per-exam. We will
  // filter at the question level below to avoid excluding valid exams.

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
        // Filter by requested paper type at question level
        if (requestedPaperType) {
          const qPt = resolveQuestionPaperType(q);
          if (qPt !== requestedPaperType) continue;
        }
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
        // We intentionally do not hard-filter by paper type at the DB level
        // because many datasets omit this field. We will filter in-memory
        // using the question content and any present paper_type.
        const qRes = await databases.listDocuments(APPWRITE_DATABASE_ID!, 'questions', [
          Query.equal('examId', String(exam.$id)),
          Query.limit(100),
          Query.offset(qOffset),
        ]);

        if (qRes.documents.length === 0) break;

        const examSubjectRaw = String((exam as any).subject || '');
        for (const q of qRes.documents) {
          if (requestedPaperType) {
            const qPt = resolveQuestionPaperType(q);
            if (qPt !== requestedPaperType) continue;
          }
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