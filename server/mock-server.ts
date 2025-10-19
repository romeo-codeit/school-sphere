import express from 'express';
import cors from 'cors';

const app = express();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:5173', 'http://127.0.0.1:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Mock CBT routes
app.get('/api/cbt/subjects/available', (req, res) => {
  const type = req.query.type as string;
  const subjects = {
    jamb: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature'],
    waec: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature', 'Geography', 'History'],
    neco: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature', 'Geography', 'History']
  };
  
  res.json({ subjects: subjects[type as keyof typeof subjects] || [] });
});

app.get('/api/cbt/years/available', (req, res) => {
  res.json({ years: ['2024', '2023', '2022', '2021', '2020'] });
});

app.get('/api/cbt/years/availability', (req, res) => {
  const subjects = req.query.subjects as string;
  const subjectList = subjects ? subjects.split(',') : [];
  
  const availability = ['2024', '2023', '2022', '2021', '2020'].map(year => ({
    year,
    subjects: subjectList,
    availableCount: subjectList.length,
    totalCount: subjectList.length,
  }));
  
  res.json({ availability });
});

app.get('/api/cbt/exams/practice-:type', (req, res) => {
  const type = req.params.type;
  const subjects = req.query.subjects as string;
  const subjectList = subjects ? subjects.split(',') : [];
  
  // Generate mock questions
  const questions = [];
  for (let i = 1; i <= 20; i++) {
    questions.push({
      id: `q${i}`,
      question: `Sample question ${i} for ${type.toUpperCase()} practice?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: `This is the explanation for question ${i}`,
      subject: subjectList[i % subjectList.length] || 'General',
    });
  }
  
  const exam = {
    $id: `practice-${type}`,
    title: `${type.toUpperCase()} Practice - ${subjectList.join(', ')}`,
    type,
    subject: subjectList.join(', '),
    duration: type === 'jamb' ? 120 : 90,
    questions,
    questionCount: questions.length,
    isPractice: true,
    selectedSubjects: subjectList,
  };
  
  res.json(exam);
});

app.post('/api/cbt/attempts', (req, res) => {
  const attempt = {
    $id: 'attempt-' + Date.now(),
    userId: 'user-' + Date.now(),
    examId: req.body.examId,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    subjects: req.body.subjects || [],
    answers: {},
    timeSpent: 0,
  };
  
  res.status(201).json(attempt);
});

app.post('/api/cbt/attempts/:id/submit', (req, res) => {
  const attempt = {
    $id: req.params.id,
    status: 'completed',
    submittedAt: new Date().toISOString(),
    answers: req.body.answers || {},
    score: Math.floor(Math.random() * 20),
    totalQuestions: 20,
    percentage: Math.floor(Math.random() * 100),
    passed: Math.random() > 0.3,
  };
  
  res.json(attempt);
});

app.post('/api/cbt/attempts/autosave', (req, res) => {
  res.json({ ok: true, attempt: { $id: req.body.attemptId } });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = 5000;
app.listen(port, () => {
  console.log(`Mock server running on port ${port}`);
});