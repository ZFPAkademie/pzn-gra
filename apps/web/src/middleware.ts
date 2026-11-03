/**
 * Route Middleware v2
 *
 * - /admin/* → pass-through (vlastní cookie auth, Supabase session nepotřebuje)
 * - /portal/login → pass-through (veřejná stránka)
 * - /portal/* → chráněno Supabase auth, redirect na /portal/login
 * - Vše ostatní → pass-through (veřejný web, API)
 * - ?lang=cs|en|pl → cookie NEXT_LOCALE + redirect bez parametru
 * - *.vercel.app → 308 na NEXT_PUBLIC_APP_URL (jen produkce, mimo /api), jinak noindex
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Kanonická doména z NEXT_PUBLIC_APP_URL (adresa v e-mailech). Dokud míří na *.vercel.app, přesměrování je vypnuté.
const APP_HOST = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_APP_URL ?? '').host; } catch { return ''; }
})();
const CANONICAL_ACTIVE = APP_HOST !== '' && !APP_HOST.endsWith('.vercel.app');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // *.vercel.app: produkce → 308 na kanonickou doménu se zachováním cesty (odkazy v odeslaných e-mailech),
  // /api zůstává (crony, iCal feedy pro OTA); preview a vše před přepnutím domény → jen noindex
  const host = request.headers.get('host') ?? '';
  if (host.endsWith('.vercel.app')) {
    if (CANONICAL_ACTIVE && process.env.VERCEL_ENV === 'production' && !pathname.startsWith('/api/')) {
      const target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${APP_HOST}`);
      return NextResponse.redirect(target, 308);
    }
    const res = await middlewareInner(request);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  return middlewareInner(request);
}

async function middlewareInner(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ?lang=cs|en|pl — nastaví jazyk webu (odkazy z e-mailů hostům, sdílené EN odkazy) a přesměruje na čistou URL
  const lang = request.nextUrl.searchParams.get('lang');
  if (lang === 'cs' || lang === 'en' || lang === 'pl') {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete('lang');
    const redirect = NextResponse.redirect(clean);
    redirect.cookies.set('NEXT_LOCALE', lang, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    return redirect;
  }

  // Admin používá vlastní cookie auth — Supabase session refresh zde nepotřebujeme
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth/callback')) {
    return NextResponse.next({ request });
  }

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
  // Ale ne pokud je error param — uživatel vidí chybu (no_access apod.)
  if (pathname === '/portal/login' && user && !request.nextUrl.searchParams.get('error')) {
    const portalUrl = new URL('/portal', request.url);
    return NextResponse.redirect(portalUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
