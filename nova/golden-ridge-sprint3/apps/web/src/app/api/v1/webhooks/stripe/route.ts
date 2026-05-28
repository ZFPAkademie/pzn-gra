/**
 * Stripe Webhook Handler
 * POST /api/v1/webhooks/stripe
 * 
 * Processes Stripe events:
 * - checkout.session.completed -> Confirm payment, send email
 * 
 * Sprint 3: Payment Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, processPaymentSuccess, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import Stripe from 'stripe';

// Disable body parsing for raw body access
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);

    if (!event) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Stripe webhook received: ${event.type}`);

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Only process if payment is complete
        if (session.payment_status === 'paid') {
          console.log(`Processing completed checkout session: ${session.id}`);
          
          // Update reservation status
          const result = await processPaymentSuccess(session);
          
          if (!result.success) {
            console.error(`Failed to process payment: ${result.error}`);
            // Still return 200 to prevent Stripe retries for invalid data
            return NextResponse.json({ received: true, warning: result.error });
          }

          // Send confirmation email
          const reservationId = session.metadata?.reservation_id;
          if (reservationId) {
            try {
              await sendPaymentConfirmationEmail(reservationId);
              console.log(`Confirmation email sent for reservation: ${reservationId}`);
            } catch (emailError) {
              console.error('Failed to send confirmation email:', emailError);
              // Don't fail the webhook for email errors
            }
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session expired: ${session.id}`);
        // Optionally: Mark reservation as expired or send reminder
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        // Optionally: Notify customer of failed payment
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
