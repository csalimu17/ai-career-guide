import SignupPageClient from "@/components/auth/signup-page-client";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Create account",
  description: "Create your AI Career Guide account to start building resumes, tailoring applications, and tracking your search in one workspace.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return <SignupPageClient />;
}
