import ForgotPasswordPageClient from "@/components/auth/forgot-password-page-client";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Reset password",
  description: "Request a password reset email for your AI Career Guide account and recover access to your workspace securely.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
