# SafeHer MVP

## AI-Powered Women Safety & Legal Response Platform

SafeHer is a Progressive Web App (PWA) designed to provide women with immediate safety tools and legal assistance. Built for the National Tech Championship 2026.

![SafeHer](https://img.shields.io/badge/SafeHer-MVP-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-20-339933)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

---

## 📚 Quick Links

- **[Quick Start Guide](QUICK_START.md)** - Get running in < 5 minutes
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-launch validation
- **[Final Delivery Report](FINAL_DELIVERY.md)** - Complete project summary

---

## 🎯 Features

### Core Functionality
- **🚨 SOS Emergency Button** - One-tap emergency trigger with live location capture and 3-second countdown
- **📍 Live Location Tracking** - Real-time GPS tracking with Leaflet/OpenStreetMap integration
- **📧 Email Alerts** - Automatic emergency notifications to all configured contacts
- **📱 SMS Alerts** - SMS notifications to emergency contacts and nearby guardians (Twilio)
- **🛡️ Guardian Community** - Opt-in guardians, 2km radius discovery, and response flow
- **⚖️ AI Legal Assistant** - Chat interface with OpenAI/Gemini for legal information
- **📄 FIR Draft Generator** - AI-powered First Information Report draft creation
- **🔗 Shareable Tracking Links** - Public incident tracking for trusted contacts (no login required)

### Safety Features
- Location fallback (GPS → IP-based)
- Offline-capable SOS (PWA) with auto-sync
- 3-second countdown to prevent accidental triggers
- Guardian response counts on active incidents
- Duplicate SOS prevention
- Real-time responding guardian count
- Public tracking URLs for emergency contacts

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Firebase Auth** for authentication
- **PWA** with service workers

### Backend
- **Node.js** with Express
- **Firebase Admin SDK**
- **Nodemailer** for email alerts
- **OpenAI API** for legal assistant

### Database & Storage
- **Firebase Firestore** for data
- **Firebase Storage** for files

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Gmail account (for SMTP)
- OpenAI API key (optional, has fallback)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/safeher-mvp.git
cd safeher-mvp
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see below)

# Start development server
npm run dev
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see below)

# Start server
npm run dev
```

---

## ⚙️ Environment Variables

### Frontend (.env)
Create a `.env` file in the root directory:

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Configuration (Required)
VITE_API_URL=http://localhost:5000/api
```

### Backend (backend/.env)
Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase Admin Configuration (Required - Choose ONE option)
# Option 1: Service account JSON as single-line string
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"..."}'

# Option 2: Path to service account JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json

# Option 3: Google Application Credentials (alternative)
GOOGLE_APPLICATION_CREDENTIALS=./path/to/serviceAccountKey.json

# Email Configuration (Required for email alerts)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# SMS Configuration (Optional - Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# AI Configuration (At least ONE recommended)
# OpenAI (Recommended)
OPENAI_API_KEY=sk-proj-...

# Google Gemini (Alternative/Fallback)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# Anthropic Claude (Alternative/Fallback)
ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-haiku-4.5
```

---

## 🚀 Detailed Setup Guide

### 1. Firebase Setup

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `safeher-mvp`
4. Enable Google Analytics (optional)
5. Create project

#### B. Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Phone** (optional, requires reCAPTCHA)

#### C. Create Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Start in **Test mode** (for development)
4. Choose location closest to you
5. Deploy the firestore rules from `firestore.rules`

#### D. Get Frontend Config
1. Go to **Project Settings** (⚙️ icon)
2. Scroll to "Your apps"
3. Click **Web** icon (`</>`)
4. Register app: `SafeHer Web`
5. Copy the config object
6. Paste values into frontend `.env`

#### E. Get Backend Service Account
1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download JSON file
4. Place in `backend/` directory
5. Set path in backend `.env`

### 2. Gmail App Password Setup

1. Go to [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification (enable if not already)
3. App Passwords → Select app: **Mail**, device: **Other (SafeHer)**
4. Generate and copy the 16-character password
5. Add to backend `.env` as `GMAIL_APP_PASSWORD`

### 3. OpenAI API Key (Recommended for Legal AI)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up / Log in
3. Go to **API Keys**
4. Create new secret key
5. Copy and add to backend `.env` as `OPENAI_API_KEY`
6. **Note**: Requires billing setup (pay-as-you-go)

**Alternative**: Use Google Gemini (free tier available)

### 4. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 5. Run Development Servers

#### Option A: Run Both Servers Separately

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

#### Option B: Use Concurrently (recommended)
```bash
# Install concurrently globally (one time)
npm install -g concurrently

