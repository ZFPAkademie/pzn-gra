'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function updateBookingStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const updateData: Record<string, string> = {
    status,
    updated_at: now,
  };

  if (status === 'confirmed') {
    updateData.paid_at = now;
  }

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/rezervace');
  revalidatePath(`/admin/rezervace/${id}`);

  return { ok: true };
}

export async function updateCheckinInfo(
  id: string,
  info: {
    door_code?: string;
    wifi_name?: string;
    wifi_password?: string;
    parking?: string;
    note?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from('bookings')
    .update({
      checkin_info: info,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/rezervace');
  revalidatePath(`/admin/rezervace/${id}`);

  return { ok: true };
}

export async function sendAdminMessage(
  id: string,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return { ok: false, error: 'Neautorizováno' };

  if (!content.trim()) return { ok: false, error: 'Zpráva nesmí být prázdná' };

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from('booking_messages').insert({
    booking_id: id,
    sender_role: 'admin',
    sender_name: 'Tým Pod Zlatým návrším',
    content: content.trim(),
    created_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/rezervace/${id}`);

  return { ok: true };
}
