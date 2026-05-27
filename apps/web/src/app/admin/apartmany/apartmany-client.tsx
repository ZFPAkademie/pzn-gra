'use client';

import { useTransition, useState } from 'react';
import {
  updateApartmentFlags,
  updateApartmentOwner,
  updateApartmentBasePrice,
  createApartment,
} from './actions';

interface Owner { id: string; name: string; email: string }
interface Apartment {
  id: string;
  slug: string;
  title: string | null;
  unit: string | null;
  building: string | null;
  layout: string | null;
  area_m2: number | null;
  floor: number | null;
  status: string;
  for_sale: boolean;
  for_rent: boolean;
  in_rental_program: boolean;
  owner_id: string | null;
  base_price_cents: number | null;
}

// ─── Toggle přepínač ──────────────────────────────────────────────

export function FlagToggle({
  aptId,
  field,
  value,
  label,
}: {
  aptId: string;
  field: 'for_sale' | 'for_rent' | 'in_rental_program';
  value: boolean;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);

  function toggle() {
    const next = !current;
    setCurrent(next);
    startTransition(async () => {
      const res = await updateApartmentFlags(aptId, { [field]: next });
      if (!res.ok) setCurrent(current); // rollback on error
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={label}
      className={`w-8 h-4 rounded-full transition-colors relative disabled:opacity-60 ${
        current ? 'bg-navy' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
          current ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ─── Přiřazení majitele ───────────────────────────────────────────

export function OwnerSelect({
  aptId,
  currentOwnerId,
  owners,
}: {
  aptId: string;
  currentOwnerId: string | null;
  owners: Owner[];
}) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(currentOwnerId ?? '');

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    startTransition(async () => {
      await updateApartmentOwner(aptId, next || null);
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs border border-stone px-2 py-1 text-navy focus:outline-none focus:border-gold disabled:opacity-50 max-w-[160px]"
    >
      <option value="">— bez majitele —</option>
      {owners.map(o => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}

// ─── Základní cena ────────────────────────────────────────────────

export function BasePriceEditor({
  aptId,
  currentCents,
}: {
  aptId: string;
  currentCents: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentKc = currentCents != null ? (currentCents / 100).toLocaleString('cs-CZ') : '—';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const val = parseFloat((new FormData(e.currentTarget).get('price') as string).replace(/\s/g, '').replace(',', '.'));
    if (isNaN(val)) return;
    startTransition(async () => {
      await updateApartmentBasePrice(aptId, val);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs text-slate-500 hover:text-navy whitespace-nowrap">
        {currentCents ? `${currentKc} Kč` : 'nastavit cenu'}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        name="price"
        type="number"
        defaultValue={currentCents ? currentCents / 100 : ''}
        min="1"
        className="w-20 border border-stone px-1 py-0.5 text-xs text-navy"
        autoFocus
      />
      <span className="text-xs text-slate-400">Kč</span>
      <button type="submit" disabled={isPending} className="text-xs text-navy">
        {isPending ? '…' : 'OK'}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400">×</button>
    </form>
  );
}

// ─── Tabulka apartmánů ────────────────────────────────────────────

export function ApartmanyTable({
  apartments,
  owners,
}: {
  apartments: Apartment[];
  owners: Owner[];
}) {
  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    reserved: 'bg-amber-100 text-amber-700',
    sold: 'bg-slate-100 text-slate-600',
  };
  const statusLabels: Record<string, string> = {
    available: 'volný',
    reserved: 'rezervováno',
    sold: 'prodáno',
  };

  return (
    <div className="bg-white border border-stone overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone text-left">
            <th className="px-4 py-3 text-xs text-slate-500 font-normal">Apartmán</th>
            <th className="px-4 py-3 text-xs text-slate-500 font-normal">Status</th>
            <th className="px-4 py-3 text-xs text-slate-500 font-normal">Majitel</th>
            <th className="px-4 py-3 text-xs text-slate-500 font-normal text-center">Prodej</th>
            <th className="px-4 py-3 text-xs text-slate-500 font-normal text-center">Pronájem</th>
            <th className="px-4 py-3 text-xs text-slate-500 font-normal text-center">Rental prog.</th>
            <th className="px-4 py-3 text-xs text-slate-500 font-normal">Základ. cena</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone">
          {apartments.map(apt => (
            <tr key={apt.id} className="hover:bg-stone/30">
              <td className="px-4 py-3">
                <div>
                  <span className="text-navy font-light">{apt.title ?? apt.slug}</span>
                  {apt.layout && <span className="text-slate-400 text-xs ml-2">{apt.layout}</span>}
                  {apt.area_m2 && <span className="text-slate-400 text-xs ml-1">· {apt.area_m2} m²</span>}
                </div>
                <div className="text-slate-400 text-xs">{apt.slug}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[apt.status] ?? ''}`}>
                  {statusLabels[apt.status] ?? apt.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <OwnerSelect aptId={apt.id} currentOwnerId={apt.owner_id} owners={owners} />
              </td>
              <td className="px-4 py-3 text-center">
                <FlagToggle aptId={apt.id} field="for_sale" value={apt.for_sale} label="Zobrazit v sekci Prodej" />
              </td>
              <td className="px-4 py-3 text-center">
                <FlagToggle aptId={apt.id} field="for_rent" value={apt.for_rent} label="Zobrazit v sekci Pronájem" />
              </td>
              <td className="px-4 py-3 text-center">
                <FlagToggle aptId={apt.id} field="in_rental_program" value={apt.in_rental_program} label="Aktivní v booking engine" />
              </td>
              <td className="px-4 py-3">
                <BasePriceEditor aptId={apt.id} currentCents={apt.base_price_cents} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Přidat apartmán ─────────────────────────────────────────────

export function AddApartmentForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createApartment(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 border border-navy text-navy text-sm font-light hover:bg-navy hover:text-white transition-colors">
        + Přidat apartmán
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone p-6 space-y-4">
      <h3 className="text-sm font-medium text-navy">Nový apartmán</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Slug (URL) *</label>
          <input name="slug" required placeholder="golden-ridge-5" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Název *</label>
          <input name="title" required placeholder="Golden Ridge apartmán č. 5" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Číslo jednotky</label>
          <input name="unit" placeholder="5" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Chata/budova</label>
          <input name="building" placeholder="Golden Ridge" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Dispozice</label>
          <input name="layout" placeholder="1+kk" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Plocha (m²)</label>
          <input type="number" name="area_m2" step="0.01" placeholder="38.44" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Patro</label>
          <input type="number" name="floor" min="0" placeholder="2" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Základní cena (Kč/noc)</label>
          <input type="number" name="base_price_kc" min="1" placeholder="2500" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 disabled:opacity-50">
          {isPending ? 'Ukládám…' : 'Uložit'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-navy">Zrušit</button>
      </div>
    </form>
  );
}
