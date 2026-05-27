/**
 * Supabase SSR klienty pro server-side použití (Server Components, Server Actions, middleware)
 * Spravuje cookie-based session pro owner portal auth.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server Component / Server Action klient — čte a zapisuje cookies pro session.
 * Použití: autentizovaní uživatelé (owner portal).
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components nemohou nastavovat cookies — ignoruj (middleware to řeší)
        }
      },
    },
  });
}

/**
 * Admin / service role klient pro server-side operace bez RLS.
 * Použití: invitation flow, owner ownership check, admin akce.
 */
export function createSupabaseAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Získá aktuálně přihlášeného uživatele ze session.
 * Vrátí null pokud není přihlášen.
 */
export async function getServerUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Ownership check — ověří, že přihlášený user je owner a vrátí jeho owner record.
 * Použití: server actions v portálu místo RLS (pattern DB-01).
 */
export async function requireOwner(): Promise<
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>; ownerId: string; apartmentIds: string[] }
  | { ok: false; error: string }
> {
  const user = await getServerUser();
  if (!user) return { ok: false, error: 'Nepřihlášen' };

  const admin = createSupabaseAdminClient();
  const { data: owner } = await admin
    .from('owners')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!owner) return { ok: false, error: 'Přístup odepřen' };

  const { data: apartments } = await admin
    .from('apartments')
    .select('id')
    .eq('owner_id', owner.id);

  return {
    ok: true,
    user,
    ownerId: owner.id,
    apartmentIds: (apartments || []).map((a) => a.id),
  };
}
