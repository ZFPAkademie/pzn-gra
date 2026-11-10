/**
 * Admin Logout API
 * POST /api/admin/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminLogout } from '@/lib/admin-auth';

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic';

// Volá se obyčejným <form method="POST"> z navigace → 303 na přihlášení (dřív holý JSON)
export async function POST(request: NextRequest) {
  try {
    await adminLogout();
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