# Run both servers
npx concurrently "cd backend && npm run dev" "npm run dev"
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

---

## 🔑 Demo Credentials

```
Email: demo@safeher.app
Password: Demo@2025
```

**Demo Account Includes:**
- 3 pre-configured emergency contacts
- Sample incident history
- Guardian opt-in enabled
- Pre-loaded legal chat history

**Creating Demo Account:**
1. Register a new user with above credentials
2. Add emergency contacts from Profile page
3. Enable Guardian mode (optional)

---

## 📱 PWA Installation

### Mobile (iOS/Android)
1. Open app in Chrome/Safari
2. Tap "Add to Home Screen" when prompted
3. Or: Browser menu → "Install App" / "Add to Home Screen"

### Desktop (Chrome/Edge)
1. Click install icon (➕) in address bar
2. Or: Browser menu → "Install SafeHer..."

**Features After Installation:**
- Offline access to cached pages
- Push notifications (future feature)
- Standalone app experience
- Home screen icon

---

## 🎯 Feature Checklist

### ✅ Implemented Features
- [x] User authentication (email & phone)
- [x] User profile management
- [x] Emergency contacts CRUD
- [x] One-tap SOS trigger with 3-sec countdown
- [x] Live GPS location capture
- [x] Email alerts to emergency contacts
- [x] SMS alerts (requires Twilio setup)
- [x] Incident creation and tracking
- [x] Guardian community registration
- [x] Guardian location updates
- [x] Radius-based guardian discovery (2km)
- [x] Guardian alert notifications
- [x] Guardian accept/decline flow
- [x] Responding guardian count display
- [x] Live location tracking map (Leaflet)
- [x] Continuous location updates (5-sec throttle)
- [x] Public shareable tracking links
- [x] AI legal chat assistant
- [x] Legal information with disclaimers
- [x] FIR document generation
- [x] FIR copy/download functionality
- [x] Installable PWA
- [x] Offline-capable UI
- [x] Pending SOS auto-sync
- [x] Auth-protected backend APIs
- [x] Input validation & error handling
- [x] Rate limiting on critical endpoints
- [x] Loading states & feedback

### 🔄 Requires Configuration
- [ ] SMS alerts (Twilio account needed)
- [ ] Advanced AI legal responses (OpenAI/Gemini API)
- [ ] Production deployment
- [ ] Push notifications (future enhancement)

---

## 🗂️ Project Structure

```
safeher-mvp/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── Auth/          # Login, Register
│   │   ├── Home/          # Dashboard, SOS Button
│   │   ├── Track/         # Live Map
│   │   ├── Legal/         # Chat, FIR Generator
│   │   ├── Profile/       # User Profile, Contacts
│   │   └── Common/        # Navbar, Loading, etc.
│   ├── context/           # React Context (Auth)
│   ├── services/          # API, Firebase, Geolocation
│   └── utils/             # Helper functions
├── backend/               # Node.js backend
│   └── src/
│       ├── routes/        # API routes
│       ├── middleware/    # Auth middleware
│       ├── services/      # Email, OpenAI
│       └── config/        # Firebase config
├── public/                # Static assets, PWA
└── README.md
```

---

## 🔒 Security

- Firebase Authentication for user management
- JWT token verification on all protected routes
- Firestore security rules for data access control
- Rate limiting on SOS and API endpoints
- CORS configured for frontend domain only
- Environment variables for all secrets

