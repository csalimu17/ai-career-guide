import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Set Google Cloud Project ID explicitly for non-GCP environments
if (!process.env.GOOGLE_CLOUD_PROJECT && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  process.env.GOOGLE_CLOUD_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

function getCredentials() {
  const accountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (accountKey) {
    try {
      const parsed = JSON.parse(accountKey);
      if (!parsed.project_id && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        parsed.project_id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      }
      return admin.credential.cert(parsed);
    } catch (e) {
      console.warn("[Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }
  return admin.credential.applicationDefault();
}

if (getApps().length === 0) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-3704831244-a5638';
  initializeApp({
    credential: getCredentials(),
    projectId: projectId,
    storageBucket: `${projectId}.firebasestorage.app`,
  });
  getFirestore().settings({ ignoreUndefinedProperties: true });
}

export const db = getFirestore();
export const auth = admin.auth();
export const storage = admin.storage();
