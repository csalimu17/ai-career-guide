'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Return empty SDKs on the server to prevent SSR crashes.
  // Next.js will re-run this on the client.
  // SSR Safety: Return dummy objects that won't throw on property access
  if (typeof window === 'undefined') {
    const createSSRPlaceholder = (): any => {
      const fn = () => ({});
      return new Proxy(fn, {
        get: (target, prop) => {
          if (prop === 'then') return undefined; // Non-thenable
          return createSSRPlaceholder();
        },
      });
    };

    return {
      firebaseApp: createSSRPlaceholder(),
      auth: createSSRPlaceholder(),
      firestore: createSSRPlaceholder(),
      storage: createSSRPlaceholder(),
    };
  }

  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp, firebaseConfig.storageBucket)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
