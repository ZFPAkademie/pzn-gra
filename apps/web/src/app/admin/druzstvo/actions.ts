'use server';

/**
 * Družstvo — server actions (ERR-02: vždy { ok, error }, nikdy throw)
 * Kontakty, stav, historie, přílohy. Přístup jen přes admin session + service role.
 */

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { logCoopAudit } from '@/lib/coop';
import {
  COOP_EVENT_KINDS_MANUAL,
  COOP_FILE_CATEGORIES,
  COOP_FILE_MAX_BYTES,
  COOP_FILE_TYPES,
  COOP_SOURCES,
  COOP_TOTAL_SHARES,
  fileExtension,
  isCoopStatus,
  type CoopStatus,
} from '@/lib/coop-shared';

// eslint-disable-next-line @typescript-eslint/ban-types
type Result<T = {}> =({ ok: true } & T) | { ok: false; error: string };

const BUCKET = 'dokumenty';
const UNAUTHORIZED = { ok: false as const, error: 'Přihlášení vypršelo — přihlaste se znovu' };

function revalidateCoop(contactId?: string) {
  revalidatePath('/admin/druzstvo');
  if (contactId) revalidatePath(`/admin/druzstvo/${contactId}`);
  revalidatePath('/podil');
  revalidatePath('/podil-prezentace');
  revalidatePath('/sprava-podilu');
}

/** Chyba z DB → česká hláška (kapacitní trigger, constraint na počet podílů) */
function dbError(message: string | undefined): string {
  if (!message) return 'Uložení se nepodařilo';
  const cap = /COOP_CAPACITY:(-?\d+)/.exec(message);
  if (cap) {
    const left = Math.max(0, parseInt(cap[1], 10));
    return `Překročen počet ${COOP_TOTAL_SHARES} podílů — v rezervaci a u vlastníků zbývá volných ${left}.`;
  }
  if (message.includes('coop_contacts_shares_required')) {
    return 'Ve stavu Rezervace nebo Vlastník musí být vyplněn počet podílů.';
  }
  if (message.includes('share_count')) return `Počet podílů musí být 1–${COOP_TOTAL_SHARES}.`;
  return message;
}

// ───────────────────────────────────────────────────────────────────
// Parsování formuláře kontaktu
// ───────────────────────────────────────────────────────────────────

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function dateOnly(fd: FormData, key: string): string | null | 'invalid' {
  const v = str(fd, key);
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'invalid';
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return 'invalid';
  return v;
}

const DATE_FIELDS = {
  birth_date: 'Datum narození',
  next_step_date: 'Termín dalšího kroku',
  reserved_at: 'Datum rezervace',
  contract_signed_at: 'Datum podpisu smlouvy',
  paid_at: 'Datum úhrady',
} as const;

function parseContactForm(fd: FormData): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const first_name = str(fd, 'first_name');
  if (!first_name) return { ok: false, error: 'Jméno je povinné' };

  const email = str(fd, 'email')?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Neplatný e-mail' };

  let share_count: number | null = null;
  const sharesRaw = str(fd, 'share_count');
  if (sharesRaw) {
    const n = Number(sharesRaw);
    if (!Number.isInteger(n) || n < 1 || n > COOP_TOTAL_SHARES) {
      return { ok: false, error: `Počet podílů musí být celé číslo 1–${COOP_TOTAL_SHARES}` };
    }
    share_count = n;
  }

  let paid_amount: number | null = null;
  const paidRaw = str(fd, 'paid_amount');
  if (paidRaw) {
    const n = Number(paidRaw.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: 'Uhrazená částka musí být kladné číslo' };
    paid_amount = Math.round(n * 100) / 100;
  }

  const sourceRaw = str(fd, 'source') ?? 'other';
  const source = (COOP_SOURCES as readonly string[]).includes(sourceRaw) ? sourceRaw : 'other';

  const data: Record<string, unknown> = {
    first_name,
    last_name: str(fd, 'last_name'),
    email,
    phone: str(fd, 'phone'),
    street: str(fd, 'street'),
    city: str(fd, 'city'),
    postal_code: str(fd, 'postal_code'),
    country: str(fd, 'country'),
    company_name: str(fd, 'company_name'),
    company_id: str(fd, 'company_id'),
    share_count,
    source,
    referred_by: str(fd, 'referred_by'),
    assigned_to: str(fd, 'assigned_to'),
    next_step: str(fd, 'next_step'),
    paid_amount,
    marketing_consent: fd.get('marketing_consent') === 'on',
    notes: str(fd, 'notes'),
  };

  for (const [key, label] of Object.entries(DATE_FIELDS)) {
    const v = dateOnly(fd, key);
    if (v === 'invalid') return { ok: false, error: `${label}: neplatné datum` };
    data[key] = v;
  }

  return { ok: true, data };
}

