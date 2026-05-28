/**
 * Message API
 * POST /api/v1/bookings/[token]/message - Send message to manager
 * 
 * Request body:
 * {
 *   message: string,
 *   guestEmail: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateToken, hashToken } from '@/lib/token';
import { sendGuestMessage } from '@/lib/email';
import { db } from '@/lib/db';

// Rate limiting for messages
const messageRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MESSAGE_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MESSAGE_RATE_LIMIT_MAX = 3; // 3 messages per 5 minutes

function checkMessageRateLimit(token: string): boolean {
  const now = Date.now();
  const record = messageRateLimitMap.get(token);
  
  if (!record || record.resetAt < now) {
    messageRateLimitMap.set(token, { count: 1, resetAt: now + MESSAGE_RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MESSAGE_RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Validate token format
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid token',
        },
        { status: 400 }
      );
    }
    
    // Check rate limit
    if (!checkMessageRateLimit(token)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many messages. Please wait before sending another.',
        },
        { status: 429 }
      );
    }
    
    // Validate token
    const tokenValidation = await validateToken(token);
    
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { 
          success: false,
          error: tokenValidation.expired 
            ? 'Your access link has expired' 
            : 'Invalid access link',
        },
        { status: tokenValidation.expired ? 410 : 401 }
      );
    }
    
    // Parse request body
    let body: { message: string; guestEmail: string };
    
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
    
    // Validate message
    if (!body.message || body.message.trim().length < 5) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Message must be at least 5 characters',
        },
        { status: 400 }
      );
    }
    
    if (body.message.length > 2000) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Message is too long (max 2000 characters)',
        },
        { status: 400 }
      );
    }
    
    // Get reservation ID from token
    const tokenHash = hashToken(token);
    const tokenResult = await db.query<{ reservation_id: string }>(
      `SELECT reservation_id FROM guest_tokens WHERE token_hash = $1`,
      [tokenHash]
    );
    
    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Reservation not found',
        },
        { status: 404 }
      );
    }
    
    const reservationId = tokenResult.rows[0].reservation_id;
    
    // Send message
    const result = await sendGuestMessage(
      reservationId,
      body.message.trim(),
      body.guestEmail || tokenValidation.reservation?.guestFirstName + ' (via token page)'
    );
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send message',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to our team.',
    });
    
  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
