# SafeHer MVP - Deployment Guide

**Last Updated**: February 11, 2026  
**Version**: 1.0

---

## 🚨 PRE-DEPLOYMENT SECURITY NOTICE

⚠️ **CRITICAL**: Multiple API keys were found exposed in `.env.example` files:
- Firebase API Key
- Google Maps API Key  
- Gemini API Key

**IMMEDIATE ACTIONS REQUIRED**:
1. ✅ **DONE**: Removed exposed keys from `.env.example` files
2. ⚠️ **TODO**: Revoke these keys in respective consoles:
   - Firebase Console: `AIzaSyCODNoiN0LhXoVnHw4CX0kgO32jO9meLiQ`
   - Google Maps API: `AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao`
   - Gemini API: `AIzaSyDLByUDGX1E48coR8xprnCWDXEuucT-bq0`
3. ⚠️ **TODO**: Generate new API keys
4. ⚠️ **TODO**: Configure API key restrictions (domain/IP whitelist)

**DO NOT DEPLOY until these steps are completed!**

---

## 📋 Deployment Checklist

### Phase 1: Revoke Compromised Keys ⚠️ URGENT

#### Firebase API Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (safeher-d5dcd)
3. Project Settings > General
4. Under "Your apps" > Web app
5. Click "Delete" on the exposed web app OR regenerate the key
6. Create a new web app with new API key
7. Add authorized domains for production

#### Google Maps/Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find key ending in `...Ismb1A3lLao`
3. Click "Delete" or "Restrict"
4. Create new API key
5. **Restrict the key**:
   - Application restrictions: HTTP referrers
   - Add your production domain: `https://your-domain.com/*`
   - API restrictions: Maps JavaScript API, Places API

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Find key ending in `...ucT-bq0`
3. Click "Delete key"
4. Create new API key
5. **Restrict the key**:
   - Add IP restrictions (your backend server IP)
   - Monitor usage quota

### Phase 2: Environment Setup

#### Backend Environment (.env)

Create `backend/.env` file (NOT committed to Git):

```bash
# Server Configuration
PORT=5000
NODE_ENV=production  # CRITICAL: Must be set to "production"!
FRONTEND_URL=https://your-production-domain.com

# Firebase Admin SDK
# Option 1: Service Account JSON (recommended)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Option 2: Service Account file path
# FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

FIREBASE_PROJECT_ID=your-project-id

# Email Service (Gmail SMTP)
# Generate app password: https://myaccount.google.com/apppasswords
GMAIL_USER=noreply@your-domain.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# AI Services (at least one required)
# NEW KEY - Generate after revoking old one!
GEMINI_API_KEY=your-new-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# Optional: OpenAI (alternative to Gemini)
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SMS Service (Twilio - Optional but recommended)
# Sign up: https://www.twilio.com/try-twilio
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_PHONE_NUMBER=+1234567890
```

**Security Notes**:
- Never commit `.env` files to Git
- Store securely (use secrets manager in production)
- Rotate keys every 90 days
- Monitor usage for anomalies

#### Frontend Environment (.env.production)

Create `.env.production` file (NOT committed to Git):

```bash
# Firebase Configuration (NEW KEYS after revoking old ones!)
VITE_FIREBASE_API_KEY=your-new-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Configuration
VITE_API_URL=https://api.your-domain.com/api

# Google Places API (Optional - NEW KEY after revoking old one!)
VITE_GOOGLE_PLACES_API_KEY=your-new-google-places-api-key

# Production Settings
VITE_DEMO_MODE=false  # MUST be false in production!
```

### Phase 3: Firebase Setup

#### 1. Firestore Database
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Verify rules are active
firebase firestore:rules:get
```

#### 2. Firebase Authentication
1. Enable Email/Password authentication
2. Configure authorized domains (add your production domain)
3. Set up email templates:
   - Email verification
   - Password reset
   - Email change
4. Configure password policies (minimum 8 characters)

#### 3. Firebase Storage (if using)
```bash
# Deploy storage rules
firebase deploy --only storage
```

### Phase 4: Build & Test Locally

#### Build Frontend
```bash
cd c:\Users\Niraj Karnawat\Desktop\SafeHer-MVP

# Install dependencies
npm install

# Create .env.production with production values
# (See Phase 2 above)

# Build for production
npm run build

# Test production build locally
npm run preview

