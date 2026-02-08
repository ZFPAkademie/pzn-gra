/**
 * Admin Login API
 * POST /api/admin/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminLogin, isAdminConfigured } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: 'Admin access not configured' },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    const result = await adminLogin(password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
