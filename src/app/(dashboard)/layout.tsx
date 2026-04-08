import DashboardLayoutClient from "@/components/dashboard/dashboard-layout-client";
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
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
