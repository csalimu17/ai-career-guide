'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

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

    // Only show toast if the user didn't intentionally close the popup
    if (error.code === 'auth/unauthorized-domain') {
      toast({
        variant: 'destructive',
        title: 'Domain Not Authorized',
        description: 'Please add this domain to the Authorized Domains list in your Firebase Console.',
      });
    } else if (error.code !== 'auth/popup-closed-by-user') {
      toast({
        variant: 'destructive',
        title: 'Google Login Error',
        description: error.message,
      });
      throw error;
    }
    return null;
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
