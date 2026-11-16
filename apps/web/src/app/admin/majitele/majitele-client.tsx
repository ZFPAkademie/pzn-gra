'use client';

import { useState, useTransition } from 'react';
import { createOwner, sendMagicLink, updateOwnerCommission, toggleOwnerActive, updateOwner, deleteOwner } from './actions';

/** 0.2 → "20", 0.125 → "12.5" (DB vrací numeric jako string, proto Number() u volajícího) */
function formatPercent(rate: number): string {
  return String(Math.round(rate * 1000) / 10);
}

interface ApartmentOption {
  id: string;
  label: string;
  /** Stávající majitelé apartmánu (bez upravovaného) — apartmán lze sdílet, např. manželé */
  ownerNames: string[];
}

/** Zaškrtávací seznam apartmánů — majitel může mít víc apartmánů, apartmán víc majitelů. */
function ApartmentPicker({ apartments, selected = [] }: { apartments: ApartmentOption[]; selected?: string[] }) {
  if (apartments.length === 0) {
    return <p className="text-xs text-slate-400">Žádné apartmány v evidenci.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-60 overflow-y-auto border border-stone bg-white p-2">
      <input type="hidden" name="apartments_submitted" value="1" />
      {apartments.map(a => (
        <label key={a.id} className="flex items-start gap-2 py-1.5 px-1 text-sm text-navy cursor-pointer hover:bg-stone/50">
          <input
            type="checkbox"
            name="apartment_ids"
            value={a.id}
            defaultChecked={selected.includes(a.id)}
            className="mt-0.5 h-4 w-4 accent-navy shrink-0"
          />
          <span className="min-w-0">
            <span className="block">{a.label}</span>
            {a.ownerNames.length > 0 && (
              <span className="block text-xs text-slate-400 truncate">majitel: {a.ownerNames.join(', ')}</span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}

export function AddOwnerForm({ apartments }: { apartments: ApartmentOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createOwner(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-navy text-white text-sm font-light tracking-wide hover:bg-navy/90 transition-colors">
        Přidat majitele
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone p-6 space-y-4">
      <h3 className="text-sm font-medium text-navy">Nový majitel</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Jméno a příjmení *</label>
          <input name="name" required className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">E-mail *</label>
          <input type="email" name="email" required className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Telefon</label>
          <input name="phone" placeholder="+420 777 000 000" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Provize (%)</label>
          <input type="number" name="commission_rate" min="0" max="100" step="0.5" placeholder="20" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Apartmány</label>
          <ApartmentPicker apartments={apartments} />
          <p className="text-xs text-slate-400 mt-1">
            Můžete vybrat víc apartmánů. Apartmán, který už majitele má, bude sdílený — např. manželé, každý s vlastním přístupem do portálu.
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 disabled:opacity-50">
          {isPending ? 'Ukládám…' : 'Uložit'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-navy">
          Zrušit
        </button>
      </div>
    </form>
  );
}

export function InviteButton({ ownerId, email, hasPortalAccess }: { ownerId: string; email: string; hasPortalAccess: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [magicLink, setMagicLink] = useState('');
  const [error, setError] = useState('');

  function handleInvite() {
    setError('');
    setMagicLink('');
    startTransition(async () => {
      const result = await sendMagicLink(ownerId, email);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      if (result.magicLink) setMagicLink(result.magicLink);
    });
  }

  if (magicLink) {
    return (
      <div className="mt-2 p-3 bg-green-50 border border-green-200 text-xs space-y-1">
        <p className="text-green-700 font-medium">Magic link vygenerován</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={magicLink}
            className="flex-1 border border-stone px-2 py-1 text-xs text-slate-600 bg-white"
          />
          <button
            onClick={() => navigator.clipboard.writeText(magicLink)}
            className="text-xs px-2 py-1 bg-navy text-white hover:bg-navy/90"
          >
            Kopírovat
          </button>
        </div>
        <p className="text-green-600">Platí 7 dní. Pošli majiteli e-mailem nebo zkopíruj odkaz.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleInvite}
        disabled={isPending}
        className="text-xs px-3 py-1.5 border border-navy text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-50"
      >
        {isPending ? 'Generuji…' : hasPortalAccess ? 'Znovu pozvat' : 'Pozvat do portálu'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function CommissionEditor({ ownerId, currentRate }: { ownerId: string; currentRate: number | null }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const currentPercent = currentRate != null ? formatPercent(Number(currentRate)) : '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const val = parseFloat(String(fd.get('commission') ?? '').replace(',', '.'));
    if (isNaN(val)) { setError('Zadejte číslo'); return; }
    startTransition(async () => {
      const result = await updateOwnerCommission(ownerId, val);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Upravit provizi"
        className="text-xs text-navy border-b border-dashed border-slate-400 hover:border-navy"
      >
        {currentPercent ? `${currentPercent} %` : 'nastavit'}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        name="commission"
        type="number"
        defaultValue={currentPercent}
        min="0"
        max="100"
        step="0.5"
        className="w-16 border border-stone px-1 py-0.5 text-xs text-navy"
        autoFocus
      />
      <span className="text-xs text-slate-400">%</span>
      <button type="submit" disabled={isPending} className="text-xs text-navy hover:text-navy/70">
        {isPending ? '…' : 'OK'}
      </button>
      <button type="button" onClick={() => { setEditing(false); setError(''); }} className="text-xs text-slate-400">zrušit</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}

export function ToggleActiveButton({ ownerId, isActive }: { ownerId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(async () => { await toggleOwnerActive(ownerId, !isActive); });
      }}
      disabled={isPending}
      className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} disabled:opacity-50`}
    >
      {isActive ? 'aktivní' : 'neaktivní'}
    </button>
  );
}

export function EditOwnerForm({
  owner,
  apartments,
  selectedApartmentIds,
}: {
  owner: { id: string; name: string; email: string; phone: string | null; commission_rate: number | null };
  apartments: ApartmentOption[];
  selectedApartmentIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOwner(owner.id, fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-slate-400 hover:text-navy transition-colors">
        Upravit
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-stone border border-stone space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Jméno *</label>
          <input name="name" required defaultValue={owner.name} className="w-full border border-stone px-3 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Email *</label>
          <input type="email" name="email" required defaultValue={owner.email} className="w-full border border-stone px-3 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Telefon</label>
          <input name="phone" defaultValue={owner.phone ?? ''} className="w-full border border-stone px-3 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Provize (%)</label>
          <input
            type="number"
            name="commission_rate"
            min="0"
            max="100"
            step="0.5"
            defaultValue={owner.commission_rate != null ? formatPercent(Number(owner.commission_rate)) : ''}
            placeholder="např. 20"
            className="w-full border border-stone px-3 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Apartmány</label>
        <ApartmentPicker apartments={apartments} selected={selectedApartmentIds} />
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="px-3 py-1.5 bg-navy text-white text-xs hover:bg-navy/90 disabled:opacity-50">
          {isPending ? 'Ukládám…' : 'Uložit'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-navy">Zrušit</button>
      </div>
    </form>
  );
}

export function DeleteOwnerButton({ ownerId, name }: { ownerId: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Deaktivovat majitele "${name}"? Apartmány budou odpojeny (případní spolumajitelé zůstávají).`)) return;
    startTransition(async () => { await deleteOwner(ownerId); });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {isPending ? '…' : 'Smazat'}
    </button>
  );
}
