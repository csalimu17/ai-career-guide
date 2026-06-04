import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Set COOP header to allow Firebase Auth popups
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  
  return response;
}

export const config = {
  matcher: '/:path*',
};
