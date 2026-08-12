'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail, User } from "lucide-react";
import { collection, doc, limit, query } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { initiateEmailSignUp, initiateGoogleSignIn, consumeGoogleRedirectResult } from "@/firebase/non-blocking-login";
import { toast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPostAuthDestination, upsertUserProfile } from "@/lib/user-profile";
import { clearAuthIntent, getIntentDestination, loadAuthIntent, readAuthIntent, saveAuthIntent } from "@/lib/auth-intent";
import { trackMarketingEvent } from "@/lib/marketing-analytics";

export default function SignupPageClient() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading, uid } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

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
    // Wait for the Firestore profile + resumes existence check before
    // redirecting — for Google sign-in this might be a returning user, so
    // honour their onboardingComplete state instead of always hitting
    // /dashboard and bouncing.
    if (!user || isUserLoading || isProfileLoading || isResumesLoading) return;

    const hasWorkspaceData = Array.isArray(resumes) && resumes.length > 0;
    const currentIntent = searchParams ? { ...loadAuthIntent(), ...readAuthIntent(searchParams) } : loadAuthIntent();
    const destination = getIntentDestination(currentIntent, hasWorkspaceData);
    if (destination) {
      clearAuthIntent();
      router.replace(destination);
      return;
    }

    router.replace(getPostAuthDestination(profile as any, hasWorkspaceData));
  }, [user, isUserLoading, isProfileLoading, isResumesLoading, profile, resumes, router, searchParams]);

  // Consume any pending Google redirect (mobile / popup-blocked fallback)
  // so the Firestore user profile is created before the dashboard loads.
  useEffect(() => {
    if (!auth || !db) return;
    let cancelled = false;
    consumeGoogleRedirectResult(auth, db).catch((error: any) => {
      if (cancelled) return;
      toast({
        variant: "destructive",
        title: "Google sign-up failed",
        description: error.message || "We couldn't finish Google account setup right now.",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [auth, db]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    trackMarketingEvent("signup_start", { method: "email" });

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Use at least 8 characters so your account is properly protected.",
      });
      return;
    }

    setIsSigningUp(true);
    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);
      if (userCredential.user) {
        // Kick off email verification in the background. Firebase doesn't
        // do this automatically on signup; without it, users can't reach
        // paid checkout (which now enforces email_verified) until they
        // separately trigger a resend from settings. Failures here are
        // intentionally swallowed — the user can always trigger a resend
        // from the settings/billing flow.
        sendEmailVerification(userCredential.user).catch((err) => {
          console.warn("sendEmailVerification on signup failed:", err);
        });

        await upsertUserProfile({
          db,
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          firstName,
          lastName,
          photoURL: userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
        });
        // Brand-new email signup → straight to onboarding. The useEffect
        // above would also land us here once profile loads, but pushing
        // immediately removes the visible /dashboard flash.
      }
    } catch {
      // initiateEmailSignUp already toasted the Firebase error message.
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = async () => {
    trackMarketingEvent("signup_start", { method: "google" });
    setIsSigningUp(true);
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
        // Don't push explicitly here — the useEffect above will pick the
        // right destination once the profile/resumes finish loading.
        // (Returning Google users with completed onboarding go straight
        // to /dashboard; new users land on /onboarding.)
      } else {
        setIsSigningUp(false);
      }
    } catch (error: any) {
      setIsSigningUp(false);
      // initiateGoogleSignIn toasts most errors itself; surface the clean
      // unauthorized-domain throw so the user gets a helpful message.
      if (error?.code === "auth/unauthorized-domain") {
        toast({
          variant: "destructive",
          title: "Domain not authorized",
          description: error.message,
        });
      }
    }
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title="Create your account and save your CV"
      description="Start free, keep your progress and move straight into the CV task you selected."
      supportingTitle="Your CV workspace is ready when you are."
      supportingCopy="Build or upload a CV, improve the evidence and check it against a role—all without losing your place."
      highlights={[
        {
          title: "Guided onboarding",
          description: "Capture your goals, target roles, and experience level so the product can tailor every suggestion.",
        },
        {
          title: "CV + ATS workflow",
          description: "Create a master CV, compare it with real jobs, and iterate from a clean editor and preview.",
        },
        {
          title: "Upgrade only when it helps",
          description: "Start free, then unlock more templates, ATS scans, and AI actions as your search heats up.",
        },
      ]}
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSignup} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              First name
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="firstName"
                autoComplete="given-name"
                placeholder="Alex"
                className="h-12 pl-11"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Last name
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="lastName"
                autoComplete="family-name"
                placeholder="Morgan"
                className="h-12 pl-11"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
          </div>
        </div>

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
          <Label htmlFor="password" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className="h-12 pl-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              aria-describedby="password-help"
            />
          </div>
          <p id="password-help" className="text-xs leading-5 text-slate-500">Use at least 8 characters.</p>
        </div>

        <Button type="submit" className="h-12 w-full" disabled={isSigningUp}>
          {isSigningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          {!isSigningUp && <ArrowRight className="h-4 w-4" />}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">By creating an account, you agree to our <Link className="underline hover:text-primary" href="/terms">Terms</Link> and acknowledge our <Link className="underline hover:text-primary" href="/privacy">Privacy Policy</Link>.</p>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="bg-card px-3">Or continue with</span>
        </div>
      </div>

      <GoogleSignInButton onClick={handleGoogleSignup} isLoading={isSigningUp} text="Continue with Google" />
    </AuthShell>
  );
}