---

## 📊 Database Schema

### Collections:
- `users` - User profiles and emergency contacts
- `incidents` - SOS incidents with location data
- `legalChats` - Chat history with AI assistant
- `firDrafts` - Generated FIR documents

---

## 🌐 Production Deployment

### Frontend Deployment (Vercel - Recommended)

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/safeher-mvp.git
git push -u origin main
```

2. **Deploy to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Configure:
  - **Framework Preset**: Vite
  - **Root Directory**: `./`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- Add all `VITE_*` environment variables
- Deploy!

3. **Update Backend CORS**
- Add your Vercel URL to `FRONTEND_URL` in backend `.env`

### Backend Deployment (Render - Recommended)

1. **Create Render Account**
- Go to [render.com](https://render.com)
- Sign up with GitHub

2. **Create Web Service**
- Click "New +" → "Web Service"
- Connect GitHub repository
- Configure:
  - **Name**: `safeher-backend`
  - **Region**: Choose closest
  - **Branch**: `main`
  - **Root Directory**: `backend`
  - **Runtime**: Node
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Instance Type**: Free

3. **Add Environment Variables**
- Add all backend env vars from your `.env`
- Set `NODE_ENV=production`
- Set `FRONTEND_URL` to your Vercel URL
- For Firebase service account, paste entire JSON as single line

4. **Deploy**
- Click "Create Web Service"
- Wait for deployment
- Copy the service URL (e.g., `https://safeher-backend.onrender.com`)

5. **Update Frontend**
- Update `VITE_API_URL` in Vercel to your Render backend URL
- Redeploy frontend

### Alternative: Railway Deployment

