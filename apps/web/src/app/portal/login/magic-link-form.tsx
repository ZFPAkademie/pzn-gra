'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type State = 'idle' | 'loading' | 'error';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setState('loading');
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Nesprávný email nebo heslo.');
      setState('error');
      return;
    }

    router.push('/portal');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-white/60 text-xs tracking-wider uppercase mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vas@email.cz"
          required
          disabled={state === 'loading'}
          className="w-full bg-white/5 border border-white/20 rounded-sm px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#C9A24D] transition-colors disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-white/60 text-xs tracking-wider uppercase mb-2">
          Heslo
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={state === 'loading'}
          className="w-full bg-white/5 border border-white/20 rounded-sm px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#C9A24D] transition-colors disabled:opacity-50"
        />
      </div>

      {state === 'error' && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || !email.trim() || !password}
        className="w-full bg-[#C9A24D] text-[#0B1626] py-3 text-sm tracking-wider uppercase font-light hover:bg-[#b8913c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? 'Přihlašuji...' : 'Přihlásit se'}
      </button>
    </form>
  );
}
