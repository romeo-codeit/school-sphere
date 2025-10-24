import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { logger, logError, logInfo, Sentry } from "./logger";
import { validateEnv } from "./utils/envCheck";

const app = express();

// Sentry Request Handler - must be first middleware
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  app.use(Sentry.setupExpressErrorHandler(app) as any);
}

// Validate environment early
validateEnv();

// Security Headers - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "https://meet.jit.si"],
      connectSrc: [
        "'self'",
        process.env.VITE_APPWRITE_ENDPOINT || "",
        "https://cloud.appwrite.io",
        "https://meet.jit.si",
        "wss://meet.jit.si",
      ],
      frameSrc: ["'self'", "https://meet.jit.si"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// Enable gzip/deflate compression to reduce bandwidth and speed up responses
app.use(compression({
  // Compress all responses larger than 1KB
  threshold: 1024,
}));

// CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.PRODUCTION_URL || '',
      process.env.VITE_APP_URL || '',
      // Allow Capacitor/Ionic and local WebView origins for mobile apps
      'capacitor://localhost',
      'http://localhost',
      'http://127.0.0.1',
    ].filter(Boolean)
  : ['http://localhost:5000', 'http://localhost:5173', 'http://127.0.0.1:5000', 'capacitor://localhost', 'http://localhost', 'http://127.0.0.1'];

const isCapacitorLikeOrigin = (origin?: string) => !!origin && (
  origin.startsWith('capacitor://') || origin === 'http://localhost' || origin === 'http://127.0.0.1'
);

app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || isCapacitorLikeOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // Include CSRF header and common headers to avoid preflight failures
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // Don't rate limit health checks
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit to 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Apply rate limiting
app.use('/api/', generalLimiter);

// Apply auth rate limiting to auth routes
app.use('/api/auth/', authLimiter);
app.use('/api/users/register', authLimiter);
// Exam-specific rate limits
const examLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const examSubmitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api/cbt/attempts', examLimiter);
app.use('/api/cbt/attempts/:id/submit', examSubmitLimiter);

// Payments rate limiter (modest)
const paymentsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/payments', paymentsLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  await registerRoutes(app);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    logError(err, { status }); // Log with Winston and Sentry
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { createServer } = await import('http');
    const server = createServer(app);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const { createServer } = await import('http');
  const server = createServer(app);
  
  // Bind to 0.0.0.0 to allow external access in container/cloud environments
  const host = process.env.HOST || '0.0.0.0';
  server.listen(port, host as any, () => {
    logInfo(`OhmanFoundations server started on port ${port}`, { 
      environment: process.env.NODE_ENV || 'development',
      port,
      host,
    });
  });
})();
