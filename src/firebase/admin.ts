import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getCredentials() {
  const accountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (accountKey) {
    try {
      return admin.credential.cert(JSON.parse(accountKey));
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to applicationDefault");
    }
  }
  return admin.credential.applicationDefault();
}

if (getApps().length === 0) {
  initializeApp({
    credential: getCredentials(),
    storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT}.firebasestorage.app`,
  });
  getFirestore().settings({ ignoreUndefinedProperties: true });
}

export const db = getFirestore();
export const auth = admin.auth();
export const storage = admin.storage();
