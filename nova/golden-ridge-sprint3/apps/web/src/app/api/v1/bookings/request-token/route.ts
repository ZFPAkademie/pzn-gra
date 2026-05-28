/**
 * Request New Token API
 * POST /api/v1/bookings/request-token - Request new access token
 * 
 * Request body:
 * {
 *   email: string,
 *   referenceNumber: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestNewToken } from '@/lib/token';

// Rate limiting for token requests
const tokenRequestRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const TOKEN_REQUEST_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const TOKEN_REQUEST_RATE_LIMIT_MAX = 3; // 3 requests per 15 minutes per email

function checkTokenRequestRateLimit(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const now = Date.now();
  const record = tokenRequestRateLimitMap.get(normalizedEmail);
  
  if (!record || record.resetAt < now) {
    tokenRequestRateLimitMap.set(normalizedEmail, { 
      count: 1, 
      resetAt: now + TOKEN_REQUEST_RATE_LIMIT_WINDOW 
    });
    return true;
  }
  
  if (record.count >= TOKEN_REQUEST_RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: { email: string; referenceNumber: string };
    
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.email || !body.referenceNumber) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email and reference number are required',
        },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }
    
    // Validate reference number format (GR-YYYYMMDD-XXXX)
    const refRegex = /^GR-\d{8}-[A-Z0-9]{4}$/i;
    if (!refRegex.test(body.referenceNumber)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid reference number format',
        },
        { status: 400 }
      );
    }
    
    // Check rate limit
    if (!checkTokenRequestRateLimit(body.email)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please wait 15 minutes before trying again.',
        },
        { status: 429 }
      );
    }
    
    // Request new token
    const result = await requestNewToken(
      body.email.trim(),
      body.referenceNumber.trim().toUpperCase()
    );
    
    // Always return success message to prevent email enumeration
    // In production, the actual token would only be sent via email
    return NextResponse.json({
      success: true,
      message: 'If a reservation exists with these details, a new access link will be sent to your email.',
    });
    
  } catch (error) {
    console.error('Request token API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
