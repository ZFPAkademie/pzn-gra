/**
 * Checkout API
 * POST /api/v1/checkout - Create Stripe checkout session
 * 
 * Sprint 3: Payment Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import { db } from '@/lib/db';

interface CheckoutRequest {
  reservationId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment system not configured',
        },
        { status: 503 }
      );
    }

    // Parse request body
    let body: CheckoutRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    // Get reservation details
    const result = await db.query<{
      id: string;
      reference_number: string;
      guest_email: string;
      guest_first_name: string;
      guest_last_name: string;
      check_in_date: Date;
      check_out_date: Date;
      nights_count: number;
      total_price: number;
      currency: string;
      language: string;
      status: string;
      apartment_name: string;
    }>(
      `SELECT 
        r.id,
        r.reference_number,
        r.guest_email,
        r.guest_first_name,
        r.guest_last_name,
        r.check_in_date,
        r.check_out_date,
        r.nights_count,
        r.total_price,
        r.currency,
        r.language,
        r.status,
        a.name as apartment_name
       FROM reservations r
       JOIN apartments a ON r.apartment_id = a.id
       WHERE r.id = $1`,
      [reservationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const reservation = result.rows[0];

    // Only allow checkout for PENDING reservations
    if (reservation.status !== 'PENDING') {
      return NextResponse.json(
        { 
          success: false, 
          error: reservation.status === 'CONFIRMED' 
            ? 'This reservation has already been paid' 
            : 'This reservation cannot be paid',
        },
        { status: 400 }
      );
    }

    // Format dates
    const checkIn = reservation.check_in_date.toISOString().split('T')[0];
    const checkOut = reservation.check_out_date.toISOString().split('T')[0];

    // Create checkout session
    const checkoutResult = await createCheckoutSession({
      reservationId: reservation.id,
      referenceNumber: reservation.reference_number,
      apartmentName: reservation.apartment_name,
      checkIn,
      checkOut,
      nightsCount: reservation.nights_count,
      totalPrice: parseFloat(reservation.total_price.toString()),
      currency: reservation.currency,
      guestEmail: reservation.guest_email,
      guestName: `${reservation.guest_first_name} ${reservation.guest_last_name}`,
      language: reservation.language as 'cs' | 'en',
    });

    if (!checkoutResult.success) {
      return NextResponse.json(
        { success: false, error: checkoutResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.checkoutUrl,
      sessionId: checkoutResult.sessionId,
    });

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
