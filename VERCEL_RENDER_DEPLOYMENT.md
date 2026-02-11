# SafeHer MVP - Vercel + Render Deployment Guide

**Frontend**: Vercel  
**Backend**: Render  
**Date**: February 11, 2026

---

## 🚀 Quick Deployment Overview

**Total Time**: ~45-60 minutes  
**Cost**: Free tier for both platforms (for MVP)

### Architecture
```
User Browser
    ↓
Vercel (Frontend - React/Vite)
    ↓ API calls
Render (Backend - Node.js/Express)
    ↓
Firebase (Auth + Firestore)
```

---

## 📋 Pre-Deployment Checklist

### ⚠️ CRITICAL: Revoke Exposed API Keys First!

Before deploying, you MUST revoke these exposed keys:
- [ ] Firebase: `AIzaSyCODNoiN0LhXoVnHw4CX0kgO32jO9meLiQ`
- [ ] Google Maps: `AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao`
- [ ] Gemini: `AIzaSyDLByUDGX1E48coR8xprnCWDXEuucT-bq0`

**See detailed revocation steps in**: `DEPLOYMENT_GUIDE.md` Phase 1

### Required Accounts
- [ ] GitHub account (for code repository)
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Render account (sign up at [render.com](https://render.com))
- [ ] Firebase project with new API keys
- [ ] Gmail account for email service
- [ ] Gemini API key (new, restricted)

---

## 🔧 Part 1: Backend Deployment (Render)

### Step 1: Prepare Backend for Deployment

#### 1.1 Push Code to GitHub
```bash
# If not already done:
cd "c:\Users\Niraj Karnawat\Desktop\SafeHer-MVP"

# Initialize git (if not done)
git init
git add .
git commit -m "Prepare for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/safeher-mvp.git
git branch -M main
git push -u origin main
```

#### 1.2 Add package.json to backend root (if not exists)
Already exists at `backend/package.json` ✅

### Step 2: Create Render Web Service

#### 2.1 Sign Up / Log In
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

#### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `safeher-mvp`
3. Click **"Connect"**

#### 2.3 Configure Web Service

**Basic Settings**:
- **Name**: `safeher-api` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type**:
- **Free** (for MVP/testing)
- Upgrade to **Starter ($7/month)** for production

#### 2.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these (get new keys after revoking old ones):

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL (will update after Vercel deployment)
FRONTEND_URL=https://your-vercel-app.vercel.app

# Firebase Admin SDK
# Option 1: Paste entire service account JSON as one line
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...entire JSON...}

# OR Option 2: Use separate fields
FIREBASE_PROJECT_ID=your-project-id

# Email Service
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# AI Service (NEW KEY after revoking old one!)
GEMINI_API_KEY=your-new-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# Optional: OpenAI as alternative
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# Optional: Twilio for SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Important Notes**:
- For `FIREBASE_SERVICE_ACCOUNT`: Get from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- Copy the entire JSON and paste as a single line (Render handles it)
- For Gmail App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

#### 2.5 Deploy Backend

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for build and deployment
3. You'll get a URL like: `https://safeher-api.onrender.com`

#### 2.6 Test Backend

```bash
# Test health endpoint
curl https://safeher-api.onrender.com/health

# Should return:
{
  "status": "ok",
  "timestamp": "2026-02-11T...",
  "service": "SafeHer API"
}
```

#### 2.7 Note Your Backend URL
**Important**: Save this URL for frontend configuration:
```
https://safeher-api.onrender.com
```

---

## 🎨 Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Environment

#### 1.1 Create Production Environment File

Create `.env.production` in project root (NOT committed to Git):

```bash
# Firebase Configuration (NEW KEYS after revoking!)
VITE_FIREBASE_API_KEY=your-new-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API (use your Render URL from Part 1)
VITE_API_URL=https://safeher-api.onrender.com/api

# Google Places (NEW KEY after revoking!)
VITE_GOOGLE_PLACES_API_KEY=your-new-google-places-key

# Production Mode
VITE_DEMO_MODE=false
```

**Where to get these**:
- **Firebase Config**: Firebase Console → Project Settings → Your apps → Web app → Config
- **Backend URL**: From Render deployment (Part 1, Step 2.7)
- **Google Places**: Google Cloud Console → APIs & Credentials

### Step 2: Test Build Locally

```bash
# Build for production
npm run build

# Test production build
npm run preview

# Verify:
# - No console errors
# - Can register/login
# - API calls work (might need to run backend locally)
# - All features functional
```

### Step 3: Deploy to Vercel

#### 3.1 Sign Up / Log In
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

#### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your repository: `safeher-mvp`
3. Click **"Import"**

#### 3.3 Configure Project

**Framework Preset**: Vite (auto-detected) ✅

**Root Directory**: `./` (leave as root)

**Build Settings**:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3.4 Add Environment Variables

Click **"Environment Variables"** tab

**Add all variables from `.env.production`**:

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | your-new-firebase-api-key |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 123456789012 |
| `VITE_FIREBASE_APP_ID` | 1:xxx:web:xxx |
| `VITE_FIREBASE_MEASUREMENT_ID` | G-XXXXXXXXXX |
| `VITE_API_URL` | https://safeher-api.onrender.com/api |
| `VITE_GOOGLE_PLACES_API_KEY` | your-new-google-places-key |
| `VITE_DEMO_MODE` | false |

**Tip**: You can paste multiple variables at once in Vercel's UI

#### 3.5 Deploy Frontend

1. Click **"Deploy"**
2. Wait 2-3 minutes for build and deployment
3. You'll get a URL like: `https://safeher-mvp-xxxx.vercel.app`

#### 3.6 Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain: `safeher.app`
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

---

## 🔗 Part 3: Connect Frontend & Backend

### Step 1: Update Backend FRONTEND_URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your `safeher-api` service
3. Go to **Environment** tab
4. Edit `FRONTEND_URL` variable:
   ```
   https://safeher-mvp-xxxx.vercel.app
   ```
   (Use your actual Vercel URL)
5. Click **"Save Changes"**
6. Service will auto-redeploy (1-2 minutes)

### Step 2: Update Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add your Vercel domain: `safeher-mvp-xxxx.vercel.app`
6. If using custom domain, add that too: `safeher.app`

### Step 3: Restrict API Keys

#### Firebase API Key
1. Firebase Console → Project Settings → Your web app
2. Already restricted by authorized domains ✅

#### Google Places API Key
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click your Places API key
3. **Application restrictions** → **HTTP referrers**
4. Add:
   - `https://safeher-mvp-xxxx.vercel.app/*`
   - `https://*.vercel.app/*` (for preview deployments)
   - `https://safeher.app/*` (if using custom domain)
5. **API restrictions** → **Restrict key**
6. Select: Maps JavaScript API, Places API
7. Save

#### Gemini API Key (Backend)
1. [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click your key → Settings
3. Add IP restriction: Your Render service IP
4. Or use API quotas to limit usage
5. Save

---

## ✅ Part 4: Post-Deployment Testing

### 4.1 Smoke Tests

Test your deployed app at: `https://safeher-mvp-xxxx.vercel.app`

```bash
□ Homepage loads correctly
□ No console errors (check browser DevTools)
□ Can register new account
□ Receive email verification (check spam folder)
□ Can login with credentials
□ Dashboard loads with user data
□ Profile page works
```

### 4.2 Critical Feature Tests

```bash
□ SOS Button
  - Click and hold SOS button
  - Verify countdown starts
  - Check emergency contacts receive email/SMS
  - Verify incident created in Firestore
  
□ Live Tracking
  - Activate SOS
  - Open tracking link from email
  - Verify map shows location
  - Test "I'm Safe" button
  
□ Guardian System
  - View nearby guardians on dashboard
  - Verify guardian count updates
  
□ Danger Zones
  - View danger zones on map
  - Report new danger zone
  - Verify submission confirmation
  
□ Legal Chat
  - Ask a legal question
  - Verify AI response (should use Gemini)
  - Test FIR generation
  
□ Settings
  - Update profile information
  - Add/edit emergency contacts
  - Save and verify changes persist
```

### 4.3 Mobile Testing

Test on real devices:

```bash
□ iPhone (Safari)
  - Test all features above
  - Verify responsive design
  - Check touch interactions
  - Test in portrait/landscape
  
□ Android (Chrome)
  - Test all features above
  - Verify responsive design
  - Check touch interactions
  - Test in portrait/landscape
```

### 4.4 Security Tests

```bash
□ HTTPS enforced (URL shows lock icon)
□ Can't access other users' data
□ Logout works and clears session
□ Password reset email received
□ Rate limiting works (test rapid API calls)
□ CORS works (check Network tab for CORS errors)
□ Authentication required for protected routes
```

### 4.5 Performance Tests

```bash
□ Page load time < 3 seconds
□ Run Lighthouse audit (aim for 90+ score)
□ No JavaScript errors in console
□ Images load properly
□ Service worker caching works
```

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: "Network Error" or "Failed to fetch"

**Cause**: Frontend can't reach backend

**Solution**:
```bash
1. Check VITE_API_URL is correct in Vercel env vars
2. Check FRONTEND_URL is correct in Render env vars
3. Check Render backend is running (not sleeping)
4. Test backend directly: curl https://safeher-api.onrender.com/health
5. Check browser console for CORS errors
```

### Issue 2: CORS Error

**Symptoms**: Console shows "blocked by CORS policy"

**Solution**:
```bash
1. Verify FRONTEND_URL in Render matches your Vercel URL exactly
2. Include https:// in the URL
3. Don't include trailing slash
4. Redeploy Render service after changing
5. Check backend/src/server.js CORS configuration
```

### Issue 3: Firebase Authentication Not Working

**Symptoms**: Can't login, "auth/invalid-api-key"

**Solution**:
```bash
1. Verify all VITE_FIREBASE_* variables are correct
2. Check Firebase API key is not the old exposed one
3. Check Vercel domain is in Firebase authorized domains
4. Verify Firebase project is active
5. Check browser console for specific error
```

### Issue 4: Backend Keeps Sleeping (Render Free Tier)

**Symptoms**: First request after inactivity takes 30+ seconds

**Explanation**: Render free tier spins down after 15 min of inactivity

**Solutions**:
```bash
Option 1: Upgrade to Render Starter ($7/month) - stays always on
Option 2: Use UptimeRobot to ping every 10 minutes (free)
Option 3: Accept cold starts (15-30 seconds first request)
```

To setup UptimeRobot:
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add New Monitor → HTTP(s)
3. URL: `https://safeher-api.onrender.com/health`
4. Monitoring Interval: 10 minutes
5. Save

### Issue 5: Environment Variables Not Updating

**Symptoms**: Changes to env vars not taking effect

**Solution**:
```bash
Vercel:
1. Update env var in Vercel dashboard
2. Go to Deployments tab
3. Click "..." on latest deployment → Redeploy
4. Wait for build to complete

Render:
1. Update env var in Render dashboard
2. Service auto-redeploys (wait 1-2 min)
3. Check Logs tab for restart confirmation
```

### Issue 6: "Module not found" Errors

**Symptoms**: Build fails with missing module errors

**Solution**:
```bash
1. Check package.json includes all dependencies
2. Try deleting node_modules and reinstalling:
   rm -rf node_modules package-lock.json
   npm install
3. Commit and push changes
4. Trigger redeploy
```

### Issue 7: Emails Not Sending

**Symptoms**: Emergency contacts don't receive emails

**Solution**:
```bash
1. Verify GMAIL_USER and GMAIL_APP_PASSWORD are correct
2. Check Gmail hasn't blocked app password
3. Check Render logs for email errors:
   Dashboard → Service → Logs tab
4. Test email service directly (see backend logs)
5. Verify recipient email addresses are valid
```

### Issue 8: SMS Not Sending (Twilio)

**Symptoms**: Emergency contacts don't receive SMS

**Solution**:
```bash
1. Verify Twilio credentials are correct
2. Check Twilio account has credit
3. Verify phone numbers are in E.164 format: +12345678900
4. Check Twilio console for error messages
5. Note: Twilio trial accounts can only send to verified numbers
```

---

## 📊 Monitoring & Maintenance

### View Logs

**Render (Backend)**:
```bash
1. Go to Render Dashboard
2. Click your service
3. Logs tab
4. Set to "Live" for real-time logs
5. Use search/filter to find errors
```

**Vercel (Frontend)**:
```bash
1. Go to Vercel Dashboard
2. Click your project
3. Deployments tab → Click deployment
4. Runtime Logs tab
5. Note: Frontend errors mainly in browser console
```

### Set Up Error Tracking (Recommended)

**Sentry** (free tier available):
```bash
1. Sign up at sentry.io
2. Create new project (React + Node.js)
3. Follow integration instructions
4. Add DSN to environment variables
5. Errors will be tracked automatically
```

### Set Up Uptime Monitoring

**UptimeRobot** (free):
```bash
1. Sign up at uptimerobot.com
2. Add monitor for: https://safeher-mvp-xxxx.vercel.app
3. Add monitor for: https://safeher-api.onrender.com/health
4. Set alert email
5. Receive notifications if site goes down
```

### Monitor Costs

**Vercel**:
- Free tier: 100 GB bandwidth/month
- Check usage: Dashboard → Usage

**Render**:
- Free tier: 750 hours/month (enough for 1 service)
- Starter: $7/month for always-on service
- Check usage: Dashboard → Billing

**Firebase**:
- Free Spark plan: 50K reads/day, 20K writes/day
- Monitor: Firebase Console → Usage and billing
- Set budget alerts

---

## 🔄 Making Updates

### Update Frontend

```bash
# Make changes locally
git add .
git commit -m "Update: description of changes"
git push origin main

# Vercel auto-deploys on push!
# Check deployment status in Vercel dashboard
# Usually takes 2-3 minutes
```

### Update Backend

```bash
# Make changes locally
git add .
git commit -m "Update: description of changes"
git push origin main

# Render auto-deploys on push!
# Check deployment status in Render dashboard
# Usually takes 3-5 minutes
```

### Update Environment Variables

**Vercel**:
1. Dashboard → Project → Settings → Environment Variables
2. Edit variable
3. Redeploy: Deployments → Latest → Redeploy

**Render**:
1. Dashboard → Service → Environment
2. Edit variable
3. Auto-redeploys (1-2 minutes)

---

## 🎯 Production Optimization Checklist

### Before Official Launch

```bash
□ Custom domain configured (not .vercel.app)
□ SSL certificate active (HTTPS)
□ All API keys restricted (domain/IP)
□ Error tracking setup (Sentry)
□ Uptime monitoring active (UptimeRobot)
□ Firebase authorized domains updated
□ Privacy policy page added
□ Terms of service page added
□ Contact/support information added
□ Analytics setup (Google Analytics/Firebase)
□ Performance tested (Lighthouse score 90+)
□ Mobile tested on real devices
□ All console.logs removed from production code
□ Emergency procedures documented
□ Backup strategy in place
□ Team trained on deployment process
```

### Performance Improvements

**Frontend**:
```bash
□ Enable Vercel Analytics
□ Add image optimization (next/image or similar)
□ Implement code splitting
□ Add service worker caching
□ Compress images
□ Minimize bundle size
```

**Backend**:
```bash
□ Upgrade Render to Starter plan (no cold starts)
□ Add database indexes (Firestore)
□ Implement response caching
□ Add compression middleware
□ Monitor memory usage
```

---

## 💰 Pricing Overview

### Free Tier (Good for MVP/Testing)

**Vercel**:
- 100 GB bandwidth/month
- Unlimited deployments
- Custom domains
- Automatic HTTPS
- **Cost**: $0/month

**Render**:
- 750 hours/month
- Cold starts after 15 min inactivity
- 512 MB RAM, 0.1 CPU
- **Cost**: $0/month

**Firebase**:
- 50K reads/day, 20K writes/day
- 1 GB storage
- 10 GB/month bandwidth
- **Cost**: $0/month

**Total**: **$0/month** for MVP

### Production Tier (Recommended for Launch)

**Vercel Pro**:
- 1 TB bandwidth/month
- Team collaboration
- Analytics
- Password protection
- **Cost**: $20/month

**Render Starter**:
- Always-on (no cold starts)
- 512 MB RAM, 0.5 CPU
- Priority support
- **Cost**: $7/month

**Firebase Blaze** (pay-as-you-go):
- No daily limits
- Only pay for what you use
- First 50K reads/day free
- **Estimated**: $5-20/month

**Total**: **$32-47/month** for production

---

## 🎓 Next Steps

1. **Complete Phase 1**: Revoke exposed API keys ⚠️ CRITICAL
2. **Deploy Backend**: Follow Part 1 (Render)
3. **Deploy Frontend**: Follow Part 2 (Vercel)
4. **Connect Services**: Follow Part 3
5. **Test Everything**: Follow Part 4
6. **Set Up Monitoring**: Sentry + UptimeRobot
7. **Launch**: Share with users! 🚀

---

## 📞 Support

**Documentation**:
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Render: [render.com/docs](https://render.com/docs)
- Firebase: [firebase.google.com/docs](https://firebase.google.com/docs)

**Community**:
- Vercel Discord
- Render Community Forum
- Firebase Stack Overflow

**Issues**:
- Check logs first (Render/Vercel dashboards)
- Review troubleshooting section above
- Search platform documentation
- Contact platform support

---

## ✅ Final Checklist

```bash
□ All exposed API keys revoked
□ New restricted API keys generated
□ GitHub repository created and pushed
□ Render backend deployed and tested
□ Vercel frontend deployed and tested
□ Backend FRONTEND_URL updated
□ Firebase authorized domains updated
□ API keys restricted (domain/IP)
□ All features tested end-to-end
□ Mobile tested on iOS and Android
□ Error tracking setup
□ Uptime monitoring active
□ Custom domain configured (optional)
□ Team notified of deployment
```

---

**Deployment Time**: ~45-60 minutes  
**Status**: Ready to deploy after revoking exposed API keys  
**Next Step**: Start with Part 1 (Backend on Render)

Good luck with your deployment! 🚀
