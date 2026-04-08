'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail, User } from "lucide-react";
import { doc } from "firebase/firestore";
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { initiateEmailSignUp, initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { toast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertUserProfile } from "@/lib/user-profile";

export default function SignupPageClient() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading, uid } = useUser();
  const router = useRouter();

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

  useEffect(() => {
    // Only redirect if auth is ready AND we've attempted to fetch the profile.
    // If isProfileLoading is false and profile is null, it means the document doesn't exist yet,
    // which is expected during a fresh signup flow.
    if (user && !isUserLoading && !isProfileLoading) {
      if (profile) {
        // If they already have a profile, check where they should go
        if (profile.onboardingComplete) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } 
      // If no profile exists yet, we stay on the page until either:
      // 1. The user finishes the form and handleSignup/handleGoogleSignup pushes them
      // 2. The background upsert (for Google) finishes and a second useDoc tick sees the profile.
    }
  }, [user, isUserLoading, isProfileLoading, profile, router]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

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
        await upsertUserProfile({
          db,
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          firstName,
          lastName,
          photoURL: userCredential.user.photoURL,
          emailVerified: userCredential.user.emailVerified,
        });
        router.push("/onboarding");
      }
    } catch (error: any) {
      setIsSigningUp(false);
      toast({
        variant: "destructive",
        title: "Account creation failed",
        description: error.message || "We couldn't create your account. Please try again.",
      });
    }
  };

  const handleGoogleSignup = async () => {
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
        router.push("/onboarding");
      } else {
        setIsSigningUp(false);
      }
    } catch (error: any) {
      setIsSigningUp(false);
      toast({
        variant: "destructive",
        title: "Google sign-up failed",
        description: error.message || "We couldn't finish Google account setup right now.",
      });
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
      eyebrow="Create account"
      title="Launch a more organized, higher-converting job search"
      description="Start free and get a guided onboarding flow, premium-ready resume templates, ATS analysis, and one place to manage applications."
      supportingTitle="Build a stronger application stack from day one."
      supportingCopy="AI Career Guide helps you move faster without sacrificing clarity, polish, or ATS safety. Set up once, then tailor every application with less busywork."
      highlights={[
        {
          title: "Guided onboarding",
          description: "Capture your goals, target roles, and experience level so the product can tailor every suggestion.",
        },
        {
          title: "Resume + ATS workflow",
          description: "Create a master resume, score it against real jobs, and iterate from a clean editor and preview.",
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
            <Label htmlFor="firstName" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
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
            <Label htmlFor="lastName" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
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
          <Label htmlFor="email" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
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
          <Label htmlFor="password" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
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
            />
          </div>
        </div>

        <Button type="submit" className="h-12 w-full" disabled={isSigningUp}>
          {isSigningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          {!isSigningUp && <ArrowRight className="h-4 w-4" />}
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

      <GoogleSignInButton onClick={handleGoogleSignup} isLoading={isSigningUp} text="Continue with Google" />
    </AuthShell>
  );
}
