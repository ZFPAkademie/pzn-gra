/**
 * Checkout Verify API
 * GET /api/v1/checkout/verify - Verify checkout session status
 * 
 * Sprint 3: Payment Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get checkout session from Stripe
    const session = await getCheckoutSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get reservation details
    const reservationId = session.metadata?.reservation_id;
    
    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 400 }
      );
    }

    const result = await db.query<{
      reference_number: string;
      apartment_name: string;
      check_in_date: Date;
      check_out_date: Date;
      total_price: number;
      currency: string;
      guest_first_name: string;
      guest_last_name: string;
      language: string;
    }>(
      `SELECT 
        r.reference_number,
        a.name as apartment_name,
        r.check_in_date,
        r.check_out_date,
        r.total_price,
        r.currency,
        r.guest_first_name,
        r.guest_last_name,
        r.language
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
    const locale = reservation.language as 'cs' | 'en';

    // Format dates
    const formatDate = (date: Date) => {
      return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    return NextResponse.json({
      success: true,
      session: {
        referenceNumber: reservation.reference_number,
        apartmentName: reservation.apartment_name,
        checkIn: formatDate(reservation.check_in_date),
        checkOut: formatDate(reservation.check_out_date),
        totalPrice: parseFloat(reservation.total_price.toString()),
        currency: reservation.currency,
        guestName: `${reservation.guest_first_name} ${reservation.guest_last_name}`,
        language: locale,
      },
    });

  } catch (error) {
    console.error('Checkout verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
