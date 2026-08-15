'use client';

import * as React from "react";
import { useEffect } from "react";
import { collection, doc, limit, query } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { BrandLoadingLogo } from "@/components/brand/brand-loading-logo";
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
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [isUserLoading, router, user]);

  useEffect(() => {
    if (impersonatedUid && profileError) {
      console.error("Impersonation failed:", profileError);
      clearImpersonation();
    }
  }, [impersonatedUid, profileError, clearImpersonation]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface-card flex flex-col items-center gap-6 px-8 py-12 text-center">
          <BrandLoadingLogo size="lg" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Authenticating workspace
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface-card flex flex-col items-center gap-4 px-8 py-10 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Redirecting to login
          </p>
        </div>
      </div>
    );
  }

  const isOnboarding = pathname.startsWith("/onboarding");
  const isEditor = pathname.startsWith("/cv-editor") || pathname.startsWith("/editor");

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
            <Button variant="ghost" size="sm" onClick={handleStopImpersonation} className="h-10 bg-white/10 text-[0.68rem] hover:bg-white/20">
              End session
            </Button>
          </div>
        )}
          {children}
        <Toaster />
      </div>
    );
  }

  if (isEditor) {
    return (
      <div className="h-screen overflow-hidden">
        {impersonatedUid && (
          <div className="sticky top-0 z-[100] flex items-center justify-between border-b border-white/10 bg-destructive px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-destructive-foreground shadow-lg">
            Administrative shadowing active
            <Button size="sm" variant="ghost" onClick={handleStopImpersonation} className="h-10 px-3 text-[10px]">Exit</Button>
          </div>
        )}
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        profile={profile} 
        impersonatedUid={impersonatedUid} 
        className="no-print"
      />
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
            <React.Suspense fallback={<div className="h-9 w-18" />}>
              <HistoryButtons fallbackHref="/dashboard" buttonClassName="h-11 w-11 rounded-xl" />
            </React.Suspense>
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
