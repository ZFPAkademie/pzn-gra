'use client';

import { useTransition, useState } from 'react';
import {
  updateApartmentInfo,
  updateApartmentFeatures,
  addPricingRule,
  deletePricingRuleForApt,
  addBlock,
  deleteBlock,
} from './actions';

// ─── Typy ─────────────────────────────────────────────────────────

interface Apartment {
  id: string;
  slug: string;
  title: string | null;
  subtitle: string | null;
  unit: string | null;
  building: string | null;
  layout: string | null;
  area_m2: number | null;
  floor: number | null;
  max_guests: number | null;
  orientation: string | null;
  description: string | null;
  status: string;
  for_sale: boolean;
  for_rent: boolean;
  in_rental_program: boolean;
  base_price_cents: number | null;
  features: string[] | null;
}

interface PricingRule {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  price_per_night_cents: number;
  min_nights: number | null;
}

interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

interface Booking {
  id: string;
  confirmation_token: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  check_in: string;
  check_out: string;
  nights: number | null;
  total_amount_cents: number | null;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtCents(cents: number | null) {
  if (cents == null) return '—';
  return (cents / 100).toLocaleString('cs-CZ') + ' Kč';
}

const statusLabels: Record<string, string> = {
  pending: 'Čeká',
  confirmed: 'Potvrzeno',
  cancelled: 'Zrušeno',
  completed: 'Dokončeno',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
};

const reasonLabels: Record<string, string> = {
  owner_use: 'Vlastní využití',
  maintenance: 'Údržba',
  other: 'Jiné',
};

// ─── Základní informace ───────────────────────────────────────────

export function BasicInfoSection({ apt }: { apt: Apartment }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateApartmentInfo(apt.id, fd);
      if (!res.ok) { setError(res.error ?? 'Chyba'); return; }
      setEditing(false);
    });
  }

  return (
    <div className="bg-white border border-stone p-6 mb-6">
      <div className="flex items-center justify-between text-sm font-medium text-navy mb-4 pb-3 border-b border-stone">
        <span>Základní informace</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-slate-400 hover:text-navy transition-colors"
          >
            Upravit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Název</label>
              <input name="title" defaultValue={apt.title ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Budova</label>
              <input name="building" defaultValue={apt.building ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Jednotka</label>
              <input name="unit" defaultValue={apt.unit ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Dispozice</label>
              <input name="layout" defaultValue={apt.layout ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Plocha (m²)</label>
              <input name="area_m2" type="number" step="0.01" defaultValue={apt.area_m2 ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Patro</label>
              <input name="floor" type="number" min="0" defaultValue={apt.floor ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Max. hostů</label>
              <input name="max_guests" type="number" min="1" defaultValue={apt.max_guests ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Orientace</label>
              <input name="orientation" defaultValue={apt.orientation ?? ''} placeholder="jih, západ" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Popis</label>
              <textarea name="description" rows={3} defaultValue={apt.description ?? ''} className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none" />
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="bg-navy text-white text-xs px-3 py-1.5 disabled:opacity-50">
              {isPending ? 'Ukládám…' : 'Uložit'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-slate-400 hover:text-navy text-xs">Zrušit</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Název</dt>
              <dd className="text-navy mt-0.5">{apt.title ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Budova</dt>
              <dd className="text-navy mt-0.5">{apt.building ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Jednotka</dt>
              <dd className="text-navy mt-0.5">{apt.unit ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Dispozice</dt>
              <dd className="text-navy mt-0.5">{apt.layout ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Plocha</dt>
              <dd className="text-navy mt-0.5">{apt.area_m2 != null ? `${apt.area_m2} m²` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Patro</dt>
              <dd className="text-navy mt-0.5">{apt.floor != null ? apt.floor : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Max. hostů</dt>
              <dd className="text-navy mt-0.5">{apt.max_guests != null ? apt.max_guests : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Orientace</dt>
              <dd className="text-navy mt-0.5">{apt.orientation ?? '—'}</dd>
            </div>
          </dl>
          {apt.description && (
            <div className="pt-3 border-t border-stone">
              <dt className="text-xs text-slate-400 mb-1">Popis</dt>
              <dd className="text-sm text-slate-600 leading-relaxed">{apt.description}</dd>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Features / tagy ─────────────────────────────────────────────

export function FeaturesSection({ apt }: { apt: Apartment }) {
  const [tags, setTags] = useState<string[]>(apt.features ?? []);
  const [newTag, setNewTag] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function save(next: string[]) {
    setError('');
    startTransition(async () => {
      const res = await updateApartmentFeatures(apt.id, next);
      if (!res.ok) { setError(res.error ?? 'Chyba'); }
    });
  }

  function handleAdd() {
    const tag = newTag.trim().toLowerCase();
    if (!tag || tags.includes(tag)) { setNewTag(''); return; }
    const next = [...tags, tag];
    setTags(next);
    setNewTag('');
    save(next);
  }

  function handleRemove(tag: string) {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    save(next);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  }

  return (
    <div className="bg-white border border-stone p-6 mb-6">
      <div className="text-sm font-medium text-navy mb-4 pb-3 border-b border-stone">Vybavení a vlastnosti</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-stone text-navy text-xs px-2.5 py-1">
            {tag}
            <button
              onClick={() => handleRemove(tag)}
              disabled={isPending}
              className="text-slate-400 hover:text-red-500 transition-colors ml-1 disabled:opacity-50"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-400">Žádné vlastnosti</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="wifi, parking, balcony…"
          className="border border-stone px-3 py-1.5 text-xs text-navy focus:outline-none focus:border-gold w-48"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newTag.trim()}
          className="bg-navy text-white text-xs px-3 py-1.5 disabled:opacity-50"
        >
          + Přidat
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}

// ─── Sezónní ceníky ───────────────────────────────────────────────

export function PricingRulesSection({ aptId, rules }: { aptId: string; rules: PricingRule[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleDelete(ruleId: string) {
    startTransition(async () => {
      await deletePricingRuleForApt(ruleId, aptId);
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addPricingRule(aptId, fd);
      if (!res.ok) { setError(res.error ?? 'Chyba'); return; }
      setAddOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <div className="bg-white border border-stone p-6 mb-6">
      <div className="flex items-center justify-between text-sm font-medium text-navy mb-4 pb-3 border-b border-stone">
        <span>Sezónní ceníky</span>
        {!addOpen && (
          <button onClick={() => setAddOpen(true)} className="text-xs text-slate-400 hover:text-navy transition-colors">
            + Přidat pravidlo
          </button>
        )}
      </div>

      {rules.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-stone text-left">
                <th className="pb-2 text-xs text-slate-400 font-normal">Název</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Od</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Do</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Cena / noc</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Min. nocí</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td className="py-2.5 text-navy text-xs">{rule.name ?? '—'}</td>
                  <td className="py-2.5 text-slate-600 text-xs">{fmtDate(rule.start_date)}</td>
                  <td className="py-2.5 text-slate-600 text-xs">{fmtDate(rule.end_date)}</td>
                  <td className="py-2.5 text-navy text-xs">{fmtCents(rule.price_per_night_cents)}</td>
                  <td className="py-2.5 text-slate-600 text-xs">{rule.min_nights ?? 2}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={isPending}
                      className="text-slate-400 hover:text-red-500 text-xs transition-colors disabled:opacity-50"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-4">Žádná sezónní pravidla — platí základní cena.</p>
      )}

      {addOpen && (
        <form onSubmit={handleAdd} className="border-t border-stone pt-4 space-y-3">
          <p className="text-xs font-medium text-navy">Nové pravidlo</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Název *</label>
              <input name="name" required placeholder="Jarní prázdniny" className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Od *</label>
              <input name="start_date" type="date" required className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Do *</label>
              <input name="end_date" type="date" required className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cena (Kč/noc) *</label>
              <input name="price_per_night_kc" type="number" min="1" required placeholder="3500" className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min. nocí</label>
              <input name="min_nights" type="number" min="1" placeholder="2" defaultValue="2" className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="bg-navy text-white text-xs px-3 py-1.5 disabled:opacity-50">
              {isPending ? 'Ukládám…' : 'Uložit'}
            </button>
            <button type="button" onClick={() => { setAddOpen(false); setError(''); }} className="text-slate-400 hover:text-navy text-xs">Zrušit</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Blokace termínů ──────────────────────────────────────────────

export function BlockedDatesSection({ aptId, blocks }: { aptId: string; blocks: BlockedDate[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleDelete(blockId: string) {
    startTransition(async () => {
      await deleteBlock(blockId, aptId);
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addBlock(aptId, fd);
      if (!res.ok) { setError(res.error ?? 'Chyba'); return; }
      setAddOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <div className="bg-white border border-stone p-6 mb-6">
      <div className="flex items-center justify-between text-sm font-medium text-navy mb-4 pb-3 border-b border-stone">
        <span>Blokace termínů</span>
        {!addOpen && (
          <button onClick={() => setAddOpen(true)} className="text-xs text-slate-400 hover:text-navy transition-colors">
            + Přidat blokaci
          </button>
        )}
      </div>

      {blocks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-stone text-left">
                <th className="pb-2 text-xs text-slate-400 font-normal">Od</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Do</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Důvod</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {blocks.map(block => (
                <tr key={block.id}>
                  <td className="py-2.5 text-slate-600 text-xs">{fmtDate(block.start_date)}</td>
                  <td className="py-2.5 text-slate-600 text-xs">{fmtDate(block.end_date)}</td>
                  <td className="py-2.5 text-navy text-xs">{reasonLabels[block.reason ?? ''] ?? block.reason ?? '—'}</td>
                  <td className="py-2.5">
                    <button
                      onClick={() => handleDelete(block.id)}
                      disabled={isPending}
                      className="text-slate-400 hover:text-red-500 text-xs transition-colors disabled:opacity-50"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-4">Žádné blokace.</p>
      )}

      {addOpen && (
        <form onSubmit={handleAdd} className="border-t border-stone pt-4 space-y-3">
          <p className="text-xs font-medium text-navy">Nová blokace</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Od *</label>
              <input name="start_date" type="date" required className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Do *</label>
              <input name="end_date" type="date" required className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Důvod</label>
              <select name="reason" className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold">
                <option value="maintenance">Údržba</option>
                <option value="owner_use">Vlastní využití</option>
                <option value="other">Jiné</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Poznámka</label>
              <input name="note" placeholder="Volitelná poznámka" className="w-full border border-stone px-2 py-1.5 text-xs text-navy focus:outline-none focus:border-gold" />
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="bg-navy text-white text-xs px-3 py-1.5 disabled:opacity-50">
              {isPending ? 'Ukládám…' : 'Uložit'}
            </button>
            <button type="button" onClick={() => { setAddOpen(false); setError(''); }} className="text-slate-400 hover:text-navy text-xs">Zrušit</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Poslední rezervace ───────────────────────────────────────────

export function RecentBookingsSection({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="bg-white border border-stone p-6 mb-6">
      <div className="text-sm font-medium text-navy mb-4 pb-3 border-b border-stone">Poslední rezervace</div>

      {bookings.length === 0 ? (
        <p className="text-xs text-slate-400">Žádné rezervace.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left">
                <th className="pb-2 text-xs text-slate-400 font-normal">Host</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Termín</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Nocí</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Částka</th>
                <th className="pb-2 text-xs text-slate-400 font-normal">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="py-2.5 text-navy text-xs">
                    {[b.guest_first_name, b.guest_last_name].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="py-2.5 text-slate-600 text-xs whitespace-nowrap">
                    {fmtDate(b.check_in)} – {fmtDate(b.check_out)}
                  </td>
                  <td className="py-2.5 text-slate-600 text-xs">{b.nights ?? '—'}</td>
                  <td className="py-2.5 text-navy text-xs">{fmtCents(b.total_amount_cents)}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {statusLabels[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <a
                      href={`/admin/rezervace/${b.id}`}
                      className="text-xs text-slate-400 hover:text-navy transition-colors whitespace-nowrap"
                    >
                      Detail →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
