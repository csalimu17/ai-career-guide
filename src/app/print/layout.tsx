import { AppProviders } from "@/components/app/app-providers"

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}

