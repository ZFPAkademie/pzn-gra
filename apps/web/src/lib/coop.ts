/**
 * Družstvo — serverová logika: počet volných podílů z evidence, převzetí poptávky z webu, audit.
 * Pouze server (service role). Konstanty a popisky v coop-shared.ts.
 */

import { createSupabaseAdminClient } from './supabase-server';
import { COOP_TOTAL_SHARES, COOP_TAKEN_STATUSES } from './coop-shared';

export interface CoopShareSummary {
  total: number;
  owned: number;
  reserved: number;
  available: number;
}

/** Součet podílů ve stavech Rezervace + Vlastník (bez archivovaných). Při chybě DB vyhodí. */
export async function getCoopShareSummary(): Promise<CoopShareSummary> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('coop_contacts')
    .select('status, share_count')
    .is('archived_at', null)
    .in('status', COOP_TAKEN_STATUSES);

  if (error) throw new Error(`coop summary: ${error.message}`);

  let owned = 0;
  let reserved = 0;
  for (const row of data ?? []) {
    const n = row.share_count ?? 0;
    if (row.status === 'owner') owned += n;
    else reserved += n;
  }
  return {
    total: COOP_TOTAL_SHARES,
    owned,
    reserved,
    available: Math.max(0, COOP_TOTAL_SHARES - owned - reserved),
  };
}

/**
 * Volné podíly pro veřejný web (/podil, /podil-prezentace, /sprava-podilu).
 * Fallback = všechny podíly při výpadku DB — stránka nesmí spadnout (DEC-028).
 */
export async function getCoopAvailableShares(): Promise<number> {
  try {
    return (await getCoopShareSummary()).available;
  } catch (e) {
    console.error('getCoopAvailableShares:', e);
    return COOP_TOTAL_SHARES;
  }
}

/**
 * Zápis do audit_log — selhání nesmí shodit hlavní akci (vzor O).
 */
export async function logCoopAudit(entry: {
  table: string;
  recordId: string;
  action: string;
  oldData?: unknown;
  newData?: unknown;
  actorRole?: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('audit_log').insert({
      table_name: entry.table,
      record_id: entry.recordId,
      action: entry.action,
      old_data: entry.oldData ?? null,
      new_data: entry.newData ?? null,
      actor_role: entry.actorRole ?? 'admin',
    });
    if (error) console.error('audit_log insert:', error.message);
  } catch (e) {
    console.error('audit_log insert:', e);
  }
}

/**
 * Poptávka z formuláře na /podil → kontakt v Družstvu ve stavu Nový.
 * Idempotentní přes unikátní lead_id. Vrací id kontaktu, nebo null při chybě (zalogováno).
 */
export async function createCoopContactFromLead(input: {
  leadId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  shareCount: number | null;
  postalCode: string | null;
  message: string | null;
  language: string | null;
  geo: unknown;
}): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const shareCount =
    input.shareCount && input.shareCount >= 1 && input.shareCount <= COOP_TOTAL_SHARES
      ? Math.round(input.shareCount)
      : null;

  const { data, error } = await supabase
    .from('coop_contacts')
    .insert({
      status: 'new',
      source: 'web',
      first_name: input.firstName,
      last_name: input.lastName && input.lastName !== '-' ? input.lastName : null,
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      postal_code: input.postalCode?.trim() || null,
      share_count: shareCount,
      language: input.language,
      lead_id: input.leadId,
      metadata: { geo: input.geo ?? null, source: 'podil' },
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('createCoopContactFromLead:', error?.message);
    return null;
  }

  const body = [
    'Poptávka z formuláře na webu /podil.',
    shareCount ? `Předpokládaný počet podílů: ${shareCount}.` : null,
    input.message?.trim() ? `Zpráva: ${input.message.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const { error: evError } = await supabase
    .from('coop_contact_events')
    .insert({ contact_id: data.id, kind: 'created', body, new_status: 'new' });
  if (evError) console.error('coop created event:', evError.message);

  await logCoopAudit({ table: 'coop_contacts', recordId: data.id, action: 'insert', newData: { lead_id: input.leadId, source: 'web' }, actorRole: 'public' });

  return data.id;
}
