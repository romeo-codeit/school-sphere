# 🚀 DEPLOYMENT GUIDE - OhmanFoundations

This guide will help you deploy your OhmanFoundations School Management System to production.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before deploying, ensure you have:

- [ ] Appwrite project set up (Cloud or Self-hosted)
- [ ] Appwrite database created with collections
- [ ] Environment variables configured
- [ ] Built the application successfully
- [ ] Tested all major features locally
- [ ] Domain name ready (optional but recommended)
- [ ] SSL certificate (most platforms provide free SSL)

---

## ⚙️ QUICK START - DEPLOY IN 5 STEPS

### Step 1: Set Up Appwrite

1. Go to [Appwrite Cloud](https://cloud.appwrite.io) or self-host Appwrite
2. Create a new project
3. Note your Project ID and Database ID
4. Generate an API Key with full permissions
5. Run the seed script to set up collections:
   ```bash
   npm run seed:appwrite
   ```

### Step 2: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Appwrite credentials:
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=your_database_id
   APPWRITE_API_KEY=your_api_key
   NODE_ENV=production
   ```

### Step 3: Build the Application

```bash
npm install
npm run build
```

This creates:
- `dist/public/` - Frontend build
- `dist/index.js` - Backend build

### Step 4: Test Production Build Locally

```bash
npm start
```

Visit `http://localhost:5000` and test:
- Login/Signup
- Dashboard access
- Exam taking
- File uploads
- All major features

### Step 5: Deploy to Your Platform

Choose one of the deployment methods below based on your preference.

---

## 🌐 DEPLOYMENT OPTIONS

### Option A: Railway (Recommended - Easiest)

**Best for:** Full-stack apps with database needs

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Add environment variables:**
   ```bash
   railway variables set VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   railway variables set VITE_APPWRITE_PROJECT_ID=your_project_id
   railway variables set VITE_APPWRITE_DATABASE_ID=your_database_id
   railway variables set APPWRITE_API_KEY=your_api_key
   railway variables set NODE_ENV=production
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get your URL:**
   ```bash
   railway domain
   ```

**Cost:** Free tier available, $5/month for production apps

---

### Option B: Vercel (Frontend) + Railway/Render (Backend)

**Best for:** Separated frontend and backend

#### Frontend (Vercel):

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json`:**
   ```json
   {
     "buildCommand": "npm run build:client",
     "outputDirectory": "dist/public",
     "installCommand": "npm install",
     "framework": null,
     "env": {
       "VITE_APPWRITE_ENDPOINT": "@appwrite_endpoint",
       "VITE_APPWRITE_PROJECT_ID": "@appwrite_project_id",
       "VITE_APPWRITE_DATABASE_ID": "@appwrite_database_id"
     }
   }
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

#### Backend (Railway):
Follow Option A steps but only deploy backend.

---

### Option C: Docker Deployment

**Best for:** Self-hosting, VPS, or cloud platforms

1. **Create `Dockerfile`:**
   ```dockerfile
   # Build stage
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   # Production stage
   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./
   EXPOSE 5000
   ENV NODE_ENV=production
   CMD ["npm", "start"]
   ```

2. **Create `.dockerignore`:**
   ```
   node_modules
   .git
   .env
   dist
   *.md
   .local
   ```

3. **Build image:**
   ```bash
   docker build -t ohmanfoundations .
   ```

4. **Run container:**
   ```bash
   docker run -p 5000:5000 \
     -e VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 \
     -e VITE_APPWRITE_PROJECT_ID=your_project_id \
     -e VITE_APPWRITE_DATABASE_ID=your_database_id \
     -e APPWRITE_API_KEY=your_api_key \
     -e NODE_ENV=production \
     ohmanfoundations
   ```

5. **Or use Docker Compose:**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env
       restart: unless-stopped
   ```

   ```bash
   docker-compose up -d
   ```

---

### Option D: DigitalOcean App Platform

**Best for:** Simple deployment with scalability

1. **Connect GitHub repo** to DigitalOcean
2. **Configure build command:** `npm run build`
3. **Configure run command:** `npm start`
4. **Add environment variables** in DO console
5. **Deploy**

**Cost:** Starting at $5/month

---

### Option E: AWS/Azure/GCP

**Best for:** Enterprise deployments

#### AWS Elastic Beanstalk:
1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create production`
4. Deploy: `eb deploy`

#### Azure App Service:
1. Install Azure CLI: `npm install -g azure-cli`
2. Login: `az login`
3. Create app: `az webapp create`
4. Deploy: `az webapp deployment source config-zip`

---

## 🔒 SECURITY SETUP (CRITICAL!)

### 1. Configure Appwrite Security

**In Appwrite Console:**
1. Go to **Settings** > **Platforms**
2. Add your production domain(s):
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

3. Go to **Settings** > **Security**
4. Configure CORS:
   - Add production domains
   - Remove localhost in production

5. Set up rate limiting:
   - API calls: 1000 per hour
   - Authentication: 5 attempts per 15 minutes

### 2. SSL Certificate

Most platforms (Railway, Vercel, DigitalOcean) provide **free SSL automatically**.

For custom domains:
1. Point your domain to the platform's servers
2. Platform will auto-generate SSL certificate
3. Force HTTPS redirect

### 3. Environment Variables

**NEVER commit `.env` file to Git!**

Make sure `.gitignore` includes:
```
.env
.env.local
.env.production
```

---

## 📊 POST-DEPLOYMENT CHECKLIST

After deployment, verify:

### Functional Testing:
- [ ] Homepage loads correctly
- [ ] Login works with valid credentials
- [ ] Signup creates new accounts
- [ ] Dashboard displays for each role
- [ ] Students can be added/edited
- [ ] Exams can be taken
- [ ] File uploads work
- [ ] Payments can be recorded
- [ ] Mobile responsive design works

### Security Testing:
- [ ] HTTPS is enforced
- [ ] Unauthorized routes are protected
- [ ] Rate limiting works
- [ ] CORS is properly configured
- [ ] File upload size limits work

### Performance Testing:
- [ ] Page load time < 3 seconds
- [ ] Images load properly
- [ ] API responses < 500ms
- [ ] No console errors in browser

---

## 🔍 MONITORING & MAINTENANCE

### Set Up Monitoring:

1. **Uptime Monitoring:**
   - Use [UptimeRobot](https://uptimerobot.com) (Free)
   - Monitor your `/health` endpoint every 5 minutes

2. **Error Tracking:**
   - Set up [Sentry](https://sentry.io) (Free tier)
   - Install: `npm install @sentry/react @sentry/node`

3. **Analytics:**
   - Google Analytics
   - Plausible Analytics (privacy-focused)

### Regular Maintenance:

- **Weekly:** Check error logs
- **Monthly:** Update dependencies: `npm update`
- **Quarterly:** Security audit: `npm audit`
- **Annually:** Review and optimize performance

---

## 🐛 TROUBLESHOOTING

### "Build fails"
**Solution:** Run `npm run check` to find TypeScript errors

### "Cannot connect to Appwrite"
**Solution:** 
1. Verify `VITE_APPWRITE_ENDPOINT` is correct
2. Check Appwrite is running/accessible
3. Verify CORS settings in Appwrite

### "401 Unauthorized errors"
**Solution:**
1. Check API key has correct permissions
2. Verify JWT token is being sent correctly
3. Check Appwrite session hasn't expired

### "Files not uploading"
**Solution:**
1. Check Appwrite Storage bucket exists
2. Verify bucket permissions
3. Check file size limits

### "Slow performance"
**Solution:**
1. Enable caching in Appwrite
2. Optimize images
3. Use CDN for static assets
4. Consider Redis for server caching

---

## 📞 SUPPORT

If you encounter issues:

1. Check [Appwrite Documentation](https://appwrite.io/docs)
2. Review application logs
3. Check browser console for errors
4. Verify all environment variables are set

---

## 🎉 CONGRATULATIONS!

Your OhmanFoundations School Management System is now live! 🚀

**Next Steps:**
1. Set up automated backups
2. Configure monitoring alerts
3. Document your deployment process
4. Train users on the system
5. Gather feedback and iterate

---

**Last Updated:** October 15, 2025  
**Version:** 1.0.0
