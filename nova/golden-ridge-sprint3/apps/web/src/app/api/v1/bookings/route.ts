/**
 * Booking API
 * POST /api/v1/bookings - Create new booking
 * 
 * Request body:
 * {
 *   apartmentId: string,
 *   checkIn: string (ISO date),
 *   checkOut: string (ISO date),
 *   guestFirstName: string,
 *   guestLastName: string,
 *   guestEmail: string,
 *   guestPhone: string,
 *   guestCountry: string (ISO 2-letter code),
 *   guestCount: number,
 *   specialRequests?: string,
 *   gdprConsent: boolean,
 *   termsAccepted: boolean,
 *   language: 'cs' | 'en'
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getCountryList } from '@/lib/booking';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import type { BookingRequest } from '@/types/booking';

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
      || request.headers.get('x-real-ip') 
      || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      );
    }
    
    // Parse request body
    let body: BookingRequest;
    
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON body',
        },
        { status: 400 }
      );
    }
    
    // Validate required fields are present
    const requiredFields = [
      'apartmentId',
      'checkIn',
      'checkOut',
      'guestFirstName',
      'guestLastName',
      'guestEmail',
      'guestPhone',
      'guestCountry',
      'guestCount',
    ];
    
    const missingFields = requiredFields.filter(
      field => body[field as keyof BookingRequest] === undefined
    );
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }
    
    // Create booking
    const result = await createBooking(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          errors: result.errors,
        },
        { status: 400 }
      );
    }
    
    // Create Stripe checkout session if configured
    let checkoutUrl: string | undefined;
    
    if (isStripeConfigured() && result.reservationId) {
      const checkoutResult = await createCheckoutSession({
        reservationId: result.reservationId,
        referenceNumber: result.referenceNumber!,
        apartmentName: result.apartmentName!,
        checkIn: result.checkIn!,
        checkOut: result.checkOut!,
        nightsCount: result.nightsCount!,
        totalPrice: result.totalPrice!,
        currency: result.currency || 'EUR',
        guestEmail: body.guestEmail,
        guestName: `${body.guestFirstName} ${body.guestLastName}`,
        language: body.language || 'cs',
      });
      
      if (checkoutResult.success) {
        checkoutUrl = checkoutResult.checkoutUrl;
      } else {
        console.error('Stripe checkout creation failed:', checkoutResult.error);
        // Continue without checkout URL - can pay later via token page
      }
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        reservationId: result.reservationId,
        referenceNumber: result.referenceNumber,
        tokenUrl: result.tokenUrl,
        checkoutUrl, // New: Stripe checkout URL
        booking: {
          apartmentName: result.apartmentName,
          checkIn: result.checkIn,
          checkOut: result.checkOut,
          nightsCount: result.nightsCount,
          totalPrice: result.totalPrice,
          currency: result.currency,
        },
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred while processing your booking. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/bookings - Get booking configuration (countries, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const language = (searchParams.get('language') as 'cs' | 'en') || 'cs';
    
    // Return booking form configuration
    return NextResponse.json({
      countries: getCountryList(language),
      minNights: 2,
      supportedLanguages: ['cs', 'en'],
    });
    
  } catch (error) {
    console.error('Booking config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
