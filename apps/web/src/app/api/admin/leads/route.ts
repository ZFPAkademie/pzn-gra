/**
 * Admin Leads API
 * GET /api/admin/leads - List all leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getLeads, getLeadCounts } from '@/lib/leads-service';

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    
    // Get leads
    const { leads, total } = await getLeads({ status, type, limit, offset });
    
    // Get counts
    const counts = await getLeadCounts();
    
    return NextResponse.json({
      leads,
      total,
      counts,
      pagination: {
        limit,
        offset,
        hasMore: offset + leads.length < total,
      },
    });
    
  } catch (error) {
    console.error('Admin leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
