'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function createOwnerBlock(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false, error: auth.error };

  const apartmentId = formData.get('apartment_id') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const note = formData.get('note') as string;

  if (!apartmentId || !startDate || !endDate) return { ok: false, error: 'Chybí povinná pole' };
  if (endDate < startDate) return { ok: false, error: 'Konec musí být po začátku' };

  // Ověř vlastnictví apartmánu (DB-01)
  if (!auth.apartmentIds.includes(apartmentId)) {
    return { ok: false, error: 'Nemáte přístup k tomuto apartmánu' };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('blocked_dates').insert({
    apartment_id: apartmentId,
    owner_id: auth.ownerId,
    start_date: startDate,
    end_date: endDate,
    reason: 'owner_use',
    note: note || null,
    source: 'owner',
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/portal/pronajem/blokace');
  return { ok: true };
}

export async function deleteOwnerBlock(blockId: string) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createSupabaseAdminClient();

  // Ověř vlastnictví (DB-01) — owner může mazat jen své blokace
  const { data: block } = await admin
    .from('blocked_dates')
    .select('owner_id')
    .eq('id', blockId)
    .single();

  if (!block || block.owner_id !== auth.ownerId) {
    return { ok: false, error: 'Nemáte přístup k této blokaci' };
  }

  const { error } = await admin.from('blocked_dates').delete().eq('id', blockId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/portal/pronajem/blokace');
  return { ok: true };
}
