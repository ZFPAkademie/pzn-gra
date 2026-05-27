'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function createBlock(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const apartmentId = formData.get('apartment_id') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const reason = formData.get('reason') as string;
  const note = formData.get('note') as string;

  if (!apartmentId || !startDate || !endDate) return { ok: false, error: 'Chybí povinná pole' };
  if (endDate < startDate) return { ok: false, error: 'Konec musí být po začátku' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('blocked_dates').insert({
    apartment_id: apartmentId,
    owner_id: null,
    start_date: startDate,
    end_date: endDate,
    reason: reason || 'maintenance',
    note: note || null,
    source: 'owner',
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blokace');
  return { ok: true };
}

export async function deleteBlock(id: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blokace');
  return { ok: true };
}
