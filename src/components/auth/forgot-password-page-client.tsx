'use client';

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPageClient() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your inbox for instructions to create a new password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message || "We couldn't send the recovery email right now.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password without losing momentum"
      description="We’ll send a recovery link to your inbox so you can get back into your workspace quickly and securely."
      supportingTitle="Keep your job search moving, even if a password gets in the way."
      supportingCopy="Reset links are sent through your authenticated email address so you can recover access without opening a support ticket."
      highlights={[
        {
          title: "Secure reset flow",
          description: "Password recovery runs through Firebase Auth, so the process stays tied to your verified email address.",
        },
        {
          title: "Fast return path",
          description: "As soon as you update your password, you can sign back in and continue editing, tracking, or upgrading.",
        },
        {
          title: "Support backup",
          description: "If the email never arrives, our support team can help you troubleshoot access and account issues.",
        },
      ]}
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      }
    >
      {!isSent ? (
        <form onSubmit={handleReset} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Account email
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
          <Button type="submit" className="h-12 w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      ) : (
        <div className="section-shell flex flex-col items-center gap-5 px-6 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-secondary/10 text-secondary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary">Check your inbox</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A recovery link has been sent to <span className="font-semibold text-primary">{email}</span>. Once you reset your password, sign back in to continue.
            </p>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Return to login</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
