/**
 * Stripe Service
 * Handles Stripe Checkout session creation and webhook processing
 * 
 * Sprint 3: Payment Integration
 */

import Stripe from 'stripe';
import { db } from './db';
import { getMockReservation } from './booking';

// Mock mode detection
const USE_MOCK = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

// In-memory store for mock stripe sessions
const mockStripeSessions = new Map<string, any>();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Get webhook secret for signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

interface CreateCheckoutSessionParams {
  reservationId: string;
  referenceNumber: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  totalPrice: number;
  currency: string;
  guestEmail: string;
  guestName: string;
  language: 'cs' | 'en';
}

interface CheckoutSessionResult {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Create a Stripe Checkout session for a reservation
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isCs = params.language === 'cs';
    
    // Create product description
    const description = isCs
      ? `${params.apartmentName} - ${params.nightsCount} ${params.nightsCount === 1 ? 'noc' : params.nightsCount < 5 ? 'noci' : 'nocí'} (${params.checkIn} - ${params.checkOut})`
      : `${params.apartmentName} - ${params.nightsCount} ${params.nightsCount === 1 ? 'night' : 'nights'} (${params.checkIn} - ${params.checkOut})`;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: params.guestEmail,
      client_reference_id: params.reservationId,
      
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: Math.round(params.totalPrice * 100), // Stripe uses cents
            product_data: {
              name: isCs ? 'Rezervace apartmánu' : 'Apartment Reservation',
              description,
              metadata: {
                reservation_id: params.reservationId,
                reference_number: params.referenceNumber,
              },
            },
          },
          quantity: 1,
        },
      ],
      
      metadata: {
        reservation_id: params.reservationId,
        reference_number: params.referenceNumber,
        apartment_name: params.apartmentName,
        check_in: params.checkIn,
        check_out: params.checkOut,
        nights_count: params.nightsCount.toString(),
        guest_name: params.guestName,
        language: params.language,
      },
      
      success_url: `${baseUrl}/rezervace/platba-uspesna?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/rezervace/platba-zrusena?reservation_id=${params.reservationId}`,
      
      // Set locale for Stripe Checkout page
      locale: params.language === 'cs' ? 'cs' : 'en',
      
      // Expiration (30 minutes)
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    // Store checkout session ID in database (or mock store)
    if (USE_MOCK) {
      // Store in mock session map
      mockStripeSessions.set(session.id, {
        reservationId: params.reservationId,
        sessionId: session.id,
      });
      console.log(`[MOCK] Stripe checkout session stored: ${session.id}`);
    } else {
      await db.query(
        `UPDATE reservations 
         SET stripe_checkout_session_id = $1, updated_at = NOW() 
         WHERE id = $2`,
        [session.id, params.reservationId]
      );
    }

    return {
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url || undefined,
    };

  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Process successful payment from webhook
 */
export async function processPaymentSuccess(
  session: Stripe.Checkout.Session
): Promise<{ success: boolean; error?: string }> {
  try {
    const reservationId = session.metadata?.reservation_id;
    
    if (!reservationId) {
      return { success: false, error: 'Missing reservation ID in session metadata' };
    }

    // MOCK MODE: Update mock reservation
    if (USE_MOCK) {
      const mockReservation = getMockReservation(reservationId);
      if (mockReservation) {
        mockReservation.status = 'CONFIRMED';
        mockReservation.stripePaymentIntentId = session.payment_intent;
        mockReservation.paymentCompletedAt = new Date();
        console.log(`[MOCK] Payment confirmed for reservation: ${mockReservation.referenceNumber}`);
        return { success: true };
      }
      console.log(`[MOCK] Reservation not found in mock store: ${reservationId}`);
      // Continue anyway - the session might be from Stripe test dashboard
      return { success: true };
    }

    // Update reservation status to CONFIRMED
    const result = await db.query(
      `UPDATE reservations 
       SET status = 'CONFIRMED', 
           stripe_payment_intent_id = $1,
           payment_completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2 AND status = 'PENDING'
       RETURNING id, reference_number, guest_email`,
      [session.payment_intent, reservationId]
    );

    if (result.rows.length === 0) {
      // Check if already processed
      const existingResult = await db.query(
        `SELECT status FROM reservations WHERE id = $1`,
        [reservationId]
      );
      
      if (existingResult.rows.length > 0 && existingResult.rows[0].status === 'CONFIRMED') {
        return { success: true }; // Already processed
      }
      
      return { success: false, error: 'Reservation not found or already processed' };
    }

    console.log(`Payment confirmed for reservation ${result.rows[0].reference_number}`);
    
    return { success: true };

  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

/**
 * Get checkout session details
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error('Failed to retrieve checkout session:', error);
    return null;
  }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export { stripe };
