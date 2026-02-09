/**
 * Admin Logout API
 * POST /api/admin/logout
 */

import { NextResponse } from 'next/server';
import { adminLogout } from '@/lib/admin-auth';

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await adminLogout();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
