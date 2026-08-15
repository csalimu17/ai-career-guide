'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail, User } from "lucide-react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPageClient() {
  const { supabase, user, isUserLoading } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      const next = searchParams?.get("next") || "/dashboard";
      router.replace(next);
    }
  }, [user, isUserLoading, router, searchParams]);

  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSigningUp(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            plan: 'free',
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message,
        });
        setIsSigningUp(false);
      } else if (data?.user && !data?.session) {
        toast({
          title: "Check your email inbox! 📩",
          description: "We sent a confirmation link to your email. Click it to verify your account and sign in.",
        });
        setIsSigningUp(false);
      } else {
        toast({
          title: "Account created!",
          description: "Welcome to AI Career Guide.",
        });
        const next = searchParams?.get("next") || "/dashboard";
        router.replace(next);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Error",
        description: err.message || "An unexpected error occurred.",
      });
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSigningUp(true);

    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://aicareerguide.uk';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Google Sign-Up Error",
          description: error.message,
        });
        setIsSigningUp(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-Up Error",
        description: error.message || "Could not complete Google sign-up.",
      });
      setIsSigningUp(false);
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
      title="Create your free account"
      description="Start tailoring your CV, tracking applications, and preparing for interviews in one seamless workspace."
      supportingTitle="Your entire career toolkit, tailored to modern hiring."
      supportingCopy="Join thousands of UK professionals landing interviews faster with ATS-optimized CVs and real-time AI guidance."
      highlights={[
        {
          title: "ATS-Ready CV Builder",
          description: "Build recruiter-approved CVs that pass Applicant Tracking Systems with ease.",
        },
        {
          title: "Live ATS Diagnostics",
          description: "Scan your CV against any job description to discover missing keywords in seconds.",
        },
        {
          title: "Smart Pipeline Tracker",
          description: "Keep every application, interview date, and recruiter contact organized in one place.",
        },
      ]}
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleEmailSignUp} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="Alex Smith"
              className="h-12 pl-11"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
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
              placeholder="Create a strong password"
              className="h-12 pl-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>

        <Button type="submit" className="h-12 w-full" disabled={isSigningUp}>
          {isSigningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
          {!isSigningUp && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="bg-card px-3">Or sign up with</span>
        </div>
      </div>

      <div className="space-y-3">
        <GoogleSignInButton onClick={handleGoogleSignUp} isLoading={isSigningUp} text="Sign up with Google" />
      </div>
    </AuthShell>
  );
}