// ───────────────────────────────────────────────────────────────────
// Kontakty
// ───────────────────────────────────────────────────────────────────

export async function createCoopContact(fd: FormData): Promise<Result<{ id: string }>> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;

  const parsed = parseContactForm(fd);
  if (!parsed.ok) return parsed;

  const statusRaw = str(fd, 'status') ?? 'new';
  const status: CoopStatus = isCoopStatus(statusRaw) ? statusRaw : 'new';
  const gdpr = fd.get('gdpr_consent') === 'on';

  const row = {
    ...parsed.data,
    status,
    gdpr_consent: gdpr,
    gdpr_consent_at: gdpr ? new Date().toISOString() : null,
  };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('coop_contacts').insert(row).select('id').single();
  if (error || !data) return { ok: false, error: dbError(error?.message) };

  await supabase.from('coop_contact_events').insert({
    contact_id: data.id,
    kind: 'created',
    body: 'Kontakt založen ručně v administraci.',
    new_status: status,
  });
  await logCoopAudit({ table: 'coop_contacts', recordId: data.id, action: 'insert', newData: row });

  revalidateCoop(data.id);
  return { ok: true, id: data.id };
}

export async function updateCoopContact(id: string, fd: FormData): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;

  const parsed = parseContactForm(fd);
  if (!parsed.ok) return parsed;

  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from('coop_contacts').select('*').eq('id', id).maybeSingle();
  if (!before) return { ok: false, error: 'Kontakt neexistuje' };

  const gdpr = fd.get('gdpr_consent') === 'on';
  const row: Record<string, unknown> = {
    ...parsed.data,
    gdpr_consent: gdpr,
    // Datum souhlasu: zachovat původní, nastavit při prvním zaškrtnutí, smazat při odebrání
    gdpr_consent_at: gdpr ? (before.gdpr_consent_at ?? new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('coop_contacts').update(row).eq('id', id);
  if (error) return { ok: false, error: dbError(error.message) };

  await logCoopAudit({ table: 'coop_contacts', recordId: id, action: 'update', oldData: before, newData: row });
  revalidateCoop(id);
  return { ok: true };
}

export async function setCoopStatus(id: string, status: string, note?: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  if (!isCoopStatus(status)) return { ok: false, error: 'Neplatný stav' };

  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase
    .from('coop_contacts')
    .select('id, status, reserved_at')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { ok: false, error: 'Kontakt neexistuje' };
  if (before.status === status) return { ok: true };

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  // Datum rezervace se doplní při přechodu do Rezervace, pokud ještě není
  if (status === 'reservation' && !before.reserved_at) {
    update.reserved_at = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });
  }

  const { error } = await supabase.from('coop_contacts').update(update).eq('id', id);
  if (error) return { ok: false, error: dbError(error.message) };

  await supabase.from('coop_contact_events').insert({
    contact_id: id,
    kind: 'status',
    body: note?.trim() || null,
    old_status: before.status,
    new_status: status,
  });
  await logCoopAudit({
    table: 'coop_contacts',
    recordId: id,
    action: 'status',
    oldData: { status: before.status },
    newData: update,
  });

  revalidateCoop(id);
  return { ok: true };
}

export async function archiveCoopContact(id: string, archive: boolean): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;

  const supabase = createSupabaseAdminClient();
  const archived_at = archive ? new Date().toISOString() : null;
  const { error } = await supabase
    .from('coop_contacts')
    .update({ archived_at, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: dbError(error.message) };

  await supabase.from('coop_contact_events').insert({ contact_id: id, kind: archive ? 'archived' : 'restored' });
  await logCoopAudit({ table: 'coop_contacts', recordId: id, action: archive ? 'archive' : 'restore', newData: { archived_at } });

  revalidateCoop(id);
  return { ok: true };
}

