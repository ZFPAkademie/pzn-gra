/**
 * Supabase browser klient pro Client Components.
 * Singleton — bezpečný pro client-side použití.
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _browserClient;
}
