/**
 * Token API
 * GET /api/v1/bookings/[token] - Get reservation details by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/token';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Validate token format (64 hex characters)
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid token format',
        },
        { status: 400 }
      );
    }
    
    // Validate token and get reservation data
    const result = await validateToken(token);
    
    if (!result.valid) {
      if (result.expired) {
        return NextResponse.json(
          { 
            valid: false,
            expired: true,
            message: 'This access link has expired. You can request a new one.',
          },
          { status: 410 } // Gone
        );
      }
      
      return NextResponse.json(
        { 
          valid: false,
          message: 'Invalid or unknown access link.',
        },
        { status: 404 }
      );
    }
    
    // Return reservation data
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Token API error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
