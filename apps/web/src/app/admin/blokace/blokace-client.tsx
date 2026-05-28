'use client';

import { useState, useTransition } from 'react';
import { createBlock, deleteBlock } from './actions';

interface Apartment {
  id: string;
  slug: string;
  title: string | null;
}

const reasonLabels: Record<string, string> = {
  owner_use: 'Vlastní pobyt',
  maintenance: 'Údržba',
  other: 'Jiné',
};

const reasonColors: Record<string, string> = {
  owner_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-600',
};

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function AddBlockForm({ apartments }: { apartments: Apartment[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBlock(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-navy text-white text-sm font-light tracking-wide hover:bg-navy/90 transition-colors">
        Přidat blokaci
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone p-6 space-y-4">
      <h3 className="text-sm font-medium text-navy">Nová blokace termínu</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Apartmán</label>
          <select name="apartment_id" required className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold">
            <option value="">Vyberte apartmán</option>
            {apartments.map(a => (
              <option key={a.id} value={a.id}>{a.title ?? a.slug}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Důvod</label>
          <select name="reason" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold">
            <option value="maintenance">Údržba</option>
            <option value="owner_use">Vlastní pobyt</option>
            <option value="other">Jiné</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Od</label>
          <input type="date" name="start_date" required className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Do</label>
          <input type="date" name="end_date" required className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Poznámka (volitelná)</label>
          <input name="note" placeholder="Výměna podlah, malování..." className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 transition-colors disabled:opacity-50">
          {isPending ? 'Ukládám…' : 'Uložit'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-navy">
          Zrušit
        </button>
      </div>
    </form>
  );
}

export function DeleteBlockButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm('Zrušit tuto blokaci?')) return;
        startTransition(async () => { await deleteBlock(id); });
      }}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? 'Mažu…' : 'Zrušit'}
    </button>
  );
}

export function BlocksList({
  blocks,
  apartments,
}: {
  blocks: Array<{
    id: string;
    apartment_id: string;
    owner_id: string | null;
    start_date: string;
    end_date: string;
    reason: string;
    note: string | null;
  }>;
  apartments: Apartment[];
}) {
  const aptMap = Object.fromEntries(apartments.map(a => [a.id, a.title ?? a.slug]));

  if (blocks.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">Žádné blokace</p>;
  }

  return (
    <div className="space-y-2">
      {blocks.map(block => (
        <div key={block.id} className="bg-white border border-stone px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${reasonColors[block.reason] ?? 'bg-gray-100 text-gray-600'}`}>
                  {reasonLabels[block.reason] ?? block.reason}
                </span>
                {!block.owner_id && <span className="text-xs text-slate-300">admin</span>}
              </div>
              <div className="text-xs text-slate-400 truncate">{aptMap[block.apartment_id]}</div>
              <div className="text-sm text-navy mt-0.5">{formatDate(block.start_date)} – {formatDate(block.end_date)}</div>
              {block.note && <div className="text-xs text-slate-400 mt-0.5">{block.note}</div>}
            </div>
            <DeleteBlockButton id={block.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
