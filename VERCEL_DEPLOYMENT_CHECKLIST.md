# Vercel Deployment Checklist

## 🔥 Firebase Configuration

### Add Authorized Domain
1. Go to [Firebase Console](https://console.firebase.google.com/project/safeher-d5dcd)
2. Navigate to: **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain**
4. Add: `safe-her-topaz.vercel.app`
5. Click **Add** to save

This fixes: `The current domain is not authorized for OAuth operations`

---

## ⚙️ Vercel Environment Variables

### Required Variables

Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these variables (copy-paste exactly):

```bash
# Backend API URL (MUST include /api at the end!)
VITE_API_URL=https://safeher-c917.onrender.com/api

# Demo Mode
VITE_DEMO_MODE=true

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCODNoiN0LhXoVnHw4CX0kgO32jO9meLiQ
VITE_FIREBASE_AUTH_DOMAIN=safeher-d5dcd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=safeher-d5dcd
VITE_FIREBASE_STORAGE_BUCKET=safeher-d5dcd.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=799982203958
VITE_FIREBASE_APP_ID=1:799982203958:web:01ca61e0e05fd221ca9497
VITE_FIREBASE_MEASUREMENT_ID=G-H0P8Y93STT
```

**IMPORTANT:** 
- All variables must start with `VITE_` (Vite requirement)
- `VITE_API_URL` MUST end with `/api`

---

## 🚀 After Setting Variables

1. **Redeploy** the application:
   - Vercel Dashboard → Deployments → Three dots menu → Redeploy
   
2. **Verify Environment Variables** are loaded:
   - Open browser console on your deployed site
   - Type: `console.log(import.meta.env.VITE_API_URL)`
   - Should show: `https://safeher-c917.onrender.com/api`

---

## ✅ Testing Checklist

After redeployment, test these:

### 1. Backend Health Check
```bash
curl https://safeher-c917.onrender.com/api/health
```
Expected: `{"status":"ok",...}`

### 2. Frontend Console Errors
- Open: https://safe-her-topaz.vercel.app
- Open DevTools Console
- Should see NO:
  - ❌ 404 errors
  - ❌ CORS errors
  - ❌ Firebase authorization warnings

### 3. API Calls
Check Network tab:
- ✅ Calls should go to: `https://safeher-c917.onrender.com/api/*`
- ✅ NOT: `https://safeher-c917.onrender.com/*` (missing `/api`)

### 4. Firebase Auth
- Try to login/register
- Should work without OAuth domain errors

### 5. SOS Feature
- Trigger SOS
- Should successfully POST to `/api/sos/trigger`

---

## 🐛 Troubleshooting

### Issue: Still getting 404 errors
**Solution:** Environment variable not set correctly
- Check Vercel Dashboard → Settings → Environment Variables
- Verify `VITE_API_URL` = `https://safeher-c917.onrender.com/api`
- Redeploy after fixing

### Issue: Firebase OAuth errors persist  
**Solution:** Domain not added or not saved
- Verify in Firebase Console → Authentication → Settings → Authorized domains
- Should see `safe-her-topaz.vercel.app` in the list

### Issue: Environment variables showing as undefined
**Solution:** Need to redeploy
- Vercel only applies env vars on new builds
- Trigger a new deployment

---

## 📋 Current Deployment URLs

- **Frontend:** https://safe-her-topaz.vercel.app
- **Backend:** https://safeher-c917.onrender.com
- **API Base:** https://safeher-c917.onrender.com/api
- **Health Check:** https://safeher-c917.onrender.com/api/health

---

## 🎯 Quick Verification Commands

```bash
# 1. Test backend health
curl https://safeher-c917.onrender.com/api/health

# 2. Test CORS
curl -H "Origin: https://safe-her-topaz.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://safeher-c917.onrender.com/api/sos/trigger

# 3. View response headers
curl -I https://safeher-c917.onrender.com/api/health
```

Expected CORS headers:
```
access-control-allow-origin: https://safe-her-topaz.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
```

---

**Status After Following This Guide:** ✅ Production Ready
