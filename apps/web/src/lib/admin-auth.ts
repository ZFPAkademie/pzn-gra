/**
 * Admin Authentication
 * Heslo z env ADMIN_DASH_PASSWORD, session cookie = `{timestamp}.{HMAC-SHA256}`.
 *
 * Dřív byla cookie Base64 textu obsahujícího samotné heslo (dekódovatelné, padělatelné
 * při znalosti formátu) — viz CLAUDE.md, anti-pattern base64-admin-auth. Klíč podpisu:
 * ADMIN_SESSION_SECRET, jinak odvozený z hesla; změna kteréhokoli zneplatní všechny session.
 */

import { cookies } from 'next/headers';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

const ADMIN_COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 12 * 60 * 60; // 12 hours in seconds
const COOKIE_PATH = '/admin';

function signingKey(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const password = process.env.ADMIN_DASH_PASSWORD;
  if (!password) return null;
  return createHash('sha256').update(`admin-session-key-v2:${password}`).digest('hex');
}

function sign(key: string, timestamp: number): string {
  return createHmac('sha256', key).update(`admin-session-v2:${timestamp}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  // Porovnání hashů stejné délky v konstantním čase (délka vstupu neprozradí nic)
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function generateToken(timestamp: number): string | null {
  const key = signingKey();
  if (!key) return null;
  return `${timestamp}.${sign(key, timestamp)}`;
}

function validateToken(token: string): boolean {
  try {
    const key = signingKey();
    if (!key) return false;

    const [timestampStr, signature] = token.split('.');
    if (!timestampStr || !signature || !/^\d+$/.test(timestampStr)) return false;

    const timestamp = parseInt(timestampStr, 10);
    const age = (Date.now() - timestamp) / 1000;
    if (age < 0 || age > COOKIE_MAX_AGE) return false;

    return safeEqual(signature, sign(key, timestamp));
  } catch {
    return false;
  }
}

/**
 * Verify admin password and create session
 */
export async function adminLogin(password: string): Promise<{ success: boolean; error?: string }> {
  const adminPassword = process.env.ADMIN_DASH_PASSWORD;
  
  if (!adminPassword) {
    console.error('ADMIN_DASH_PASSWORD not configured');
    return { success: false, error: 'Admin access not configured' };
  }
  
  if (typeof password !== 'string' || !safeEqual(password, adminPassword)) {
    // Zpomalení hádání hesla
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: false, error: 'Invalid password' };
  }

  // Generate session token
  const token = generateToken(Date.now());
  if (!token) return { success: false, error: 'Admin access not configured' };

  // Set cookie
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: COOKIE_PATH,
  });
  
  return { success: true };
}

/**
 * Check if current request has valid admin session
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  
  if (!token) {
    return false;
  }
  
  return validateToken(token);
}

/**
 * Logout admin session
 */
export async function adminLogout(): Promise<void> {
  // Cookie má path /admin — smazat se musí se stejnou cestou, jinak v prohlížeči zůstane
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, '', { path: COOKIE_PATH, maxAge: 0, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
}

/**
 * Get admin password configured status
 */
export function isAdminConfigured(): boolean {
  return !!process.env.ADMIN_DASH_PASSWORD;
}
