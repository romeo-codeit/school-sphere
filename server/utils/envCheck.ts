import { logError, logWarn, logInfo } from '../logger';

export function validateEnv() {
  const env = process.env.NODE_ENV || 'development';

  const required = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'VITE_APPWRITE_DATABASE_ID',
  ];

  let missing: string[] = [];
  for (const key of required) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    if (env === 'production') {
      logError(msg);
      throw new Error(msg);
    } else {
      logWarn(msg);
    }
  }

  // CORS / URL settings (warn-only if absent)
  const corsVars = [
    'PRODUCTION_URL',
    'VITE_APP_URL',
  ];
  const corsMissing = corsVars.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (corsMissing.length > 0) {
    logWarn(`CORS origin vars not set: ${corsMissing.join(', ')}. Ensure these are configured before deploying.`);
  }

  // Sentry DSN recommendation
  if (env === 'production' && !process.env.SENTRY_DSN) {
    logWarn('SENTRY_DSN not set. Error tracing will be limited in production.');
  }

  logInfo('Environment validation complete', { env });
}
