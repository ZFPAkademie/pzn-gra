'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPodilPin, podilLogout } from './actions';

export function PinForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await verifyPodilPin(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-2">
          Zadejte PIN
        </label>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          className="w-full border border-[#0B1626]/15 rounded-sm px-4 py-3 text-center text-xl tracking-[0.5em] text-[#0B1626] focus:outline-none focus:border-[#C9A24D]"
        />
      </div>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-[#0B1626] text-white text-sm font-light tracking-wide hover:bg-[#0B1626]/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Ověřuji…' : 'Vstoupit'}
      </button>
    </form>
  );
}

export function SharesStatus({
  summary,
  total,
  loadError,
}: {
  summary: { available: number; owned: number; reserved: number } | null;
  total: number;
  loadError: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await podilLogout();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="text-center pb-4 border-b border-[#0B1626]/10">
        <p className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Aktuální stav</p>
        {summary ? (
          <>
            <p className="text-[#0B1626] font-light text-3xl">
              {summary.available} <span className="text-lg text-[#0B1626]/40">z {total} volných</span>
            </p>
            <p className="text-[#0B1626]/50 text-sm mt-2">
              {summary.owned} ve vlastnictví · {summary.reserved} v rezervaci
            </p>
          </>
        ) : (
          <p className="text-red-600 text-sm">
            {loadError ? 'Stav se nepodařilo načíst. Zkuste to prosím za chvíli.' : '—'}
          </p>
        )}
      </div>

      <p className="text-[#0B1626]/60 text-sm leading-relaxed">
        Počet se počítá automaticky z evidence zájemců a vlastníků v administraci
        (sekce Družstvo): podíly ve stavu Rezervace a Vlastník se odečítají od {total}.
        Ručně se už nemění. Úpravu udělá kolega s přístupem do administrace.
      </p>

      <button
        onClick={handleLogout}
        disabled={isPending}
        className="w-full text-[#0B1626]/30 hover:text-[#0B1626]/60 text-xs transition-colors"
      >
        Odhlásit se
      </button>
    </div>
  );
}
