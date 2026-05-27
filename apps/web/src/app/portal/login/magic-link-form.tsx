'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type State = 'idle' | 'loading' | 'sent' | 'error';

export function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState('loading');
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setState('error');
      return;
    }

    setState('sent');
  }

  if (state === 'sent') {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full border border-[#C9A24D] flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-[#C9A24D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-light text-lg mb-2">Odkaz odeslán</p>
        <p className="text-white/50 text-sm">
          Zkontrolujte email <span className="text-white/80">{email}</span> a klikněte na přihlašovací odkaz.
        </p>
        <button
          onClick={() => { setState('idle'); setEmail(''); }}
          className="mt-6 text-[#C9A24D] text-xs underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          Zadat jiný email
        </button>
      </div>
    );
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

      {state === 'error' && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || !email.trim()}
        className="w-full bg-[#C9A24D] text-[#0B1626] py-3 text-sm tracking-wider uppercase font-light hover:bg-[#b8913c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? 'Odesílám...' : 'Zaslat přihlašovací odkaz'}
      </button>
    </form>
  );
}
