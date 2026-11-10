'use server';

import { cookies } from 'next/headers';
import { PODIL_COOKIE, podilAccessToken, getPodilPin } from './auth';

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

// Ruční zápis počtu (updatePodilAvailable) zrušen 11/2026 — počet se počítá z evidence
// v admin sekci Družstvo (src/lib/coop.ts). Řádek app_settings.podil_available zůstává, nikdo ho nečte.

export async function podilLogout() {
  cookies().delete(PODIL_COOKIE);
  return { ok: true as const };
}
