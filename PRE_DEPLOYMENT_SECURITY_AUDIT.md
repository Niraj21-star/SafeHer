# SafeHer MVP - Pre-Deployment Security Audit

**Date**: February 11, 2026  
**Status**: 🔴 **CRITICAL ISSUES FOUND - DO NOT DEPLOY**

---

## 🚨 CRITICAL SECURITY ISSUES (Must Fix Before Deployment)

### 1. **EXPOSED API KEY IN .env.example** 🔴 **CRITICAL**
**Location**: `backend/.env.example` Line 25
```
GEMINI_API_KEY=AIzaSyDLByUDGX1E48coR8xprnCWDXEuucT-bq0
```
**Risk**: Public API key exposed in repository  
**Impact**: Unauthorized use, quota exhaustion, billing charges  
**Fix Required**: 
- ✅ Remove actual API key from .env.example
- ✅ Revoke the exposed key in Google Cloud Console
- ✅ Generate new API key
- ✅ Add to .gitignore (already done)
- ✅ Update .env.example with placeholder

### 2. **Development Bypass in Auth Middleware** 🔴 **CRITICAL**
**Location**: `backend/src/middleware/auth.js` Lines 9-23
```javascript
if (process.env.NODE_ENV !== 'production') {
    const devUser = req.headers['x-dev-user-id'];
    if (devUser) {
        req.userId = String(devUser);
        return next();
    }
    if (!authHeader) {
        req.userId = 'dev-user-001';
        return next();
    }
}
```
**Risk**: Authentication completely bypassed if NODE_ENV not set  
**Impact**: Unauthorized access to all protected endpoints  
**Fix Required**: Ensure NODE_ENV=production is ALWAYS set in production

### 3. **Console.log Statements in Production Code** ⚠️ **HIGH**
**Location**: Multiple backend files (20+ instances)
- `backend/src/routes/dangerZones.js`
- `backend/src/services/*.js`
- All services have debug/info logging

**Risk**: Sensitive data exposure in logs, performance impact  
**Fix Required**: Remove or use proper logging library with levels

### 4. **CORS Allowing All Origins in Development** ⚠️ **MEDIUM**
**Location**: `backend/src/server.js` Lines 26-31
```javascript
if (process.env.NODE_ENV === 'production') {
    app.use(cors({ origin: frontendUrl, credentials: true }));
} else {
    app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
}
```
**Risk**: If NODE_ENV not set correctly, allows all origins  
**Fix Required**: Fail-safe default to restricted CORS

### 5. **No HTTPS Enforcement** ⚠️ **HIGH**
**Risk**: Sensitive data transmitted over HTTP  
**Fix Required**: Add HTTPS redirect middleware, enforce secure connections

### 6. **No Input Validation/Sanitization** ⚠️ **MEDIUM**
**Risk**: Injection attacks, XSS, data corruption  
**Fix Required**: Add validation middleware (express-validator or joi)

### 7. **No Rate Limiting on Critical Endpoints** ⚠️ **MEDIUM**
**Location**: Auth endpoints have no specific rate limiting
**Risk**: Brute force attacks on login  
**Fix Required**: Add stricter rate limiting on auth routes

### 8. **Error Messages Expose Internal Details** ⚠️ **LOW**
**Location**: Multiple error handlers
**Risk**: Information disclosure
**Fix Required**: Generic error messages in production

---

## ✅ SECURITY STRENGTHS (Good Practices Found)

### Authentication & Authorization
- ✅ Firebase Admin SDK for token verification
- ✅ JWT token-based authentication
- ✅ Protected routes with middleware
- ✅ User-specific data access controls

### Firestore Security Rules
- ✅ User data isolated by userId
- ✅ Incidents only accessible by owner or if public tracking enabled
- ✅ Guardians properly secured with opt-in mechanism
- ✅ Default deny rule at the end

### Environment Variables
- ✅ .env files in .gitignore
- ✅ Environment variables for all sensitive configs
- ✅ Separate .env.example for documentation

### API Security
- ✅ Rate limiting implemented (15 min window)
- ✅ SOS-specific rate limiting (1 per 10 seconds in production)
- ✅ CORS configured (needs verification for production)
- ✅ Express security headers

### Dependencies
- ✅ Using maintained packages
- ✅ Firebase Admin SDK latest version
- ✅ No obvious vulnerable dependencies

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Environment Configuration

#### Backend Environment Variables
```bash
# REQUIRED for production:
□ PORT=5000
□ NODE_ENV=production  # ⚠️ CRITICAL - Must be set!
□ FRONTEND_URL=https://your-production-domain.com

# Firebase Admin SDK
□ FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
# OR
□ FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
□ FIREBASE_PROJECT_ID=your-project-id

# Email Service
□ GMAIL_USER=your-production-email@gmail.com
□ GMAIL_APP_PASSWORD=xxxxxxxxxxxx

# AI Services (at least one required)
□ GEMINI_API_KEY=your-new-key  # Generate NEW key, revoke old one
□ OPENAI_API_KEY=sk-xxxxxxxxxxxx  # Optional

# SMS Service (Optional but recommended)
□ TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
□ TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
□ TWILIO_PHONE_NUMBER=+1234567890
```

