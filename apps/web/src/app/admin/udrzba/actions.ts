'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

const VALID_STATUSES = ['pending', 'in_progress', 'resolved'];

export async function updateMaintenanceStatus(requestId: string, status: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!VALID_STATUSES.includes(status)) return { ok: false as const, error: 'Neplatný stav' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('maintenance_requests')
    .update({
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/admin/udrzba');
  revalidatePath('/portal/udrzba');
  return { ok: true as const };
}

export async function updateMaintenanceNote(requestId: string, note: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('maintenance_requests')
    .update({
      admin_note: note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/admin/udrzba');
  revalidatePath('/portal/udrzba');
  return { ok: true as const };
}
