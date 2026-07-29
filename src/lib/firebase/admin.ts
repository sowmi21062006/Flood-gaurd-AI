import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "floodguard-ai-73f4d",
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Initialize with dummy project for build time
      initializeApp({ projectId: "demo-project" });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = getApps().length > 0 ? getAuth() : {} as any;
export const adminDb = getApps().length > 0 ? getFirestore() : {} as any;
