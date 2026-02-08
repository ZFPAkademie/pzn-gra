/**
 * Route protection middleware skeleton
 * 
 * Sprint 0: Structure only
 * Implementation in Sprint 1+
 * 
 * Route Protection Matrix (from SPRINT_0_PLAN.md §4.5):
 * 
 * | Route Pattern              | Required Role | Auth Type |
 * |----------------------------|---------------|-----------|
 * | /                          | None          | Public    |
 * | /golden-ridge-apartments/* | None          | Public    |
 * | /api/v1/apartments         | None          | Public    |
 * | /api/v1/reservations POST  | None          | Public    |
 * | /rezervace/:token          | Valid token   | Token     |
 * | /api/v1/guest/:token       | Valid token   | Token     |
 * | /login                     | None          | Public    |
 * | /vlastnik/*                | owner         | Session   |
 * | /api/v1/owner/*            | owner         | Session   |
 * | /sprava/*                  | manager       | Session   |
 * | /api/v1/manager/*          | manager       | Session   |
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Routes that require authentication
const protectedRoutes = {
  owner: ['/vlastnik', '/api/v1/owner'],
  manager: ['/sprava', '/api/v1/manager'],
};

// Public routes (no auth required)
const publicRoutes = [
  '/',
  '/login',
  '/golden-ridge-apartments',
  '/lokalita',
  '/investicni-prilezitost',
  '/standardy',
  '/o-projektu',
  '/kdo-stavi-chaty',
  '/suites',
  '/apartmany-spindleruv-mlyn-pronajem',
  '/kontakt',
  '/api/v1/apartments',
  '/api/v1/reservations',
  '/api/v1/contact',
];

// Token-based routes (guest access)
const tokenRoutes = ['/rezervace', '/api/v1/guest'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if token route (guest access)
  const isTokenRoute = tokenRoutes.some((route) => pathname.startsWith(route));
  if (isTokenRoute) {
    // Token validation will be implemented in Sprint 2
    // For now, allow access (validation happens at page/API level)
    return NextResponse.next();
  }

  // Check if owner route
  const isOwnerRoute = protectedRoutes.owner.some((route) => pathname.startsWith(route));
  if (isOwnerRoute) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Owner or manager can access owner routes
    if (session.user.role !== 'owner' && session.user.role !== 'manager') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Check if manager route
  const isManagerRoute = protectedRoutes.manager.some((route) => pathname.startsWith(route));
  if (isManagerRoute) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Only manager can access manager routes
    if (session.user.role !== 'manager') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
