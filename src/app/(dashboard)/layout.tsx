import DashboardLayoutClient from "@/components/dashboard/dashboard-layout-client";
import { AppProviders } from "@/components/app/app-providers";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Workspace",
  description: "Manage resumes, ATS checks, applications, and settings inside the AI Career Guide workspace.",
  noIndex: true,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </AppProviders>
  );
}
