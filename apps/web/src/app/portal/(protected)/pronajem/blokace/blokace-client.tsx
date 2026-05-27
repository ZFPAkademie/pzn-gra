'use client';

import { useState, useTransition } from 'react';
import { createOwnerBlock, deleteOwnerBlock } from './actions';

interface ApartmentOption {
  id: string;
  label: string;
}

interface BlockItem {
  id: string;
  apartment_id: string;
  start_date: string;
  end_date: string;
  note: string | null;
  displayStart: string;
  displayEnd: string;
  apartmentLabel: string;
}

export function BlokaceClient({
  apartments,
  blocks,
}: {
  apartments: ApartmentOption[];
  blocks: BlockItem[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createOwnerBlock(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <div className="space-y-6">
      {/* Formulář */}
      {open ? (
        <form onSubmit={handleSubmit} className="bg-white border border-[#0B1626]/10 rounded-sm p-6 space-y-4">
          <h3 className="text-[#0B1626] font-light text-base">Nová blokace</h3>

          <div className="grid grid-cols-2 gap-4">
            {apartments.length > 1 && (
              <div className="col-span-2">
                <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Apartmán</label>
                <select name="apartment_id" required className="w-full border border-[#0B1626]/20 px-3 py-2 text-sm text-[#0B1626] focus:outline-none focus:border-[#C9A24D]">
                  {apartments.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>
            )}
            {apartments.length === 1 && (
              <input type="hidden" name="apartment_id" value={apartments[0].id} />
            )}

            <div>
              <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Od</label>
              <input
                type="date"
                name="start_date"
                required
                min={new Date().toISOString().slice(0, 10)}
                className="w-full border border-[#0B1626]/20 px-3 py-2 text-sm text-[#0B1626] focus:outline-none focus:border-[#C9A24D]"
              />
            </div>
            <div>
              <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Do</label>
              <input
                type="date"
                name="end_date"
                required
                min={new Date().toISOString().slice(0, 10)}
                className="w-full border border-[#0B1626]/20 px-3 py-2 text-sm text-[#0B1626] focus:outline-none focus:border-[#C9A24D]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Poznámka (volitelná)</label>
              <input
                name="note"
                placeholder="Rodinná dovolená..."
                className="w-full border border-[#0B1626]/20 px-3 py-2 text-sm text-[#0B1626] focus:outline-none focus:border-[#C9A24D]"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="px-5 py-2 bg-[#0B1626] text-white text-sm font-light hover:bg-[#0B1626]/90 disabled:opacity-50">
              {isPending ? 'Ukládám…' : 'Zablokovat termín'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-[#0B1626]/40 hover:text-[#0B1626]">
              Zrušit
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 bg-[#0B1626] text-white text-sm font-light tracking-wide hover:bg-[#0B1626]/90 transition-colors"
        >
          Přidat blokaci
        </button>
      )}

      {/* Seznam blokací */}
      {blocks.length === 0 ? (
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light text-sm">Žádné aktivní blokace</p>
          <p className="text-[#0B1626]/25 text-xs mt-1">Budoucí blokace pro vlastní pobyt se zobrazí zde.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map(block => (
            <BlockRow key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockRow({ block }: { block: BlockItem }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bg-white border border-[#0B1626]/10 rounded-sm px-5 py-4 flex items-center justify-between">
      <div className="space-y-1">
        {block.apartmentLabel && (
          <p className="text-[#0B1626]/40 text-xs">{block.apartmentLabel}</p>
        )}
        <p className="text-[#0B1626] font-light text-sm">
          {block.displayStart} – {block.displayEnd}
        </p>
        {block.note && (
          <p className="text-[#0B1626]/50 text-xs">{block.note}</p>
        )}
      </div>
      <button
        onClick={() => {
          if (!confirm('Zrušit tuto blokaci?')) return;
          startTransition(async () => { await deleteOwnerBlock(block.id); });
        }}
        disabled={isPending}
        className="text-xs text-[#0B1626]/30 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        {isPending ? '…' : 'Zrušit'}
      </button>
    </div>
  );
}
