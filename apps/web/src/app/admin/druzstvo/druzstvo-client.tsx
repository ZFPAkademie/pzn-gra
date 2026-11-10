'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  COOP_EVENT_KINDS_MANUAL,
  COOP_FILE_ACCEPT,
  COOP_FILE_CATEGORIES,
  COOP_FILE_MAX_BYTES,
  COOP_FILE_TYPES,
  COOP_SOURCES,
  COOP_STATUSES,
  COOP_TOTAL_SHARES,
  coopEventLabels,
  coopFileCategoryLabels,
  coopSourceLabels,
  coopStatusLabels,
  fileExtension,
  formatDateTime,
  formatFileSize,
  type CoopStatus,
} from '@/lib/coop-shared';
import {
  addCoopEvent,
  archiveCoopContact,
  createCoopContact,
  createCoopFileUploadUrl,
  deleteCoopEvent,
  deleteCoopFile,
  saveCoopFile,
  setCoopStatus,
  updateCoopContact,
  updateCoopFile,
} from './actions';

// ───────────────────────────────────────────────────────────────────
// Typy (řádky z DB předané ze serverové stránky)
// ───────────────────────────────────────────────────────────────────

export interface CoopContactRow {
  id: string;
  status: CoopStatus;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  birth_date: string | null;
  company_name: string | null;
  company_id: string | null;
  share_count: number | null;
  source: string;
  referred_by: string | null;
  assigned_to: string | null;
  next_step: string | null;
  next_step_date: string | null;
  reserved_at: string | null;
  contract_signed_at: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  gdpr_consent: boolean;
  gdpr_consent_at: string | null;
  marketing_consent: boolean;
  notes: string | null;
  archived_at: string | null;
}

