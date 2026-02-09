/**
 * Route Middleware
 * Production v1: Simple pass-through
 * 
 * Admin auth handled at page/API level via admin-auth.ts
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // All route protection handled at page/API level
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
