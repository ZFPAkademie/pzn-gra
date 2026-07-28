/**
 * PIN přístup pro /sprava-podilu — cookie = HMAC odvozený z PODIL_PIN.
 * Bez znalosti PINu nelze cookie zfalšovat; změna PINu zneplatní přístupy.
 */

import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

export const PODIL_COOKIE = 'podil_access';

export function podilAccessToken(pin: string): string {
  return createHmac('sha256', pin).update('podil-editor-v1').digest('hex');
}

/** Env hodnota může obsahovat neviditelné whitespace (echo, copy-paste) — vždy trim. */
export function getPodilPin(): string | null {
  const pin = process.env.PODIL_PIN?.trim();
  return pin || null;
}

export function hasPodilAccess(): boolean {
  const pin = getPodilPin();
  if (!pin) return false;
  const cookie = cookies().get(PODIL_COOKIE)?.value;
  return cookie === podilAccessToken(pin);
}
