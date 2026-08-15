'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useSupabase } from "@/lib/supabase/provider";
import { useToast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPageClient() {
  const { supabase, user, isUserLoading } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      const next = searchParams?.get("next") || "/dashboard";
      router.replace(next);
    }
  }, [user, isUserLoading, router, searchParams]);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "Invalid email or password. Please try again.",
        });
        setIsLoggingIn(false);
      } else {
        toast({
          title: "Welcome back!",
          description: "Signing you into your workspace...",
        });
        const next = searchParams?.get("next") || "/dashboard";
        router.replace(next);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: err.message || "An unexpected error occurred.",
      });
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);

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
          title: "Google Sign-In Error",
          description: error.message,
        });
        setIsLoggingIn(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: error.message || "Could not complete Google authentication.",
      });
      setIsLoggingIn(false);
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
