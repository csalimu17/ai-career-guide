import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Set COOP header to allow Firebase Auth popups
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  
  return response;
}

export const config = {
  matcher: [
    "/__/auth/:path*",
    "/admin/:path*",
    "/agency/:path*",
    "/api/:path*",
    "/ats/:path*",
    "/chat/:path*",
    "/cover-letters/:path*",
    "/cv-editor/:path*",
    "/dashboard/:path*",
    "/editor/:path*",
    "/forgot-password",
    "/interview-prep/:path*",
    "/jobs/:path*",
    "/login",
    "/onboarding/:path*",
    "/print/:path*",
    "/resumes/:path*",
    "/settings/:path*",
    "/signup",
    "/tracker/:path*",
  ],
};
