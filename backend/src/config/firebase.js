import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Initialize Firebase Admin
// In production, use a service account key file
// For development, you can use the emulator or demo project

let app;

try {
    // Check if already initialized
    app = admin.app();
} catch (error) {
    // Initialize with service account or demo credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const serviceAccountPath =
            process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const raw = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(raw);
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        });
    } else {
        // Demo/development initialization
        app = admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'safeher-mvp-demo',
        });
    }
}

export const db = admin.firestore();
export const auth = admin.auth();

export default app;
