# Quick Reference - Production Features

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Type check
npm run check

# Development
npm run dev

# Production build
npm run build

# Docker (production)
docker-compose up --build
```

---

## 📝 Logging

```typescript
import { logInfo, logWarn, logError, logDebug } from './logger';

// Information
logInfo('User logged in', { userId: '123' });

// Warning
logWarn('Cache size exceeded', { size: 51 });

// Error (auto-sent to Sentry in production)
logError(new Error('API failed'), { endpoint: '/api/users' });

// Debug (dev only)
logDebug('Processing request', { id: 'abc' });
```

**Log Files**:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs

---

## 🛡️ Security

### Rate Limiting
- **API**: 100 req/15min per IP (`/api/*`)
- **Auth**: 5 req/15min per IP (auth endpoints)
- **Exempt**: `/health` endpoint

### CORS Origins
**Dev**: localhost:5000, localhost:5173  
**Prod**: Set via `PRODUCTION_URL` env var

### Security Headers
✅ CSP, HSTS, X-Frame-Options, X-Content-Type-Options

---

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T...",
  "uptime": 12345,
  "environment": "production"
}
```

### Sentry (Error Monitoring)
- **Setup**: Add `SENTRY_DSN` to .env
- **Active**: Production only
- **Auto-reports**: All errors via `logError()`

---

## 🌍 Environment Variables

```bash
# Required
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key

# Production
NODE_ENV=production
PORT=5000
PRODUCTION_URL=https://yourdomain.com
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## 🐳 Docker

```bash
# Build and run
docker-compose up --build

# Check health
docker ps  # Should show "healthy"

# View logs
docker-compose logs -f
```

---

## 📚 Documentation

- **LOGGING_MONITORING.md** - Logging & monitoring guide
- **SECURITY_IMPLEMENTATION.md** - Security features
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **PRODUCTION_READINESS_FINAL_STATUS.md** - Complete status

---

## ✅ Pre-Deployment Checklist

- [ ] Run `npm run check` (TypeScript)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `SENTRY_DSN`
- [ ] Set `PRODUCTION_URL`
- [ ] Test health endpoint
- [ ] Verify logs directory exists
- [ ] Test Docker build
- [ ] Configure monitoring alerts
- [ ] Set up SSL/TLS

---

## 🔧 Common Commands

```bash
# Type check
npm run check

# Start dev server
npm run dev

# Build for production
npm run build

# Seed database
npm run seed:appwrite

# Docker production
docker-compose up --build

# View logs
tail -f logs/combined.log
```

---

## 🆘 Troubleshooting

**No logs appearing?**
- Check `logs/` directory exists
- Verify write permissions
- Check NODE_ENV setting

**Sentry not working?**
- Verify `SENTRY_DSN` is set
- Must be in `production` mode
- Check Sentry dashboard

**Rate limit errors?**
- Check IP address
- Verify health endpoint exempt
- Review rate limit settings in `server/index.ts`

**TypeScript errors?**
- Run `npm run check`
- Install missing types: `npm install --save-dev @types/package-name`

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: October 15, 2025
