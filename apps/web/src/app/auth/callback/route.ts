/**
 * Supabase Auth callback — zpracuje magic link token a vytvoří session.
 * Zvládá oba formáty které Supabase posílá:
 *   - PKCE flow: ?code=xxx (novější)
 *   - Token hash flow: ?token_hash=xxx&type=magiclink (starší / default Supabase)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // PKCE flow (?code=xxx) — novější Supabase projekty
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/portal`);
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
  }

  // Token hash flow (?token_hash=xxx&type=magiclink) — starší / default nastavení
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}/portal`);
    }
    console.error('[auth/callback] verifyOtp error:', error.message);
  }

  return NextResponse.redirect(`${origin}/portal/login?error=auth`);
}