# Verify:
# ✓ No console errors
# ✓ All features work
# ✓ Environment variables loaded correctly
# ✓ API calls go to production backend (or /api proxy)
```

#### Test Backend Locally with Production Config
```bash
cd backend

# Create .env with production values
# Set NODE_ENV=production

# Install production dependencies only
npm install --production

# Start server
npm start

# Verify:
# ✓ Server starts on specified PORT
# ✓ CORS only allows production domain
# ✓ Rate limiting is active (100 req/15min)
# ✓ Auth bypass is disabled
# ✓ Firebase Admin SDK connects successfully
# ✓ Email service works (send test email)
# ✓ AI service works (test chat endpoint)
```

### Phase 5: Choose Deployment Platform

#### Option A: Firebase Hosting (Recommended for MVP)

**Pros**: Easy setup, automatic HTTPS, global CDN, serverless
**Cons**: Limited backend customization

**Setup**:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# ✓ Hosting
# ✓ Firestore
# ✓ Functions (for backend)

# Configure firebase.json:
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "functions": {
    "source": "backend"
  }
}

# Deploy
firebase deploy

# Your app will be live at:
# https://your-project-id.web.app
# or https://your-project-id.firebaseapp.com
```

#### Option B: Vercel (Frontend) + Render (Backend)

**Pros**: Easy deployment, automatic Git integration
**Cons**: Separate services to manage

**Frontend (Vercel)**:
1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables (from `.env.production`)
5. Deploy

