'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { upsertUserProfile } from '@/lib/user-profile';

function shouldUseRedirectForGoogleSignIn() {
  if (typeof window === 'undefined') return false;

  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

/** 
 * Initiate anonymous sign-in (non-blocking). 
 * Returns the promise to allow components to manage local state (e.g. loading spinners).
 */
export function initiateAnonymousSignIn(authInstance: Auth) {
  return signInAnonymously(authInstance).catch((error) => {
    toast({
      variant: 'destructive',
      title: 'Sign In Error',
      description: error.message,
    });
    throw error;
  });
} 

/** 
 * Initiate email/password sign-up (non-blocking). 
 * Returns the promise to allow components to manage local state.
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  return createUserWithEmailAndPassword(authInstance, email, password).catch(( error) => {
    toast({
      variant: 'destructive',
      title: 'Sign Up Error',
      description: error.message,
    });
    throw error;
  });
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    let message = "An unexpected error occurred during login.";
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = "Invalid email or password. Please check your credentials and try again.";
        break;
      case 'auth/user-disabled':
        message = "This account has been disabled. Please contact support.";
        break;
      case 'auth/too-many-requests':
        message = "Too many failed login attempts. Please try again later.";
        break;
      default:
        message = error.message;
    }

    toast({
      variant: 'destructive',
      title: 'Login Failed',
      description: message,
    });
    throw error;
  });
}

/** 
 * Initiate Google sign-in (non-blocking). 
 * Returns null if user closed the popup, otherwise returns the user credential.
 */
export async function initiateGoogleSignIn(authInstance: Auth) {
  const provider = new GoogleAuthProvider();
  try {
    if (shouldUseRedirectForGoogleSignIn()) {
      await signInWithRedirect(authInstance, provider);
      return null;
    }

    return await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      await signInWithRedirect(authInstance, provider);
      return null;
    }

    // Surface unauthorized-domain through the normal error path so the
    // caller can reset its loading state and we don't double-toast.
    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      const friendly = new Error(
        `Domain "${currentHost}" is not authorized. In Firebase Console → Authentication → Settings → Authorized domains, click "Add domain" and paste: ${currentHost}`
      );
      (friendly as any).code = 'auth/unauthorized-domain';
      throw friendly;
    }

    // User intentionally closed the popup — silent.
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      return null;
    }

    toast({
      variant: 'destructive',
      title: 'Google Login Error',
      description: error.message,
    });
    throw error;
  }
}

/**
 * Consume the result of a `signInWithRedirect` round-trip. Call this once
 * on auth-page mount: if the user landed here from a Google redirect, we
 * pull the credential out and upsert their Firestore profile so the rest
 * of the app can rely on `users/{uid}` existing.
 *
 * Returns `null` when there is no pending redirect (the common case).
 */
export async function consumeGoogleRedirectResult(authInstance: Auth, db: Firestore) {
  try {
    const result = await getRedirectResult(authInstance);
    if (!result?.user) return null;

    const [firstName = '', lastName = ''] = result.user.displayName?.split(' ') || [];
    await upsertUserProfile({
      db,
      uid: result.user.uid,
      email: result.user.email,
      firstName,
      lastName,
      photoURL: result.user.photoURL,
      emailVerified: result.user.emailVerified,
    });
    return result;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      const friendly = new Error(
        'This domain is not authorized for Google sign-in. Add it under Firebase Console → Authentication → Settings → Authorized Domains.'
      );
      (friendly as any).code = 'auth/unauthorized-domain';
      throw friendly;
    }
    throw error;
  }
}

/** 
 * Initiate sign-out (non-blocking). 
 *  Returns the promise to allow components to manage local state.
 */
export function initiateSignOut(authInstance: Auth) {
  return signOut(authInstance).catch((error) => {
    toast({
      variant: 'destructive',
      title: 'Sign Out Error',
      description: error.message,
     });
    throw error;
  });
}