// ───────────────────────────────────────────────────────────────────
// Historie (záznamy z jednání)
// ───────────────────────────────────────────────────────────────────

export async function addCoopEvent(input: {
  contactId: string;
  kind: string;
  body: string;
  occurredAt?: string | null; // 'YYYY-MM-DDTHH:mm' místní čas (Praha)
}): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  if (!(COOP_EVENT_KINDS_MANUAL as readonly string[]).includes(input.kind)) return { ok: false, error: 'Neplatný typ záznamu' };
  const body = input.body?.trim();
  if (!body) return { ok: false, error: 'Napište text záznamu' };

  let occurred_at: string | undefined;
  if (input.occurredAt) {
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(input.occurredAt)) return { ok: false, error: 'Neplatné datum' };
    // Bez časového pásma = Praha; poledne u samotného data (DB-03)
    const local = input.occurredAt.length === 10 ? `${input.occurredAt}T12:00` : input.occurredAt;
    occurred_at = pragueToIso(local);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('coop_contact_events').insert({
    contact_id: input.contactId,
    kind: input.kind,
    body,
    ...(occurred_at ? { occurred_at } : {}),
  });
  if (error) return { ok: false, error: dbError(error.message) };

  await supabase.from('coop_contacts').update({ updated_at: new Date().toISOString() }).eq('id', input.contactId);
  revalidatePath(`/admin/druzstvo/${input.contactId}`);
  return { ok: true };
}

export async function deleteCoopEvent(eventId: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;

  const supabase = createSupabaseAdminClient();
  const { data: ev } = await supabase
    .from('coop_contact_events')
    .select('id, contact_id, kind, body, occurred_at')
    .eq('id', eventId)
    .maybeSingle();
  if (!ev) return { ok: false, error: 'Záznam neexistuje' };
  // Systémové záznamy (změny stavu, přílohy) jsou historie — mazat jdou jen ručně psané
  if (!(COOP_EVENT_KINDS_MANUAL as readonly string[]).includes(ev.kind)) {
    return { ok: false, error: 'Systémový záznam nelze smazat' };
  }

  const { error } = await supabase.from('coop_contact_events').delete().eq('id', eventId);
  if (error) return { ok: false, error: dbError(error.message) };

  await logCoopAudit({ table: 'coop_contact_events', recordId: eventId, action: 'delete', oldData: ev });
  revalidatePath(`/admin/druzstvo/${ev.contact_id}`);
  return { ok: true };
}

/** 'YYYY-MM-DDTHH:mm' v pražském čase → ISO UTC */
function pragueToIso(local: string): string {
  const [datePart, timePart] = local.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Posun Prahy vůči UTC v daný okamžik (CET/CEST)
  const pragueWall = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const utcWall = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: 'UTC' }));
  const offset = pragueWall.getTime() - utcWall.getTime();
  return new Date(asUtc - offset).toISOString();
}

// ───────────────────────────────────────────────────────────────────
// Přílohy — upload přímo z prohlížeče do Storage (FILE-01)
// ───────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(-120);
}