#### Frontend Environment Variables
```bash
# Create .env.production file:
□ VITE_FIREBASE_API_KEY=AIzaxxxxxxxxx
□ VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
□ VITE_FIREBASE_PROJECT_ID=your-project-id
□ VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
□ VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
□ VITE_FIREBASE_APP_ID=1:123456789:web:xxxx
□ VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX  # Optional
□ VITE_API_URL=https://api.your-domain.com/api
□ VITE_GOOGLE_PLACES_API_KEY=AIzaxxxxxxxxx  # Optional
□ VITE_DEMO_MODE=false  # ⚠️ Set to false in production!
```

### Security Hardening

#### 1. Remove Development Bypasses
```bash
□ Verify NODE_ENV=production is set
□ Test that auth bypass doesn't work
□ Verify CORS only allows production domain
□ Test rate limiting is active
```

#### 2. Revoke Exposed Secrets
```bash
□ Revoke Gemini API key: AIzaSyDLByUDGX1E48coR8xprnCWDXEuucT-bq0
□ Generate new Gemini API key in Google Cloud Console
□ Update production environment with new key
□ Verify old key is disabled
```

#### 3. Clean Up Code
```bash
□ Remove console.log statements (or use logger)
□ Remove debug comments
□ Remove unused imports
□ Remove commented-out code
```

#### 4. Add Security Headers
```bash
□ Helmet.js for security headers
□ HTTPS redirect middleware
□ Content Security Policy
□ X-Frame-Options: DENY
```

### Firebase Configuration

#### Firestore Rules
```bash
□ Deploy firestore.rules to production
□ Test rules with Firebase Emulator
□ Verify user isolation
□ Test public tracking access
□ Confirm default deny works
```

#### Firebase Hosting (if using)
```bash
□ Configure firebase.json
□ Set up custom domain
□ Enable HTTPS (automatic with Firebase)
□ Configure redirects
```

#### Firebase Authentication
```bash
□ Enable Email/Password provider
□ Set up password policies (strength, reset)
□ Configure authorized domains
□ Set up email templates (verification, password reset)
```

### Database Security

#### Firestore Indexes
```bash
□ Create composite indexes for queries
□ Test query performance
□ Monitor usage and quotas
```

#### Firestore Backup
```bash
□ Enable automatic backups
□ Test restore procedure
□ Document backup location
```

### API Security

#### Rate Limiting
```bash
□ Verify 100 req/15min global limit
□ Verify 1 req/10sec SOS limit
□ Test rate limit responses
□ Monitor rate limit hits
```

#### Authentication
```bash
□ Test token expiration
□ Verify token refresh works
□ Test invalid token handling
□ Test missing token handling
```

### Monitoring & Logging

#### Error Tracking
```bash
□ Set up error tracking (Sentry, LogRocket, etc.)
□ Configure error alerts
□ Test error reporting
□ Document error response codes
```

#### Performance Monitoring
```bash
□ Firebase Performance Monitoring
□ Google Analytics (optional)
□ API response time monitoring
□ Database query monitoring
```

#### Logging
```bash
□ Implement proper logging library (Winston, Pino)
□ Set log levels (error, warn, info, debug)
□ Configure log rotation
□ Set up log aggregation (CloudWatch, Loggly, etc.)
```

### Testing

#### Security Testing
```bash
□ OWASP ZAP scan
□ SQL injection testing (N/A - using Firestore)
□ XSS testing on all inputs
□ CSRF testing (if using sessions)
□ Authentication bypass testing
□ Authorization testing (user can't access other user's data)
```

#### Penetration Testing
```bash
□ Test with expired/invalid tokens
□ Test with missing authentication
□ Test rate limiting
□ Test CORS policy
□ Test input validation
```

#### Load Testing
```bash
□ Test SOS endpoint under load
□ Test concurrent user access
□ Test database query performance
□ Identify bottlenecks
```

### Deployment

#### Build Process
```bash
# Frontend
□ npm run build
□ Test production build locally (npm run preview)
□ Verify environment variables loaded
□ Check bundle size
□ Verify service worker works

# Backend
□ npm install --production
□ Remove devDependencies
□ Test with NODE_ENV=production locally
□ Verify all required env vars present
```

#### Deployment Platform

**Option 1: Firebase Hosting + Cloud Functions**
```bash
□ Initialize Firebase in project
□ Configure firebase.json
□ Deploy functions: firebase deploy --only functions
□ Deploy hosting: firebase deploy --only hosting
□ Test deployed app
```

