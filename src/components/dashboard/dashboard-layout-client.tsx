'use client';

import { useEffect } from "react";
import { collection, doc, limit, query } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { HistoryButtons } from "@/components/navigation/history-buttons";
import { MobileDashboardShell } from "@/components/mobile/mobile-dashboard-shell";
import { MobileOnboardingLayout } from "@/components/mobile/mobile-onboarding-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { getPostAuthDestination } from "@/lib/user-profile";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, impersonatedUid, uid, clearImpersonation } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !uid) return null;
    return doc(db, "users", uid);
  }, [db, uid]);

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useDoc(userDocRef, { 
    suppressGlobalError: !!impersonatedUid 
  });

  const resumesQuery = useMemoFirebase(() => {
    if (!db || !uid) return null;
    return query(collection(db, "users", uid, "resumes"), limit(1));
  }, [db, uid]);

  const { data: resumes, isLoading: isResumesLoading } = useCollection(resumesQuery);

  useEffect(() => {
    if (impersonatedUid || isProfileLoading || isResumesLoading || isUserLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    const targetPath = getPostAuthDestination(profile, Boolean(resumes?.length));
    const isCurrentlyOnboarding = pathname.startsWith("/onboarding");
    const isSpecialOnboardingFlow = pathname === "/onboarding/upload" || pathname === "/onboarding/review";

    // Rule 1: Should be in onboarding but isn't
    if (targetPath === "/onboarding" && !isCurrentlyOnboarding) {
      router.replace("/onboarding");
      return;
    }

    // Rule 2: Should NOT be in onboarding but is
    // This handles returning members landing on /onboarding
    if (targetPath === "/dashboard" && isCurrentlyOnboarding && !isSpecialOnboardingFlow) {
      // Small exception: if they are strictly in /onboarding/upload or /onboarding/review, 
      // they might have a resume but still want to finish the flow.
      router.replace("/dashboard");
      return;
    }

    // Rule 3: authoritative completion check
    if (isCurrentlyOnboarding && profile?.onboardingComplete && !isSpecialOnboardingFlow) {
      router.replace("/dashboard");
    }
  }, [profile, resumes, isProfileLoading, isResumesLoading, isUserLoading, user, pathname, router, impersonatedUid]);

  useEffect(() => {
    if (impersonatedUid && profileError) {
      console.error("Impersonation failed:", profileError);
      clearImpersonation();
    }
  }, [impersonatedUid, profileError, clearImpersonation]);

  if (isUserLoading || isProfileLoading || isResumesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface-card flex flex-col items-center gap-4 px-8 py-10 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Authenticating workspace
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isOnboarding = pathname.startsWith("/onboarding");

  const handleStopImpersonation = () => {
    clearImpersonation();
  };

  if (isMobile && isOnboarding) {
    return (
      <MobileOnboardingLayout impersonatedUid={impersonatedUid} onStopImpersonation={handleStopImpersonation}>
        {children}
      </MobileOnboardingLayout>
    );
  }

  if (isMobile) {
    return (
      <MobileDashboardShell
        profile={profile}
        user={user}
        impersonatedUid={impersonatedUid}
        onStopImpersonation={handleStopImpersonation}
      >
        {children}
      </MobileDashboardShell>
    );
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen">
        {impersonatedUid && (
          <div className="sticky top-0 z-[100] flex items-center justify-between bg-destructive px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-destructive-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Viewing as {impersonatedUid}
            </div>
            <Button variant="ghost" size="sm" onClick={handleStopImpersonation} className="h-7 bg-white/10 text-[0.68rem] hover:bg-white/20">
              End session
            </Button>
          </div>
        )}
        <main className="app-shell py-6 md:py-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <HistoryButtons fallbackHref="/dashboard" />
            <div className="text-right">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Guided setup
              </p>
              <p className="text-sm font-bold text-primary">Move back or forward through onboarding</p>
            </div>
          </div>
          {children}
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="no-print">
        <AppSidebar profile={profile} impersonatedUid={impersonatedUid} />
      </div>
      <SidebarInset className="bg-transparent">
        {impersonatedUid && (
          <div className="sticky top-0 z-[100] flex items-center justify-between border-b border-white/10 bg-destructive px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-destructive-foreground shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Administrative shadowing session active
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden opacity-70 md:inline">UID: {impersonatedUid}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopImpersonation}
                className="h-6 rounded-full border border-white/20 bg-white/20 px-3 text-[0.65rem] font-semibold hover:bg-white/30"
              >
                Exit impersonation
              </Button>
            </div>
          </div>
        )}

        <header className="no-print sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/80 bg-white/72 px-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-2 h-10 w-10 rounded-xl hover:bg-primary/5" />
            <HistoryButtons fallbackHref="/dashboard" buttonClassName="h-9 w-9 rounded-xl" />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-none text-primary">
                {impersonatedUid
                  ? `Shadowing ${profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "User"}`
                  : profile?.firstName
                  ? `${profile.firstName} ${profile.lastName}`
                  : user.displayName || user.email?.split("@")[0]}
              </p>
              <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {impersonatedUid ? "Target profile" : `${profile?.plan || "free"} plan`}
              </p>
            </div>
            <Avatar className="h-10 w-10 border border-white/80 bg-white shadow-sm ring-2 ring-primary/5">
              <AvatarImage
                src={
                  impersonatedUid
                    ? profile?.photoURL || undefined
                    : user.photoURL || undefined
                }
              />
              <AvatarFallback className="bg-primary text-white font-semibold">
                {(profile?.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent print:h-auto print:overflow-visible print:bg-white print:p-0">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
