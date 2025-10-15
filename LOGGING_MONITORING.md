# Production Logging and Monitoring Guide

## Overview

OhmanFoundations now includes enterprise-grade logging and error monitoring using Winston and Sentry.

## Logging System (Winston)

### Features
- **Structured JSON Logging**: All logs are in JSON format for easy parsing
- **Multiple Transports**: Console (development) and File (all environments)
- **Log Rotation**: Automatic log file rotation (5MB max, 5 files kept)
- **Log Levels**: error, warn, info, debug

### Log Files
- `logs/error.log` - All errors (level: error)
- `logs/combined.log` - All logs (all levels)

### Usage in Code

```typescript
import { logInfo, logWarn, logError, logDebug } from './logger';

// Info logging
logInfo('User logged in', { userId: '123', email: 'user@example.com' });

// Warning logging
logWarn('Cache size exceeded threshold', { cacheSize: 51 });

// Error logging (also sent to Sentry in production)
logError(new Error('Database connection failed'), { 
  database: 'appwrite',
  endpoint: 'https://cloud.appwrite.io' 
});

// Debug logging (only in development)
logDebug('Processing request', { requestId: 'abc123' });
```

### Log Levels by Environment
- **Development**: `debug` and above (debug, info, warn, error)
- **Production**: `info` and above (info, warn, error)

## Error Monitoring (Sentry)

### Features
- **Real-time Error Tracking**: Instant notifications for production errors
- **Performance Monitoring**: Track slow endpoints and transactions
- **Context Capture**: Full error context including request data
- **Source Maps**: View exact line numbers in production errors
- **User Context**: Track which users experience errors

### Setup

1. **Create Sentry Account**
   - Sign up at [sentry.io](https://sentry.io)
   - Create a new Node.js project

2. **Get Your DSN**
   - Navigate to Project Settings → Client Keys (DSN)
   - Copy your DSN URL

3. **Configure Environment Variable**
   ```bash
   # Add to .env
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

4. **Sentry is automatically initialized in production** when `SENTRY_DSN` is set

### What Gets Sent to Sentry

1. **All Errors** logged via `logError()`
2. **Unhandled Exceptions** caught by Express error handler
3. **Performance Traces** for all API endpoints
4. **Context Data**: Request headers, user info, custom metadata

### Sentry Dashboard Features

- **Issues**: View all errors grouped by similarity
- **Performance**: Track slow endpoints and database queries
- **Releases**: Track errors by deployment version
- **Alerts**: Set up notifications for critical errors

## Health Check Endpoint

### Endpoint: `GET /health`

Returns server health status for monitoring tools.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T12:34:56.789Z",
  "uptime": 12345,
  "environment": "production"
}
```

### Usage with Monitoring Tools

**Railway**:
```yaml
healthcheckPath: /health
healthcheckTimeout: 5
```

**Docker Compose**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

**Kubernetes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
```

## Rate Limiting

### General API Rate Limit
- **Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All `/api/*` endpoints
- **Exempt**: `/health` endpoint

### Authentication Rate Limit
- **Limit**: 5 attempts per 15 minutes per IP
- **Applies to**: Login/authentication endpoints
- **Resets**: After successful authentication

### Response when rate limited
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

## Security Headers (Helmet)

### Implemented Headers

1. **Content Security Policy**: Prevents XSS attacks
2. **HSTS**: Forces HTTPS connections (production)
3. **X-Frame-Options**: Prevents clickjacking
4. **X-Content-Type-Options**: Prevents MIME sniffing
5. **Referrer-Policy**: Controls referrer information

## CORS Configuration

### Allowed Origins

**Development**:
- http://localhost:5000
- http://localhost:5173
- http://127.0.0.1:5000

**Production**:
- Configured via `PRODUCTION_URL` environment variable
- Add your production domain to allowed origins

### Configuration
```typescript
// Allow credentials (cookies, auth headers)
credentials: true

// Allowed HTTP methods
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']

// Allowed headers
allowedHeaders: ['Content-Type', 'Authorization']
```

## Environment Variables

### Required for Logging & Monitoring

```bash
# Error Monitoring (Production only)
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Production URL for CORS
PRODUCTION_URL=https://yourdomain.com

# Node Environment
NODE_ENV=production
```

## Monitoring Best Practices

### 1. Log Analysis
- Review `logs/error.log` daily in production
- Set up log aggregation (e.g., Logtail, DataDog)
- Archive old logs for compliance

### 2. Sentry Alerts
- Configure alerts for critical errors
- Set up Slack/email notifications
- Review weekly error trends

### 3. Health Check Monitoring
- Use UptimeRobot or Pingdom for uptime monitoring
- Monitor `/health` endpoint every 1-5 minutes
- Set up alerts for downtime

### 4. Performance Monitoring
- Monitor Sentry performance data
- Identify slow endpoints (>1s response time)
- Optimize database queries

## Log Rotation

Winston automatically rotates log files:
- **Max File Size**: 5MB
- **Max Files**: 5 (oldest deleted automatically)
- **Total Max Storage**: ~25MB

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `SENTRY_DSN` for error monitoring
- [ ] Set `PRODUCTION_URL` for CORS
- [ ] Create `logs/` directory with write permissions
- [ ] Configure health check monitoring
- [ ] Set up log aggregation service
- [ ] Configure Sentry alerts
- [ ] Test rate limiting behavior
- [ ] Verify HTTPS is enforced
- [ ] Review security headers

## Troubleshooting

### Logs Not Appearing

1. Check `logs/` directory exists and is writable
2. Verify Winston is initialized: check server startup logs
3. Check log level matches your needs (info vs debug)

### Sentry Not Receiving Errors

1. Verify `SENTRY_DSN` is set correctly
2. Check `NODE_ENV=production` (Sentry only in production)
3. Test by triggering a test error
4. Check Sentry project settings

### Health Check Failing

1. Verify server is running on correct port
2. Check firewall rules allow health check
3. Ensure `/health` endpoint is not behind authentication
4. Check rate limiting isn't blocking health checks

## Support Resources

- **Winston Documentation**: https://github.com/winstonjs/winston
- **Sentry Node.js Docs**: https://docs.sentry.io/platforms/node/
- **Helmet.js**: https://helmetjs.github.io/
- **Express Rate Limit**: https://github.com/express-rate-limit/express-rate-limit
