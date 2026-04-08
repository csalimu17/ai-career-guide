'use client';

import Image from "next/image";
import { Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useUser } from "@/firebase";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { HistoryButtons } from "@/components/navigation/history-buttons";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthorized, isLoading, adminRecord } = useAdminAuth();
  const { user } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface-card flex flex-col items-center gap-4 px-8 py-10 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Initializing governance
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-transparent">
        <header className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-white/80 bg-white/78 px-3 py-2.5 backdrop-blur-xl sm:min-h-16 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <SidebarTrigger className="-ml-1 h-9 w-9 rounded-xl hover:bg-primary/5 sm:-ml-2 sm:h-10 sm:w-10" />
            <HistoryButtons fallbackHref="/admin" buttonClassName="h-8 w-8 rounded-xl sm:h-9 sm:w-9" />
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 sm:border-none sm:bg-transparent sm:px-0 sm:py-0">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary sm:h-4 sm:w-4" />
              <span className="truncate text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[0.68rem] sm:tracking-[0.22em]">
                Authorized session
              </span>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-4">
            <div className="hidden text-right md:block">
              <p className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-primary">
                {adminRecord?.fullName || user?.email}
              </p>
              <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {adminRecord?.roleIds?.[0]?.replace("-", " ")}
              </p>
            </div>
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white shadow-sm sm:h-10 sm:w-10">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={`${adminRecord?.fullName || user.email || "Admin"} avatar`}
                  fill
                  sizes="(max-width: 640px) 36px, 40px"
                  className="object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-2 py-4 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
