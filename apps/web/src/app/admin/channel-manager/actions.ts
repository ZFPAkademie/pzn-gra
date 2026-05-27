'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function addConnection(formData: FormData) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return { ok: false, error: 'Neautorizováno' };

  const apartmentId = formData.get('apartmentId') as string;
  const channel = formData.get('channel') as string;
  const icalUrl = formData.get('icalUrl') as string;
  const label = formData.get('label') as string;

  if (!apartmentId || !channel || !icalUrl) {
    return { ok: false, error: 'Chybí povinná pole' };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('channel_connections').upsert(
    { apartment_id: apartmentId, channel, ical_url: icalUrl, label: label || null, sync_enabled: true, updated_at: new Date().toISOString() },
    { onConflict: 'apartment_id,channel' }
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/channel-manager');
  return { ok: true };
}

export async function deleteConnection(id: string) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();

  // Remove associated blocks first
  await supabase.from('blocked_dates').delete().eq('channel_connection_id', id);
  const { error } = await supabase.from('channel_connections').delete().eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/channel-manager');
  return { ok: true };
}

export async function toggleConnection(id: string, enabled: boolean) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('channel_connections')
    .update({ sync_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/channel-manager');
  return { ok: true };
}
