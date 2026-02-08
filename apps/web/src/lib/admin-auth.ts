/**
 * Admin Authentication
 * Simple password-based auth with signed cookies
 */

import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 12 * 60 * 60; // 12 hours in seconds

// Simple token generation (in production, use proper JWT)
function generateToken(timestamp: number): string {
  const secret = process.env.ADMIN_DASH_PASSWORD || 'default-secret';
  const data = `admin:${timestamp}:${secret}`;
  // Simple base64 encoding with timestamp validation
  return Buffer.from(data).toString('base64');
}

function validateToken(token: string): boolean {
  try {
    const secret = process.env.ADMIN_DASH_PASSWORD || 'default-secret';
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [prefix, timestampStr, tokenSecret] = decoded.split(':');
    
    if (prefix !== 'admin' || tokenSecret !== secret) {
      return false;
    }
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const age = (now - timestamp) / 1000;
    
    // Check if token is expired (12 hours)
    if (age > COOKIE_MAX_AGE) {
      return false;
    }
    
    return true;
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
  
  if (password !== adminPassword) {
    return { success: false, error: 'Invalid password' };
  }
  
  // Generate session token
  const token = generateToken(Date.now());
  
  // Set cookie
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/admin',
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
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Get admin password configured status
 */
export function isAdminConfigured(): boolean {
  return !!process.env.ADMIN_DASH_PASSWORD;
}
