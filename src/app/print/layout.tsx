import type { ReactNode } from "react";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Print Preview",
  description: "Private print preview for resume exports.",
  noIndex: true,
});

export default function PrintLayout({ children }: { children: ReactNode }) {
  return children;
}
