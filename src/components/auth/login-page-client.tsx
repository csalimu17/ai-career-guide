'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail, UserCircle } from "lucide-react";
import { collection, doc, limit, query } from "firebase/firestore";
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import {
  initiateAnonymousSignIn,
  initiateEmailSignIn,
  initiateGoogleSignIn,
  consumeGoogleRedirectResult,
} from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPostAuthDestination, upsertUserProfile } from "@/lib/user-profile";
import { clearAuthIntent, getIntentDestination, loadAuthIntent, readAuthIntent, saveAuthIntent } from "@/lib/auth-intent";

export default function LoginPageClient() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading, uid } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !uid) return null;
    return doc(db, "users", uid);
  }, [db, uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !uid) return null;
    return query(collection(db, "users", uid, "resumes"), limit(1));
  }, [db, uid]);

  const { data: resumes, isLoading: isResumesLoading } = useCollection(resumesQuery);

  useEffect(() => {
    if (searchParams) saveAuthIntent(readAuthIntent(searchParams));
  }, [searchParams]);

  useEffect(() => {
    // Wait for the Firestore profile + a quick existence check on resumes
    // before redirecting, so we can honour onboardingComplete and skip
    // the visible dashboard→onboarding bounce for fresh users.
    if (!user || isUserLoading || isProfileLoading || isResumesLoading) return;

    const hasWorkspaceData = Array.isArray(resumes) && resumes.length > 0;
    const destination = getIntentDestination(loadAuthIntent(), hasWorkspaceData);
    if (destination) {
      clearAuthIntent();
      router.replace(destination);
      return;
    }

    router.replace(getPostAuthDestination(profile as any, hasWorkspaceData));
  }, [user, isUserLoading, isProfileLoading, isResumesLoading, profile, resumes, router]);

  // If the user just returned from a Google redirect sign-in (mobile or
  // popup-blocked fallback), pick up the credential and upsert their
  // Firestore profile. No-op when there's no pending redirect.
  useEffect(() => {
    if (!auth || !db) return;
    let cancelled = false;
    consumeGoogleRedirectResult(auth, db).catch((error: any) => {
      if (cancelled) return;
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: error.message || "We couldn't complete Google authentication right now.",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [auth, db, toast]);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);

    try {
      await initiateEmailSignIn(auth, email, password);
      // On success the useEffect above redirects once profile + resumes load.
      // Leave isLoggingIn=true so the button stays in its loading state
      // through the navigation.
    } catch {
      // initiateEmailSignIn already showed a friendly toast for known
      // Firebase error codes; don't double-toast here.
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);

    try {
      const result = await initiateGoogleSignIn(auth);
      if (result?.user) {
        const [googleFirstName = "", googleLastName = ""] = result.user.displayName?.split(" ") || [];
        await upsertUserProfile({
          db,
          uid: result.user.uid,
          email: result.user.email,
          firstName: googleFirstName,
          lastName: googleLastName,
          photoURL: result.user.photoURL,
          emailVerified: result.user.emailVerified,
        });
        // useEffect handles routing; keep isLoggingIn=true through redirect.
      } else {
        // User closed the popup or we kicked off a redirect flow.
        setIsLoggingIn(false);
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      // initiateGoogleSignIn toasts most errors itself; surface the one it
      // intentionally throws clean (unauthorized-domain) so the user sees a
      // helpful message rather than nothing.
      if (error?.code === "auth/unauthorized-domain") {
        toast({
          variant: "destructive",
          title: "Domain not authorized",
          description: error.message,
        });
      }
    }
  };


  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      description="CV edits, ATS insights, job tracking, and billing stay in sync here, so you can pick up where you left off."
      supportingTitle="Step back into a sharper job search flow."
      supportingCopy="Everything in AI Career Guide is designed to help you move from CV draft to interview pipeline with less friction and more confidence."
      highlights={[
        {
          title: "CV edits stay synced",
          description: "Open your latest CV, jump into the editor, and continue from the last autosaved state.",
        },
        {
          title: "ATS guidance is ready",
          description: "Return to recent scans, apply recommendations, and improve match quality without repeating setup work.",
        },
        {
          title: "Billing and settings are one click away",
          description: "Manage plans, invoices, and account security from the same workspace when you need it.",
        },
      ]}
      footer={
        <p>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create your free account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="name@example.com"
              className="h-12 pl-11"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Password
            </Label>
            <Link href="/forgot-password" className="text-xs font-semibold text-primary transition-opacity hover:underline hover:opacity-80">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-12 pl-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="h-12 w-full" disabled={isLoggingIn}>
          {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          {!isLoggingIn && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="bg-card px-3">Or continue with</span>
        </div>
      </div>

      <div className="space-y-3">
        <GoogleSignInButton onClick={handleGoogleLogin} isLoading={isLoggingIn} />
      </div>
    </AuthShell>
  );
}
