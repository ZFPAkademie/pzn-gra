'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { PODIL_COOKIE, podilAccessToken, hasPodilAccess, getPodilPin } from './auth';

const TOTAL_SHARES = 50;

export async function verifyPodilPin(formData: FormData) {
  const pin = getPodilPin();
  if (!pin) return { ok: false as const, error: 'PIN není nastaven — kontaktujte správce webu' };

  const input = ((formData.get('pin') as string) ?? '').trim();

  if (input !== pin) {
    // Zpomalení hádání PINu
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { ok: false as const, error: 'Nesprávný PIN' };
  }

  cookies().set(PODIL_COOKIE, podilAccessToken(pin), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 dní
    path: '/',
  });

  return { ok: true as const };
}

export async function updatePodilAvailable(formData: FormData) {
  if (!hasPodilAccess()) return { ok: false as const, error: 'Přístup vypršel — zadejte PIN znovu' };

  const raw = (formData.get('available') as string) ?? '';
  const value = parseInt(raw, 10);

  if (Number.isNaN(value) || value < 0 || value > TOTAL_SHARES) {
    return { ok: false as const, error: `Zadejte číslo 0–${TOTAL_SHARES}` };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert(
      { key: 'podil_available', value: String(value), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/podil');
  revalidatePath('/sprava-podilu');
  return { ok: true as const, value };
}

export async function podilLogout() {
  cookies().delete(PODIL_COOKIE);
  return { ok: true as const };
}
