'use client';

import { useTransition, useState } from 'react';
import { updateOwnerProfile } from './actions';

interface ProfilFormProps {
  name: string;
  phone: string;
  bank_account: string;
}

export function ProfilForm({ name, phone, bank_account }: ProfilFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const res = await updateOwnerProfile(formData);
      setResult(res);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1.5" htmlFor="name">
          Jméno
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={name}
          required
          className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2.5 text-[#0B1626] font-light text-sm bg-white focus:outline-none focus:border-[#C9A24D] transition-colors"
        />
      </div>

      <div>
        <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1.5" htmlFor="phone">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2.5 text-[#0B1626] font-light text-sm bg-white focus:outline-none focus:border-[#C9A24D] transition-colors"
        />
      </div>

      <div>
        <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1.5" htmlFor="bank_account">
          Bankovní účet
        </label>
        <input
          id="bank_account"
          name="bank_account"
          type="text"
          defaultValue={bank_account}
          placeholder="123456789/0100"
          className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2.5 text-[#0B1626] font-light text-sm bg-white focus:outline-none focus:border-[#C9A24D] transition-colors placeholder:text-[#0B1626]/25"
        />
      </div>

      {result && !result.ok && (
        <p className="text-red-600 text-sm font-light">{result.error}</p>
      )}
      {result?.ok && (
        <p className="text-green-700 text-sm font-light">Změny byly uloženy.</p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-[#0B1626] text-white text-sm font-light rounded-sm hover:bg-[#0B1626]/80 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Ukládám…' : 'Uložit'}
        </button>
      </div>
    </form>
  );
}