export async function createCoopFileUploadUrl(
  contactId: string,
  fileName: string,
  sizeBytes: number
): Promise<Result<{ path: string; token: string }>> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  if (!contactId || !fileName) return { ok: false, error: 'Chybí kontakt nebo soubor' };

  const ext = fileExtension(fileName);
  if (!COOP_FILE_TYPES[ext]) return { ok: false, error: 'Povolené jsou jen PDF, DOCX, JPG a PNG' };
  if (!sizeBytes || sizeBytes > COOP_FILE_MAX_BYTES) {
    return { ok: false, error: `Soubor je větší než ${COOP_FILE_MAX_BYTES / 1024 / 1024} MB` };
  }

  const supabase = createSupabaseAdminClient();
  const { data: contact } = await supabase.from('coop_contacts').select('id').eq('id', contactId).maybeSingle();
  if (!contact) return { ok: false, error: 'Kontakt neexistuje' };

  const path = `druzstvo/${contactId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: 'Odkaz pro nahrání se nepodařilo vytvořit' };
  return { ok: true, path: data.path, token: data.token };
}

export async function saveCoopFile(input: {
  contactId: string;
  path: string;
  title: string;
  category: string;
}): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;

  const supabase = createSupabaseAdminClient();
  const prefix = `druzstvo/${input.contactId}/`;
  if (!input.path?.startsWith(prefix) || input.path.includes('..')) return { ok: false, error: 'Neplatná cesta souboru' };

  const removeUploaded = () => supabase.storage.from(BUCKET).remove([input.path]);

  // Skutečná velikost a typ ze Storage — údajům z prohlížeče nevěříme
  const name = input.path.slice(prefix.length);
  const { data: listed } = await supabase.storage.from(BUCKET).list(prefix.slice(0, -1), { search: name, limit: 5 });
  const obj = listed?.find((o) => o.name === name);
  if (!obj) return { ok: false, error: 'Nahraný soubor se nenašel' };

  const size = Number((obj.metadata as Record<string, unknown> | null)?.size ?? 0) || null;
  const ext = fileExtension(name);
  const mime = COOP_FILE_TYPES[ext];
  if (!mime) {
    await removeUploaded();
    return { ok: false, error: 'Povolené jsou jen PDF, DOCX, JPG a PNG' };
  }
  if (size && size > COOP_FILE_MAX_BYTES) {
    await removeUploaded();
    return { ok: false, error: `Soubor je větší než ${COOP_FILE_MAX_BYTES / 1024 / 1024} MB` };
  }

  const category = (COOP_FILE_CATEGORIES as readonly string[]).includes(input.category) ? input.category : 'other';
  const title = input.title?.trim() || name.replace(/^\d+-/, '');

  const { data: file, error } = await supabase
    .from('coop_contact_files')
    .insert({ contact_id: input.contactId, category, title, file_path: input.path, file_size_bytes: size, mime_type: mime })
    .select('id')
    .single();

  if (error || !file) {
    // Cleanup — bez DB záznamu by soubor zůstal ve Storage navždy (vzor L)
    await removeUploaded();
    return { ok: false, error: dbError(error?.message) };
  }

  await supabase.from('coop_contact_events').insert({ contact_id: input.contactId, kind: 'file_added', body: title });
  await logCoopAudit({ table: 'coop_contact_files', recordId: file.id, action: 'insert', newData: { title, category, path: input.path } });

  revalidatePath(`/admin/druzstvo/${input.contactId}`);
  return { ok: true };
}

export async function updateCoopFile(fileId: string, input: { title: string; category: string }): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  const title = input.title?.trim();
  if (!title) return { ok: false, error: 'Název je povinný' };
  const category = (COOP_FILE_CATEGORIES as readonly string[]).includes(input.category) ? input.category : 'other';

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('coop_contact_files')
    .update({ title, category })
    .eq('id', fileId)
    .select('contact_id')
    .maybeSingle();
  if (error) return { ok: false, error: dbError(error.message) };
  if (!data) return { ok: false, error: 'Příloha neexistuje' };

  revalidatePath(`/admin/druzstvo/${data.contact_id}`);
  return { ok: true };
}

export async function deleteCoopFile(fileId: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;

  const supabase = createSupabaseAdminClient();
  const { data: file } = await supabase
    .from('coop_contact_files')
    .select('id, contact_id, title, file_path')
    .eq('id', fileId)
    .maybeSingle();
  if (!file) return { ok: false, error: 'Příloha neexistuje' };

  const { error } = await supabase.from('coop_contact_files').delete().eq('id', fileId);
  if (error) return { ok: false, error: dbError(error.message) };

  // Storage cleanup — selhání neblokuje (řádek už je pryč)
  await supabase.storage.from(BUCKET).remove([file.file_path]);
  await supabase.from('coop_contact_events').insert({ contact_id: file.contact_id, kind: 'file_removed', body: file.title });
  await logCoopAudit({ table: 'coop_contact_files', recordId: fileId, action: 'delete', oldData: file });

  revalidatePath(`/admin/druzstvo/${file.contact_id}`);
  return { ok: true };
}

// Otevření / stažení přílohy: route handler soubor/[id]/route.ts (302 na signed URL)
