import AdminLayoutClient from "@/components/admin/admin-layout-client";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Governance console",
  description: "Admin operations, user management, subscriptions, content, and audit visibility for AI Career Guide.",
  noIndex: true,
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