**Backend:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway up
```

**Environment Variables:** Add via Railway dashboard

---

## 🧪 Testing Guide

### Manual Testing Flow

#### 1. **Authentication Flow**
- [ ] Register new account with email/password
- [ ] Logout and login with same credentials
- [ ] Try "Forgot Password" feature
- [ ] Verify email validation
- [ ] Test password strength requirements

#### 2. **Profile Setup**
- [ ] Update profile name and phone
- [ ] Add emergency contact with valid email
- [ ] Add 2-3 more contacts
- [ ] Edit a contact
- [ ] Delete a contact
- [ ] Verify contacts persist after refresh

#### 3. **Guardian Mode**
- [ ] Enable Guardian mode
- [ ] Update guardian location
- [ ] Verify guardian status shows as "Registered"

#### 4. **SOS Trigger (CRITICAL)**
- [ ] Click SOS button
- [ ] Verify 3-second countdown shows
- [ ] Cancel during countdown (test)
- [ ] Trigger SOS again and let countdown complete
- [ ] Check for location permission prompt
- [ ] Verify "SOS activated" success message
- [ ] Check email inbox for emergency alerts
- [ ] Verify tracking link in email works
- [ ] Check that guardians within 2km receive alerts

#### 5. **Live Tracking**
- [ ] Open tracking page during active SOS
- [ ] Verify map shows current location
- [ ] Wait 5-10 seconds and check location updates
- [ ] Click "Share My Location" button
- [ ] Copy tracking link and open in incognito/private tab
- [ ] Verify public view shows incident without login
- [ ] Check "Responding guardians" count updates
- [ ] Click "I'm Safe - Resolve Alert"
- [ ] Verify status changes to "Resolved"

#### 6. **Guardian Response**
- [ ] Login as a different user (guardian account)
- [ ] Enable guardian mode
- [ ] Update location near SOS trigger location
- [ ] Trigger SOS from first account
- [ ] Check guardian account for alert
- [ ] Click "Accept" on alert
- [ ] Verify "Responding guardians: 1" shows on incident
- [ ] Test "Decline" button behavior

#### 7. **Legal Assistant**
- [ ] Navigate to Legal page
- [ ] Send a message: "How do I file an FIR?"
- [ ] Verify AI response appears (or fallback)
- [ ] Check for disclaimer at bottom of response
- [ ] Send another question
- [ ] Verify chat history persists

#### 8. **FIR Generator**
- [ ] Switch to FIR Generator tab
- [ ] Fill out incident form with test data
- [ ] Click "Generate FIR Draft"
- [ ] Verify formatted FIR appears
- [ ] Click "Copy to Clipboard"
- [ ] Paste elsewhere to verify
- [ ] Click "Download FIR" (if implemented)

#### 9. **PWA Features**
- [ ] Open app in Chrome on mobile
- [ ] Install as PWA (Add to Home Screen)
- [ ] Close browser and open from home screen
- [ ] Verify standalone appearance (no browser UI)
- [ ] Turn on Airplane mode
- [ ] Trigger SOS (should save pending)
- [ ] Turn off Airplane mode
- [ ] Verify pending SOS auto-sends

#### 10. **Error Handling**
- [ ] Try to trigger SOS without emergency contacts
- [ ] Verify helpful error message
- [ ] Try to login with wrong password
- [ ] Verify clear error feedback
- [ ] Test network failure scenarios
- [ ] Verify graceful degradation

### Automated Testing (Future Enhancement)

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Firebase Authentication Fails**
- Check Firebase console for enabled sign-in methods
- Verify API keys in `.env` match Firebase project
- Clear browser cache and localStorage
- Check browser console for specific errors

**2. Email Alerts Not Sending**
- Verify Gmail App Password (not regular password)
- Check 2-Step Verification is enabled on Google Account
- Look for error logs in backend terminal
- Test SMTP connection: `node -e "console.log(process.env.GMAIL_USER)"`

**3. SOS Button Not Working**
- Enable location permissions in browser
- Check browser console for geolocation errors
- Verify backend server is running
- Check network tab for failed API calls

**4. Guardian Notifications Not Received**
- Verify guardian has updated their location recently
- Check distance is within 2km radius
- Look for guardian notification errors in backend logs
- Verify email/SMS credentials are configured

**5. Location Not Updating on Map**
- Check browser location permissions
- Verify GPS is enabled on device
- Look for throttling (updates every 5 seconds)
- Check backend endpoint `/api/incidents/:id/location` is working

**6. PWA Not Installing**
- Use HTTPS (required for PWA except localhost)
- Check `manifest.json` is accessible
- Verify service worker registration in DevTools
- Try different browser (Chrome/Edge recommended)

**7. AI Legal Assistant Returns Error**
- Check OpenAI/Gemini API key is valid
- Verify API has available credits
- Check backend logs for specific error
- Fallback responses should still work without API

**8. Build Fails**
```bash
# Clear caches
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# Reinstall
npm install
cd backend && npm install

# Try build again
npm run build
```

**9. CORS Errors in Production**
- Verify `FRONTEND_URL` in backend `.env` matches deployed URL
- Check CORS configuration in `backend/src/server.js`
- Ensure both http/https protocols match

**10. Database Permission Denied**
- Deploy firestore.rules from project root
- Check Firestore Rules in Firebase Console
- Verify user is authenticated before database access

---

## 📊 Performance Optimization

### Frontend
- ✅ Code splitting with React.lazy()
- ✅ Service worker caching
- ✅ Image optimization
- ✅ Debounced API calls
- ✅ Memoized components (where needed)

### Backend
- ✅ Rate limiting on endpoints
- ✅ Throttled location updates (5s)
- ✅ Indexed Firestore queries
- ✅ Connection pooling
- ✅ Error handling & logging

---

## 📞 Emergency Numbers (India)

| Service | Number |
|---------|--------|
| Police | 100 |
| Women Helpline | 181 |
| Emergency | 112 |
| NCW | 7827-170-170 |

---

## ⚠️ Disclaimer

This application provides **general legal information only**, not legal advice. Always consult with a qualified lawyer for specific legal matters. The FIR generator creates draft documents that must be reviewed before submission to authorities.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 👥 Team

Built with ❤️ for National Tech Championship 2026

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- OpenAI for AI assistance
- All the brave women who inspired this project