**Option 2: Vercel + Render/Railway**
```bash
# Frontend (Vercel)
□ Connect GitHub repo
□ Configure build settings (npm run build)
□ Add environment variables
□ Deploy

# Backend (Render/Railway)
□ Create web service
□ Connect GitHub repo
□ Set build command: npm install
□ Set start command: npm start
□ Add environment variables
□ Deploy
```

**Option 3: Custom VPS (DigitalOcean, AWS EC2)**
```bash
□ Set up server (Ubuntu 22.04 LTS recommended)
□ Install Node.js (v20+)
□ Install PM2 (process manager)
□ Configure Nginx reverse proxy
□ Set up SSL certificate (Let's Encrypt)
□ Configure firewall (UFW)
□ Set up automatic deployments
```

#### Post-Deployment

```bash
□ Test all critical flows (login, SOS, map, legal chat)
□ Verify mobile responsiveness
□ Test on real devices (iOS, Android)
□ Monitor error logs for 24 hours
□ Check Firebase usage/quotas
□ Test emergency contact emails/SMS
□ Verify guardian matching works
□ Test danger zone reporting
```

---

## 🔒 SECURITY RECOMMENDATIONS

### Immediate (Before Deployment)

1. **Remove exposed Gemini API key from .env.example**
2. **Revoke exposed key and generate new one**
3. **Verify NODE_ENV=production in production**
4. **Add HTTPS enforcement middleware**
5. **Remove console.log statements**
6. **Add input validation (express-validator)**

### Short-term (Within 1 week)

1. **Implement proper logging (Winston)**
2. **Add security headers (Helmet.js)**
3. **Set up error tracking (Sentry)**
4. **Add stricter rate limiting on auth endpoints**
5. **Implement session management (if needed)**
6. **Set up monitoring and alerts**

### Medium-term (Within 1 month)

1. **Professional security audit**
2. **Penetration testing**
3. **Implement 2FA for user accounts**
4. **Add API versioning**
5. **Implement request signing**
6. **Set up DDoS protection (Cloudflare)**
7. **Implement data encryption at rest**

### Long-term (Ongoing)

1. **Regular security audits (quarterly)**
2. **Dependency updates (monthly)**
3. **Security training for team**
4. **Bug bounty program**
5. **Compliance certifications (if needed)**

---

## 📝 ENVIRONMENT FILE TEMPLATES

### Backend .env (Production)
```bash
# DO NOT COMMIT THIS FILE
# Template for production environment variables

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://safeher.app

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
FIREBASE_PROJECT_ID=your-project-id

# Email Service (Gmail)
GMAIL_USER=noreply@safeher.app
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# AI Services
GEMINI_API_KEY=NEW_KEY_GENERATE_AFTER_REVOKING_OLD_ONE
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend .env.production
```bash
# DO NOT COMMIT THIS FILE
# Vite production environment variables

VITE_FIREBASE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=safeher-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=safeher-prod
VITE_FIREBASE_STORAGE_BUCKET=safeher-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

VITE_API_URL=https://api.safeher.app/api
VITE_GOOGLE_PLACES_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx
VITE_DEMO_MODE=false
```

---

## 🚀 DEPLOYMENT COMMANDS

### Firebase Deployment
```bash
# Build frontend
npm run build

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy hosting
firebase deploy --only hosting

# Deploy functions (if using)
firebase deploy --only functions
```

### Vercel + Render Deployment
```bash
# Frontend (Vercel) - through Git push or:
vercel --prod

# Backend (Render) - through Git push or:
# Use Render dashboard to deploy
```

### PM2 (VPS) Deployment
```bash
# Backend
pm2 start src/server.js --name safeher-api -i max
pm2 save
pm2 startup

# View logs
pm2 logs safeher-api

# Monitor
pm2 monit
```

---

## ✅ FINAL VERIFICATION

Before going live, verify:

```bash
□ All environment variables set correctly
□ NODE_ENV=production verified
□ Exposed Gemini API key revoked
□ New API keys generated and working
□ HTTPS enforced
□ CORS configured for production domain only
□ Rate limiting working
□ Authentication working (no bypasses)
□ Firestore rules deployed
□ All critical flows tested
□ Error tracking configured
□ Monitoring set up
□ Backup strategy in place
□ Incident response plan documented
```

---

## 📞 SECURITY INCIDENT RESPONSE

If security incident occurs:

1. **Immediate**: Shut down affected service
2. **Assess**: Identify scope and impact
3. **Contain**: Revoke compromised credentials
4. **Investigate**: Review logs and access patterns
5. **Remediate**: Fix vulnerability
6. **Notify**: Inform affected users (if required by law)
7. **Document**: Write post-mortem report
8. **Prevent**: Implement measures to prevent recurrence

---

**Status**: 🔴 **DO NOT DEPLOY UNTIL CRITICAL ISSUES RESOLVED**

**Next Steps**:
1. Fix exposed Gemini API key in .env.example
2. Revoke old key, generate new one
3. Verify NODE_ENV handling
4. Remove console.logs
5. Test with production config locally
6. Then proceed with deployment

