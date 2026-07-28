'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyPodilPin, updatePodilAvailable, podilLogout } from './actions';

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

export function SharesEditor({
  current,
  total,
  updatedAt,
}: {
  current: number;
  total: number;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(current));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePodilAvailable(fd);
      if (!result.ok) { setError(result.error ?? 'Uložení se nepodařilo'); return; }
      setSaved(true);
      router.refresh();
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await podilLogout();
      router.refresh();
    });
  }

  const numeric = parseInt(value, 10);
  const sold = Number.isNaN(numeric) ? null : total - Math.min(Math.max(numeric, 0), total);

  return (
    <div className="space-y-5">
      <div className="text-center pb-4 border-b border-[#0B1626]/10">
        <p className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Aktuální stav</p>
        <p className="text-[#0B1626] font-light text-3xl">{current} <span className="text-lg text-[#0B1626]/40">z {total} volných</span></p>
        {updatedAt && (
          <p className="text-[#0B1626]/30 text-xs mt-1">
            Naposledy změněno {new Date(updatedAt).toLocaleDateString('cs-CZ', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-2">
            Nový počet volných podílů (0–{total})
          </label>
          <input
            name="available"
            type="number"
            min={0}
            max={total}
            value={value}
            onChange={(e) => { setValue(e.target.value); setSaved(false); }}
            className="w-full border border-[#0B1626]/15 rounded-sm px-4 py-3 text-center text-2xl text-[#0B1626] focus:outline-none focus:border-[#C9A24D]"
          />
          {sold !== null && (
            <p className="text-[#0B1626]/40 text-xs text-center mt-2">
              = {sold} prodaných podílů
            </p>
          )}
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {saved && <p className="text-green-700 text-sm text-center">Uloženo — na webu je nový počet.</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-[#C9A24D] text-[#0B1626] text-sm tracking-wide hover:bg-[#C9A24D]/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Ukládám…' : 'Uložit'}
        </button>
      </form>

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
