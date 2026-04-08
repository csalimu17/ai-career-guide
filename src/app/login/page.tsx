import LoginPageClient from "@/components/auth/login-page-client";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Log in",
  description: "Sign in to AI Career Guide to continue editing resumes, checking ATS scores, and managing your job search workspace.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return <LoginPageClient />;
}