**Backend (Render)**:
1. Go to [render.com](https://render.com)
2. New > Web Service
3. Connect Git repository
4. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node 20+
5. Add environment variables (from `backend/.env`)
6. Deploy

#### Option C: Railway (Full Stack)

**Pros**: Simple, single platform for frontend + backend
**Cons**: Limited free tier

**Setup**:
1. Go to [railway.app](https://railway.app)
2. New Project > Deploy from GitHub
3. Add two services:
   - **Frontend**: Build command `npm run build`, Start command `npx serve dist`
   - **Backend**: Build command `cd backend && npm install`, Start command `cd backend && npm start`
4. Add environment variables to each service
5. Deploy

#### Option D: Custom VPS (DigitalOcean, AWS EC2, etc.)

**Pros**: Full control, cost-effective at scale
**Cons**: Requires server management, security maintenance

**Setup** (Ubuntu 22.04 LTS):
```bash
# 1. Connect to server
ssh root@your-server-ip

# 2. Update system
apt update && apt upgrade -y

# 3. Install Node.js (v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Install PM2 (process manager)
npm install -g pm2

# 5. Install Nginx (reverse proxy)
apt install -y nginx

# 6. Configure firewall
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable

# 7. Clone repository
git clone https://github.com/your-repo/safeher.git /var/www/safeher
cd /var/www/safeher

# 8. Setup backend
cd backend
npm install --production
# Create .env with production values
pm2 start src/server.js --name safeher-api -i max
pm2 save
pm2 startup

# 9. Build frontend
cd ..
npm install
npm run build

# 10. Configure Nginx
nano /etc/nginx/sites-available/safeher

# Nginx configuration:
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/safeher/dist;
    index index.html;
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
ln -s /etc/nginx/sites-available/safeher /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 11. Setup SSL (Let's Encrypt)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
# Follow prompts, auto-renews every 90 days

# 12. Setup automatic deployment
# Add webhook or use Git pull + PM2 reload
```

### Phase 6: Post-Deployment Verification

#### Critical Tests
```bash
✓ Homepage loads correctly
✓ User registration works
✓ User login works
✓ Password reset works
✓ Dashboard loads with user data
✓ SOS button activation works
✓ Emergency contacts receive emails/SMS
✓ Guardian matching works
✓ Live map loads and updates
✓ Danger zone reporting works
✓ Legal chat AI responses work
✓ FIR generation works
✓ User profile updates work
✓ Logout works
```

#### Mobile Testing
```bash
✓ Test on iPhone (Safari)
✓ Test on Android (Chrome)
✓ Test on tablet (iPad/Android)
✓ Verify responsive design
✓ Test touch interactions
✓ Verify no horizontal scrolling
✓ Test in portrait and landscape
```

#### Security Verification
```bash
✓ HTTPS is enforced (http:// redirects to https://)
✓ Authentication required for protected routes
✓ Users can't access other users' data
✓ Rate limiting works (test with rapid requests)
✓ CORS only allows your domain
✓ Firestore rules are active
✓ No console errors with sensitive data
✓ API keys are restricted (domain/IP whitelist)
```

#### Performance Testing
```bash
✓ Page load time < 3 seconds
✓ Lighthouse score > 90
✓ No JavaScript errors
✓ Service worker caching works
✓ Offline mode works (basic features)
✓ Images are optimized
✓ Bundle size is reasonable
```

### Phase 7: Monitoring Setup

#### Error Tracking
```bash
# Option 1: Sentry (recommended)
npm install @sentry/react @sentry/vite-plugin

# Add to src/main.jsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});

# Option 2: LogRocket
npm install logrocket

# Add to src/main.jsx:
import LogRocket from 'logrocket';
LogRocket.init('your-app-id');
```

#### Analytics
```bash
# Firebase Analytics (already integrated)
# Verify events are being tracked in Firebase Console

# Optional: Google Analytics 4
# Add GA4 tracking ID to Firebase Console
```

#### Uptime Monitoring
```bash
# Use one of:
- UptimeRobot (free tier: 50 monitors)
- Pingdom
- Statuspage.io
- Better Uptime

# Monitor:
- https://your-domain.com
- https://api.your-domain.com/health
```

### Phase 8: Documentation

#### For Users
```bash
✓ User guide/tutorial
✓ FAQ section
✓ Privacy policy
✓ Terms of service
✓ Contact/support information
```

#### For Developers
```bash
✓ README.md updated with production setup
✓ API documentation
✓ Environment variables documented
✓ Deployment process documented
✓ Incident response plan
```

---

## 🔐 Security Best Practices

### API Key Management
- ✅ Never commit API keys to Git
- ✅ Use separate keys for dev/staging/production
- ✅ Restrict keys by domain/IP
- ✅ Monitor usage and set quotas
- ✅ Rotate keys every 90 days
- ✅ Use secrets manager (AWS Secrets Manager, Google Secret Manager)

### Authentication
- ✅ Enforce strong passwords (min 8 characters)
- ✅ Enable email verification
- ✅ Implement password reset flow
- ✅ Consider 2FA for sensitive accounts
- ✅ Monitor failed login attempts

### Data Protection
- ✅ HTTPS everywhere (no mixed content)
- ✅ Firestore rules restrict access properly
- ✅ Validate all user inputs
- ✅ Sanitize data before display (XSS prevention)
- ✅ Regular backups (Firestore auto-backup)

### Monitoring
- ✅ Set up error alerts
- ✅ Monitor API usage and quotas
- ✅ Track security events (failed logins, etc.)
- ✅ Review logs regularly
- ✅ Set up uptime monitoring

---

## 🚨 Emergency Procedures

### If API Key is Compromised
1. Immediately revoke the key
2. Generate new key with restrictions
3. Update environment variables
4. Redeploy application
5. Monitor for unauthorized usage
6. Document incident

### If Database is Compromised
1. Revoke all active sessions
2. Change Firebase service account key
3. Review Firestore rules
4. Audit access logs
5. Notify affected users (if required by law)
6. Restore from backup if needed

### If Server is Down
1. Check uptime monitoring alerts
2. Check server logs
3. Verify environment variables are set
4. Check service status (PM2/Firebase/etc.)
5. Restart services if needed
6. If persistent, restore from backup or redeploy

---

## 📞 Support Resources

### Firebase
- Documentation: https://firebase.google.com/docs
- Support: https://firebase.google.com/support
- Status: https://status.firebase.google.com

### Deployment Platforms
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Railway: https://docs.railway.app

### Community
- GitHub Issues: [Your repo URL]
- Discord/Slack: [Your community link]
- Email: support@your-domain.com

---

## ✅ Final Checklist Before Going Live

```bash
□ All exposed API keys revoked
□ New API keys generated with restrictions
□ Environment variables configured correctly
□ NODE_ENV=production set in backend
□ VITE_DEMO_MODE=false in frontend
□ Firebase rules deployed
□ HTTPS working
□ All tests passing
□ Error tracking configured
□ Monitoring set up
□ Documentation updated
□ Backup strategy in place
□ Team trained on emergency procedures
```

---

**Status**: Ready to deploy after completing Phase 1 (revoking exposed keys)

**Next Steps**:
1. Complete Phase 1 immediately
2. Generate new restricted API keys
3. Configure production environment
4. Deploy to chosen platform
5. Verify all tests pass
6. Monitor for 24 hours

**Good luck with your deployment! 🚀**
