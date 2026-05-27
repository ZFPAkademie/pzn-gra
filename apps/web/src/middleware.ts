/**
 * Route Middleware v2
 *
 * - Refresh Supabase session cookies na každém requestu (nutné pro SSR auth)
 * - /portal/* → chráněno, redirect na /portal/login pokud nepřihlášen
 * - Vše ostatní → volně průchozí (veřejný web, admin, API)
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request,
  });

  // Refresh session cookies (nutné aby server components viděly aktuální session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — důležité: GETUSER ne getSession (bezpečnější)
  const { data: { user } } = await supabase.auth.getUser();

  // Ochrana /portal/* — redirect na login pokud nepřihlášen
  if (pathname.startsWith('/portal') && !pathname.startsWith('/portal/login')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/portal/login';
      return NextResponse.redirect(loginUrl);
    }
  }

  // /portal/login — pokud již přihlášen, přesměruj do portálu
  if (pathname === '/portal/login' && user) {
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = '/portal';
    return NextResponse.redirect(portalUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
