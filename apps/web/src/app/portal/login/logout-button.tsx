'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full border border-white/20 text-white/60 py-3 text-sm tracking-wider uppercase font-light hover:border-white/40 hover:text-white/80 transition-colors"
    >
      Odhlásit se a zkusit jiný účet
    </button>
  );
}
