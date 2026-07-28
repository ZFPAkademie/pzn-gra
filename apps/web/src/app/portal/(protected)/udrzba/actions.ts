'use server';

/**
 * Portal — hlášení závad (maintenance_requests).
 * Pattern DB-01: admin client + manuální ownership check.
 */

import { revalidatePath } from 'next/cache';
import { requireOwner, createSupabaseAdminClient } from '@/lib/supabase-server';

export async function createMaintenanceRequest(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const apartmentId = formData.get('apartment_id') as string;
  const title = ((formData.get('title') as string) ?? '').trim();
  const description = ((formData.get('description') as string) ?? '').trim();
  const priorityRaw = formData.get('priority') as string;

  if (!title) return { ok: false as const, error: 'Popište prosím závadu (nadpis je povinný)' };
  if (!auth.apartmentIds.includes(apartmentId)) {
    return { ok: false as const, error: 'Přístup odepřen' };
  }

  const priority = ['low', 'normal', 'urgent'].includes(priorityRaw) ? priorityRaw : 'normal';

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('maintenance_requests').insert({
    owner_id: auth.ownerId,
    apartment_id: apartmentId,
    title,
    description: description || null,
    priority,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/portal/udrzba');
  revalidatePath('/admin/udrzba');
  return { ok: true as const };
}
