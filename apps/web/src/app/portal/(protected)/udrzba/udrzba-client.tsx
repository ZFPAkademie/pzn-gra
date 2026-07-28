'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createMaintenanceRequest } from './actions';

interface ApartmentOption {
  id: string;
  unit: string;
  building: string;
}

export function NewRequestForm({ apartments }: { apartments: ApartmentOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const result = await createMaintenanceRequest(fd);
      if (!result.ok) { setError(result.error ?? 'Hlášení se nepodařilo odeslat'); return; }
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-[#0B1626] text-white text-sm font-light hover:bg-[#0B1626]/90 transition-colors"
        >
          Nahlásit závadu
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#0B1626]/10 rounded-sm p-6 mb-8 space-y-4">
      <h2 className="text-[#0B1626] font-light text-base">Nové hlášení závady</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {apartments.length > 1 ? (
          <div>
            <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Apartmán</label>
            <select
              name="apartment_id"
              className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2 text-sm text-[#0B1626] font-light focus:outline-none focus:border-[#C9A24D]"
            >
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>{a.building} {a.unit}</option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="apartment_id" value={apartments[0].id} />
        )}
        <div>
          <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Naléhavost</label>
          <select
            name="priority"
            defaultValue="normal"
            className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2 text-sm text-[#0B1626] font-light focus:outline-none focus:border-[#C9A24D]"
          >
            <option value="low">Nízká</option>
            <option value="normal">Běžná</option>
            <option value="urgent">Urgentní</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Co se stalo? *</label>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Kape kohoutek v koupelně"
          className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2 text-sm text-[#0B1626] font-light focus:outline-none focus:border-[#C9A24D]"
        />
      </div>

      <div>
        <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Podrobnosti</label>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Popište závadu podrobněji…"
          className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2 text-sm text-[#0B1626] font-light focus:outline-none focus:border-[#C9A24D] resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-[#0B1626] text-white text-sm font-light hover:bg-[#0B1626]/90 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Odesílám…' : 'Odeslat hlášení'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-[#0B1626]/40 hover:text-[#0B1626] font-light transition-colors"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
