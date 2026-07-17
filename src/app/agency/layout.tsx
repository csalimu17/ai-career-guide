import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Agency Workspace",
  description: "Agency workspace for managed candidate operations and ATS integrations.",
  noIndex: true,
});

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return children;
}
