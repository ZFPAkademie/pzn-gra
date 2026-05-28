'use client';

import { useState, useTransition } from 'react';
import { createPricingRule, deletePricingRule, updatePricingRule } from './actions';

interface Apartment {
  id: string;
  slug: string;
  title: string | null;
}

interface PricingRule {
  id: string;
  apartment_id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night_cents: number;
  min_nights: number;
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatKc(cents: number) {
  return (cents / 100).toLocaleString('cs-CZ') + ' Kč';
}

export function AddRuleForm({ apartments }: { apartments: Apartment[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPricingRule(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-navy text-white text-sm font-light tracking-wide hover:bg-navy/90 transition-colors"
      >
        Přidat pravidlo
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone p-6 space-y-4">
      <h3 className="text-sm font-medium text-navy">Nové cenové pravidlo</h3>

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
          <label className="block text-xs text-slate-500 mb-1">Název sezóny</label>
          <input name="name" required placeholder="Zimní hlavní sezóna" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Od</label>
          <input type="date" name="start_date" required className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Do</label>
          <input type="date" name="end_date" required className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Cena za noc (Kč)</label>
          <input type="number" name="price_per_night_kc" required min="1" placeholder="3500" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Min. nocí</label>
          <input type="number" name="min_nights" defaultValue="2" min="1" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
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

export function DeleteRuleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('Smazat toto cenové pravidlo?')) return;
    startTransition(async () => { await deletePricingRule(id); });
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
      {isPending ? 'Mažu…' : 'Smazat'}
    </button>
  );
}

function EditRuleForm({ rule, onClose }: { rule: PricingRule; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePricingRule(rule.id, fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 bg-stone border-t border-stone space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Název</label>
          <input name="name" required defaultValue={rule.name} className="w-full border border-stone px-2 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Od</label>
          <input type="date" name="start_date" required defaultValue={rule.start_date} className="w-full border border-stone px-2 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Do</label>
          <input type="date" name="end_date" required defaultValue={rule.end_date} className="w-full border border-stone px-2 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Cena / noc (Kč)</label>
          <input type="number" name="price_per_night_kc" required min="1" defaultValue={rule.price_per_night_cents / 100} className="w-full border border-stone px-2 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Min. nocí</label>
          <input type="number" name="min_nights" min="1" defaultValue={rule.min_nights} className="w-full border border-stone px-2 py-1.5 text-sm text-navy focus:outline-none focus:border-gold bg-white" />
        </div>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="px-3 py-1.5 bg-navy text-white text-xs hover:bg-navy/90 disabled:opacity-50">
          {isPending ? 'Ukládám…' : 'Uložit'}
        </button>
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-slate-500 hover:text-navy">Zrušit</button>
      </div>
    </form>
  );
}

function RuleRow({ rule, aptName }: { rule: PricingRule; aptName: string }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white border border-stone">
      {/* Mobile layout */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="text-sm text-navy font-medium">{rule.name}</div>
            <div className="text-xs text-slate-400">{aptName}</div>
          </div>
          <span className="text-sm text-gold font-medium whitespace-nowrap">{formatKc(rule.price_per_night_cents)}</span>
        </div>
        <div className="text-xs text-slate-500">{formatDate(rule.start_date)} – {formatDate(rule.end_date)} · min. {rule.min_nights} noci</div>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setEditing(!editing)} className="text-xs text-slate-400 hover:text-navy">
            {editing ? 'Zavřít' : 'Upravit'}
          </button>
          <DeleteRuleButton id={rule.id} />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex px-4 py-3 items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xs text-slate-400 w-40 truncate">{aptName}</span>
          <span className="text-sm text-navy font-medium w-48">{rule.name}</span>
          <span className="text-xs text-slate-500">{formatDate(rule.start_date)} – {formatDate(rule.end_date)}</span>
          <span className="text-sm text-gold font-medium">{formatKc(rule.price_per_night_cents)} / noc</span>
          <span className="text-xs text-slate-400">min. {rule.min_nights} noci</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setEditing(!editing)} className="text-xs text-slate-400 hover:text-navy transition-colors">
            {editing ? 'Zavřít' : 'Upravit'}
          </button>
          <DeleteRuleButton id={rule.id} />
        </div>
      </div>

      {editing && <EditRuleForm rule={rule} onClose={() => setEditing(false)} />}
    </div>
  );
}

export function RulesList({ rules, apartments }: { rules: PricingRule[]; apartments: Apartment[] }) {
  const aptMap = Object.fromEntries(apartments.map(a => [a.id, a.title ?? a.slug]));

  if (rules.length === 0) {
    return <p className="text-sm text-slate-400 py-8 text-center">Žádná cenová pravidla</p>;
  }

  return (
    <div className="space-y-2">
      {rules.map(rule => (
        <RuleRow key={rule.id} rule={rule} aptName={aptMap[rule.apartment_id] ?? rule.apartment_id} />
      ))}
    </div>
  );
}
