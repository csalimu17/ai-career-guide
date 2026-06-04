import { AppProviders } from "@/components/app/app-providers"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}

