/**
 * Vazba apartmán ↔ majitel (M:N, migrace 026).
 *
 * Zdroj pravdy = tabulka apartment_owners. Sloupec apartments.owner_id
 * se dál plní prvním majitelem (zpětná kompatibilita), ale nečte se.
 * Jen server — admin client (DB-01).
 */

import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { logCoopAudit } from '@/lib/coop';

type Admin = ReturnType<typeof createSupabaseAdminClient>;

/** ID apartmánů, které daný majitel vlastní (sám nebo se spolumajiteli). */
export async function getOwnerApartmentIds(ownerId: string, admin: Admin = createSupabaseAdminClient()): Promise<string[]> {
  const { data } = await admin
    .from('apartment_owners')
    .select('apartment_id')
    .eq('owner_id', ownerId);
  return (data ?? []).map((r) => r.apartment_id as string);
}

/** Všechny vazby — pro admin přehledy. */
export async function getAllApartmentOwnerLinks(admin: Admin = createSupabaseAdminClient()): Promise<{ apartment_id: string; owner_id: string }[]> {
  const { data } = await admin
    .from('apartment_owners')
    .select('apartment_id, owner_id, created_at')
    .order('created_at', { ascending: true });
  return (data ?? []).map((r) => ({ apartment_id: r.apartment_id as string, owner_id: r.owner_id as string }));
}

/**
 * Přepíše legacy apartments.owner_id na prvního majitele a při přiřazení
 * nastaví status 'sold'. `emptyStatus` = co nastavit, když apartmán zůstane bez majitele
 * (undefined = status neměnit).
 */
async function syncLegacyOwner(admin: Admin, apartmentIds: string[], emptyStatus?: 'available') {
  for (const apartmentId of Array.from(new Set(apartmentIds))) {
    const { data } = await admin
      .from('apartment_owners')
      .select('owner_id')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: true })
      .limit(1);
    const first = (data?.[0]?.owner_id as string | undefined) ?? null;

    const patch: Record<string, unknown> = { owner_id: first, updated_at: new Date().toISOString() };
    if (first) patch.status = 'sold';
    else if (emptyStatus) patch.status = emptyStatus;

    const { error } = await admin.from('apartments').update(patch).eq('id', apartmentId);
    if (error) console.error('apartments.owner_id sync:', error.message);
  }
}

/** Nastaví přesný seznam majitelů apartmánu (admin → Apartmány). */
export async function setApartmentOwners(apartmentId: string, ownerIds: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const wanted = Array.from(new Set(ownerIds.filter(Boolean)));

  const { data: current, error: readError } = await admin
    .from('apartment_owners')
    .select('owner_id')
    .eq('apartment_id', apartmentId);
  if (readError) return { ok: false, error: readError.message };

  const have = (current ?? []).map((r) => r.owner_id as string);
  const toAdd = wanted.filter((id) => !have.includes(id));
  const toRemove = have.filter((id) => !wanted.includes(id));

  if (toAdd.length > 0) {
    const { error } = await admin
      .from('apartment_owners')
      .insert(toAdd.map((owner_id) => ({ apartment_id: apartmentId, owner_id })));
    if (error) return { ok: false, error: error.message };
  }
  if (toRemove.length > 0) {
    const { error } = await admin
      .from('apartment_owners')
      .delete()
      .eq('apartment_id', apartmentId)
      .in('owner_id', toRemove);
    if (error) return { ok: false, error: error.message };
  }

  if (toAdd.length > 0 || toRemove.length > 0) {
    await syncLegacyOwner(admin, [apartmentId], 'available');
    await logCoopAudit({
      table: 'apartment_owners',
      recordId: apartmentId,
      action: 'set_owners',
      oldData: { owner_ids: have },
      newData: { owner_ids: wanted },
    });
  }
  return { ok: true };
}

/** Nastaví přesný seznam apartmánů majitele (admin → Majitelé). */
export async function setOwnerApartments(ownerId: string, apartmentIds: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const wanted = Array.from(new Set(apartmentIds.filter(Boolean)));

  const have = await getOwnerApartmentIds(ownerId, admin);
  const toAdd = wanted.filter((id) => !have.includes(id));
  const toRemove = have.filter((id) => !wanted.includes(id));

  if (toAdd.length > 0) {
    const { error } = await admin
      .from('apartment_owners')
      .insert(toAdd.map((apartment_id) => ({ apartment_id, owner_id: ownerId })));
    if (error) return { ok: false, error: error.message };
  }
  if (toRemove.length > 0) {
    const { error } = await admin
      .from('apartment_owners')
      .delete()
      .eq('owner_id', ownerId)
      .in('apartment_id', toRemove);
    if (error) return { ok: false, error: error.message };
  }

  if (toAdd.length > 0 || toRemove.length > 0) {
    await syncLegacyOwner(admin, [...toAdd, ...toRemove]);
    await logCoopAudit({
      table: 'apartment_owners',
      recordId: ownerId,
      action: 'set_apartments',
      oldData: { apartment_ids: have },
      newData: { apartment_ids: wanted },
    });
  }
  return { ok: true };
}