export interface CoopFileRow {
  id: string;
  category: string;
  title: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface CoopEventRow {
  id: string;
  kind: string;
  body: string | null;
  old_status: string | null;
  new_status: string | null;
  occurred_at: string;
}

// Barvy stavů — musí být v src/app, Tailwind src/lib neprochází (třídy by se nevygenerovaly)
const coopStatusColors: Record<CoopStatus, string> = {
  new: 'bg-sky-50 text-sky-800 border-sky-200',
  contacted: 'bg-amber-50 text-amber-800 border-amber-200',
  reservation: 'bg-violet-50 text-violet-800 border-violet-200',
  owner: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
};

const inputCls =
  'w-full border border-slate-200 bg-white px-3 py-2 text-base md:text-sm text-navy focus:outline-none focus:border-gold';
const labelCls = 'block text-xs text-slate-500 mb-1';
const btnPrimary =
  'px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 disabled:opacity-40 transition-colors';
const btnGhost = 'px-3 py-2 text-sm text-slate-500 hover:text-navy disabled:opacity-40';

// ───────────────────────────────────────────────────────────────────
// Datum — tři selecty (Den / Měsíc / Rok) místo <input type="date"> (vzor H)
// ───────────────────────────────────────────────────────────────────

const MONTHS = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

function DateSelect({
  name,
  defaultValue,
  yearFrom,
  yearTo,
}: {
  name: string;
  defaultValue: string | null;
  yearFrom: number;
  yearTo: number;
}) {
  const [y0, m0, d0] = (defaultValue ?? '').split('-');
  const [d, setD] = useState(d0 ? String(parseInt(d0, 10)) : '');
  const [m, setM] = useState(m0 ? String(parseInt(m0, 10)) : '');
  const [y, setY] = useState(y0 ?? '');

  const value = d && m && y ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : '';
  const years: number[] = [];
  for (let i = yearTo; i >= yearFrom; i--) years.push(i);

  const sel = 'border border-slate-200 bg-white px-2 py-2 text-base md:text-sm text-navy focus:outline-none focus:border-gold';

  return (
    <div className="flex gap-1.5 items-center">
      <input type="hidden" name={name} value={value} />
      <select aria-label="Den" value={d} onChange={(e) => setD(e.target.value)} className={`${sel} w-[4.5rem]`}>
        <option value="">den</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}.</option>
        ))}
      </select>
      <select aria-label="Měsíc" value={m} onChange={(e) => setM(e.target.value)} className={`${sel} w-[5rem]`}>
        <option value="">měs.</option>
        {MONTHS.map((label, i) => (
          <option key={label} value={i + 1}>{label}</option>
        ))}
      </select>
      <select aria-label="Rok" value={y} onChange={(e) => setY(e.target.value)} className={`${sel} w-[5.5rem]`}>
        <option value="">rok</option>
        {years.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      {(d || m || y) && (
        <button type="button" onClick={() => { setD(''); setM(''); setY(''); }} className="text-xs text-slate-400 hover:text-navy px-1" aria-label="Vymazat datum">
          ×
        </button>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Formulář kontaktu (nový i úprava)
// ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-slate-100 pt-4">
      <legend className="text-xs uppercase tracking-widest text-slate-400 pr-2">{title}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : undefined}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function CoopContactForm({
  contact,
  onSaved,
  onCancel,
}: {
  contact?: CoopContactRow;
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}) {
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const thisYear = new Date().getFullYear();
  const c = contact;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (c) {
        const res = await updateCoopContact(c.id, fd);
        if (!res.ok) { setError(res.error); return; }
        setSaved(true);
        router.refresh();
        onSaved?.(c.id);
      } else {
        const res = await createCoopContact(fd);
        if (!res.ok) { setError(res.error); return; }
        onSaved?.(res.id);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="Osoba">
        <Field label="Jméno *">
          <input name="first_name" required defaultValue={c?.first_name ?? ''} className={inputCls} autoComplete="off" />
        </Field>
        <Field label="Příjmení">
          <input name="last_name" defaultValue={c?.last_name ?? ''} className={inputCls} autoComplete="off" />
        </Field>
        <Field label="Datum narození">
          <DateSelect name="birth_date" defaultValue={c?.birth_date ?? null} yearFrom={1920} yearTo={thisYear - 15} />
        </Field>
        <Field label="E-mail">
          <input name="email" type="email" defaultValue={c?.email ?? ''} className={inputCls} autoComplete="off" />
        </Field>
        <Field label="Telefon">
          <input name="phone" type="tel" defaultValue={c?.phone ?? ''} className={inputCls} autoComplete="off" />
        </Field>
        <div className="hidden lg:block" />
        <Field label="Ulice a číslo">
          <input name="street" defaultValue={c?.street ?? ''} className={inputCls} autoComplete="off" />
        </Field>
        <Field label="Město">
          <input name="city" defaultValue={c?.city ?? ''} className={inputCls} autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="PSČ">
            <input name="postal_code" defaultValue={c?.postal_code ?? ''} className={inputCls} autoComplete="off" />
          </Field>
          <Field label="Stát">
            <input name="country" defaultValue={c?.country ?? ''} placeholder="Česko" className={inputCls} autoComplete="off" />
          </Field>
        </div>
      </Section>

      <Section title="Firma (kupuje-li právnická osoba)">
        <Field label="Název firmy">
          <input name="company_name" defaultValue={c?.company_name ?? ''} className={inputCls} autoComplete="off" />
        </Field>
        <Field label="IČO">
          <input name="company_id" defaultValue={c?.company_id ?? ''} inputMode="numeric" className={inputCls} autoComplete="off" />
        </Field>
      </Section>

      <Section title="Obchod">
        <Field label={`Počet podílů (z ${COOP_TOTAL_SHARES})`}>
          <input name="share_count" type="number" min={1} max={COOP_TOTAL_SHARES} defaultValue={c?.share_count ?? ''} className={inputCls} />
        </Field>
        {!c && (
          <Field label="Stav">
            <select name="status" defaultValue="new" className={inputCls}>
              {COOP_STATUSES.map((s) => (
                <option key={s} value={s}>{coopStatusLabels[s]}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Zdroj">
          <select name="source" defaultValue={c?.source ?? 'other'} className={inputCls}>
            {COOP_SOURCES.map((s) => (
              <option key={s} value={s}>{coopSourceLabels[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Kdo kontakt přivedl">
          <input name="referred_by" defaultValue={c?.referred_by ?? ''} placeholder="jméno poradce / doporučitele" className={inputCls} autoComplete="off" />
        </Field>
        <Field label="Kdo má kontakt na starosti">
          <input name="assigned_to" defaultValue={c?.assigned_to ?? ''} className={inputCls} autoComplete="off" />
        </Field>
      </Section>

      <Section title="Postup">
        <Field label="Další krok" wide>
          <input name="next_step" defaultValue={c?.next_step ?? ''} placeholder="např. poslat přihlášku, domluvit schůzku" className={inputCls} autoComplete="off" />
        </Field>
        <Field label="Termín dalšího kroku">
          <DateSelect name="next_step_date" defaultValue={c?.next_step_date ?? null} yearFrom={thisYear - 2} yearTo={thisYear + 3} />
        </Field>
        <Field label="Datum rezervace">
          <DateSelect name="reserved_at" defaultValue={c?.reserved_at ?? null} yearFrom={thisYear - 5} yearTo={thisYear + 1} />
        </Field>
        <Field label="Datum podpisu smlouvy">
          <DateSelect name="contract_signed_at" defaultValue={c?.contract_signed_at ?? null} yearFrom={thisYear - 5} yearTo={thisYear + 1} />
        </Field>
        <Field label="Datum úhrady">
          <DateSelect name="paid_at" defaultValue={c?.paid_at ?? null} yearFrom={thisYear - 5} yearTo={thisYear + 1} />
        </Field>
        <Field label="Uhrazená částka (Kč)">
          <input name="paid_amount" inputMode="decimal" defaultValue={c?.paid_amount ?? ''} className={inputCls} autoComplete="off" />
        </Field>
      </Section>

      <Section title="Souhlasy a poznámka">
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-2">
          <label className="flex items-start gap-2 text-sm text-navy">
            <input type="checkbox" name="gdpr_consent" defaultChecked={c?.gdpr_consent ?? false} className="mt-1 accent-navy" />
            <span>
              Souhlas se zpracováním osobních údajů
              {c?.gdpr_consent_at && (
                <span className="text-xs text-slate-400"> · udělen {formatDateTime(c.gdpr_consent_at)}</span>
              )}
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-navy">
            <input type="checkbox" name="marketing_consent" defaultChecked={c?.marketing_consent ?? false} className="mt-1 accent-navy" />
            <span>Souhlas s obchodními sděleními</span>
          </label>
        </div>
        <Field label="Poznámka" wide>
          <textarea name="notes" rows={4} defaultValue={c?.notes ?? ''} className={inputCls} />
        </Field>
      </Section>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-emerald-700 text-sm">Uloženo.</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={btnPrimary}>
          {isPending ? 'Ukládám…' : c ? 'Uložit změny' : 'Založit kontakt'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnGhost}>
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}

export function NewCoopContact() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={btnPrimary}>
        Přidat kontakt
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 p-5 mb-6 w-full">
      <h2 className="text-lg font-light text-navy mb-4">Nový kontakt</h2>
      <CoopContactForm onSaved={(id) => router.push(`/admin/druzstvo/${id}`)} onCancel={() => setOpen(false)} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Stav
// ───────────────────────────────────────────────────────────────────

export function CoopStatusBadge({ status }: { status: CoopStatus }) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-xs whitespace-nowrap ${coopStatusColors[status]}`}>
      {coopStatusLabels[status]}
    </span>
  );
}

export function CoopStatusSwitcher({ contactId, status, disabled }: { contactId: string; status: CoopStatus; disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [target, setTarget] = useState<CoopStatus | null>(null);
  const [note, setNote] = useState('');

  function confirm() {
    if (!target) return;
    setError('');
    startTransition(async () => {
      const res = await setCoopStatus(contactId, target, note);
      if (!res.ok) { setError(res.error); return; }
      setTarget(null);
      setNote('');
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {COOP_STATUSES.map((s) => {
          const active = s === status;
          const selected = s === target;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled || isPending || active}
              onClick={() => { setTarget(s); setError(''); }}
              className={`border px-3 py-1.5 text-sm transition-colors min-h-[36px] ${
                active
                  ? `${coopStatusColors[s]} font-medium cursor-default`
                  : selected
                    ? 'border-navy text-navy bg-white'
                    : 'border-slate-200 text-slate-500 bg-white hover:border-navy hover:text-navy'
              } disabled:cursor-default`}
            >
              {coopStatusLabels[s]}
            </button>
          );
        })}
      </div>
      {target && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`Poznámka ke změně na „${coopStatusLabels[target]}“ (nepovinné)`}
            className={`${inputCls} flex-1`}
          />
          <div className="flex gap-2">
            <button onClick={confirm} disabled={isPending} className={btnPrimary}>
              {isPending ? 'Ukládám…' : 'Potvrdit'}
            </button>
            <button onClick={() => setTarget(null)} className={btnGhost}>Zrušit</button>
          </div>
        </div>
      )}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}

export function CoopArchiveButton({ contactId, archived }: { contactId: string; archived: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handle() {
    if (!archived && !window.confirm('Archivovat kontakt? Zmizí z výpisu a jeho podíly se přestanou počítat. Obnovit ho jde kdykoli.')) return;
    setError('');
    startTransition(async () => {
      const res = await archiveCoopContact(contactId, !archived);
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  }

  return (
    <span>
      <button onClick={handle} disabled={isPending} className="text-sm text-slate-400 hover:text-red-600 disabled:opacity-40">
        {archived ? 'Obnovit z archivu' : 'Archivovat'}
      </button>
      {error && <span className="text-red-600 text-xs ml-2">{error}</span>}
    </span>
  );
}

export function CoopEditToggle({ contact }: { contact: CoopContactRow }) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-sm text-slate-500 hover:text-navy underline underline-offset-4">
        Upravit údaje
      </button>
    );
  }
  return (
    <div className="bg-white border border-slate-200 p-5 mt-4">
      <CoopContactForm contact={contact} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Historie
// ───────────────────────────────────────────────────────────────────

export function CoopEventComposer({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<string>('call');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await addCoopEvent({ contactId, kind, body, occurredAt: when || null });
      if (!res.ok) { setError(res.error); return; }
      setBody('');
      setWhen('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {COOP_EVENT_KINDS_MANUAL.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`border px-3 py-1.5 text-sm min-h-[36px] ${kind === k ? 'border-navy text-navy' : 'border-slate-200 text-slate-500 hover:text-navy'}`}
          >
            {coopEventLabels[k]}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Co se domluvilo…"
        className={inputCls}
      />
      <div>
        <label className="block text-xs text-slate-500 mb-1">Kdy (prázdné = teď)</label>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={inputCls}
        />
      </div>
      <button type="submit" disabled={isPending || !body.trim()} className={`${btnPrimary} w-full`}>
        {isPending ? 'Ukládám…' : 'Přidat záznam'}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}

export function CoopEventItem({ event }: { event: CoopEventRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const manual = (COOP_EVENT_KINDS_MANUAL as readonly string[]).includes(event.kind);

  function handleDelete() {
    if (!window.confirm('Smazat záznam?')) return;
    startTransition(async () => {
      const res = await deleteCoopEvent(event.id);
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  }

  const statusText =
    event.kind === 'status' && event.new_status
      ? `${event.old_status ? coopStatusLabels[event.old_status as CoopStatus] ?? event.old_status : '—'} → ${coopStatusLabels[event.new_status as CoopStatus] ?? event.new_status}`
      : null;

  return (
    <li className="py-3 flex gap-3">
      <div className="w-1.5 shrink-0 flex justify-center pt-1.5">
        <span className={`block w-1.5 h-1.5 rounded-full ${manual ? 'bg-gold' : 'bg-slate-300'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">
          {formatDateTime(event.occurred_at)} · {coopEventLabels[event.kind] ?? event.kind}
          {statusText && <span className="text-navy"> · {statusText}</span>}
        </p>
        {event.body && <p className="text-sm text-navy whitespace-pre-line mt-0.5 break-words">{event.body}</p>}
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      </div>
      {manual && (
        <button onClick={handleDelete} disabled={isPending} className="text-xs text-slate-300 hover:text-red-600 self-start disabled:opacity-40">
          Smazat
        </button>
      )}
    </li>
  );
}

// ───────────────────────────────────────────────────────────────────
// Přílohy
// ───────────────────────────────────────────────────────────────────

export function CoopFileUpload({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [inputKey, setInputKey] = useState(0);

  function pick(f: File | null) {
    setError('');
    if (f) {
      if (!COOP_FILE_TYPES[fileExtension(f.name)]) { setError('Povolené jsou jen PDF, DOCX, JPG a PNG'); setFile(null); return; }
      if (f.size > COOP_FILE_MAX_BYTES) { setError(`Soubor je větší než ${COOP_FILE_MAX_BYTES / 1024 / 1024} MB`); setFile(null); return; }
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
    setFile(f);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await createCoopFileUploadUrl(contactId, file.name, file.size);
      if (!url.ok) { setError(url.error); return; }

      // Přímo z prohlížeče do Storage (FILE-01 — limit Vercelu 4,5 MB)
      const supabase = createSupabaseBrowserClient();
      const { error: upErr } = await supabase.storage
        .from('dokumenty')
        .uploadToSignedUrl(url.path, url.token, file, { contentType: COOP_FILE_TYPES[fileExtension(file.name)] });
      if (upErr) { setError('Nahrání selhalo: ' + upErr.message); return; }

      const saved = await saveCoopFile({ contactId, path: url.path, title, category });
      if (!saved.ok) { setError(saved.error); return; }

      setFile(null);
      setTitle('');
      setCategory('other');
      setInputKey((k) => k + 1);
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <label className={labelCls}>Soubor (PDF, DOCX, JPG, PNG, do {COOP_FILE_MAX_BYTES / 1024 / 1024} MB)</label>
        <input
          key={inputKey}
          type="file"
          accept={COOP_FILE_ACCEPT}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-2 file:border file:border-slate-200 file:bg-white file:text-navy file:text-sm"
        />
      </div>
      <div>
        <label className={labelCls}>Název</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Typ</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
          {COOP_FILE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{coopFileCategoryLabels[c]}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={uploading || !file} className={btnPrimary}>
          {uploading ? 'Nahrávám…' : 'Nahrát přílohu'}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </form>
  );
}

export function CoopFileItem({ file }: { file: CoopFileRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(file.title);
  const [category, setCategory] = useState(file.category);

  // Otevření i stažení jdou přes chráněnou adresu adminu → 302 na signed URL (soubor/[id]/route.ts)
  const fileHref = `/admin/druzstvo/soubor/${file.id}`;

  function save() {
    setError('');
    startTransition(async () => {
      const res = await updateCoopFile(file.id, { title, category });
      if (!res.ok) { setError(res.error); return; }
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Smazat přílohu „${file.title}“? Soubor bude odstraněn.`)) return;
    startTransition(async () => {
      const res = await deleteCoopFile(file.id);
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    });
  }

  const ext = (file.mime_type && Object.entries(COOP_FILE_TYPES).find(([, m]) => m === file.mime_type)?.[0]) || '';

  if (editing) {
    return (
      <li className="py-3 flex flex-col sm:flex-row gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} flex-1`} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} sm:w-48`}>
          {COOP_FILE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{coopFileCategoryLabels[c]}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={save} disabled={isPending} className={btnPrimary}>Uložit</button>
          <button onClick={() => setEditing(false)} className={btnGhost}>Zrušit</button>
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
      </li>
    );
  }

  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="min-w-0 flex-1">
        <a href={fileHref} target="_blank" rel="noopener noreferrer" className="text-sm text-navy hover:text-gold break-words">
          {file.title}
        </a>
        <p className="text-xs text-slate-400 mt-0.5">
          {coopFileCategoryLabels[file.category as keyof typeof coopFileCategoryLabels] ?? file.category}
          {ext && ` · ${ext.toUpperCase()}`}
          {file.file_size_bytes ? ` · ${formatFileSize(file.file_size_bytes)}` : ''}
          {' · '}{formatDateTime(file.created_at)}
        </p>
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-4 shrink-0 text-sm">
        <a href={fileHref} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-navy">Otevřít</a>
        <a href={`${fileHref}?download=1`} className="text-slate-500 hover:text-navy">Stáhnout</a>
        <button onClick={() => setEditing(true)} disabled={isPending} className="text-slate-500 hover:text-navy disabled:opacity-40">Upravit</button>
        <button onClick={remove} disabled={isPending} className="text-red-400 hover:text-red-600 disabled:opacity-40">Smazat</button>
      </div>
    </li>
  );
}
