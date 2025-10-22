import winston from 'winston';
import * as Sentry from '@sentry/node';

// Initialize Sentry for error monitoring
const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (SENTRY_DSN && NODE_ENV === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    tracesSampleRate: 1.0, // Adjust this in production (0.1 = 10% of transactions)
  });
}

// Create Winston logger
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ohman-foundations' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console with colorized output
if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Wrapper to send errors to Sentry
const logError = (error: Error | string | unknown, context?: Record<string, any> | unknown) => {
  let errorMessage: string;
  let errorObj: Error;
  let contextObj: Record<string, any> = {};
  
  if (typeof error === 'string') {
    errorMessage = error;
    errorObj = new Error(error);
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorObj = error;
  } else {
    errorMessage = String(error);
    errorObj = new Error(errorMessage);
  }
  
  if (context && typeof context === 'object' && context !== null) {
    contextObj = context as Record<string, any>;
  }
  
  logger.error(errorMessage, { error: errorObj, ...contextObj });
  
  if (SENTRY_DSN && NODE_ENV === 'production') {
    Sentry.captureException(errorObj, {
      extra: contextObj,
    });
  }
};

const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

export { logger, logError, logInfo, logWarn, logDebug, Sentry };
