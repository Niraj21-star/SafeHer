# 🔥 Firebase Backend Setup - URGENT

## ❌ Current Issue
Your backend is failing because Firebase Admin SDK credentials are not configured.

**Error:** `Could not load the default credentials`

## ✅ Quick Fix (5 minutes)

### Step 1: Download Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **safeher-d5dcd**
3. Click the **⚙️ gear icon** → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** (downloads a JSON file)
7. Save it as `serviceAccountKey.json` in the **backend/** folder

```
SafeHer-MVP/
├── backend/
│   ├── serviceAccountKey.json  ← Put the downloaded file here
│   ├── .env
│   └── src/
```

### Step 2: Update backend/.env

Open `backend/.env` and update:

```env
# Use this line (easier):
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# OR paste the entire JSON as one line (advanced):
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...entire JSON...}
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

## ⚠️ Important Security Notes

1. **NEVER commit `serviceAccountKey.json` to git** (it's in `.gitignore`)
2. **NEVER share this file publicly** - it has full admin access to your Firebase
3. For production, use environment variables, not files

## 🎯 Verification

After setup, you should see:
```
🚀 SafeHer API running on port 5000
📍 Health check: http://localhost:5000/health
```

Test guardian registration:
- Toggle "Become a Guardian" in Profile page
- Should work without 500 errors

## 🔧 Alternative: Use Existing Project

If you don't want to use Firebase Admin SDK features, you can modify the backend to use client SDK only. However, this limits functionality (no server-side auth verification).

## 📞 Quick Help

**Backend won't start?**
- Check `backend/.env` exists
- Verify `serviceAccountKey.json` path is correct
- Ensure JSON file is valid (open in editor to check)

**Still getting 500 errors?**
- Check backend terminal for detailed error messages
- Verify Firebase project ID matches frontend: `safeher-d5dcd`
- Ensure Firestore is enabled in Firebase Console

---
**Status**: 🔴 Backend credentials missing  
**Action**: Download service account key NOW to fix guardian registration
