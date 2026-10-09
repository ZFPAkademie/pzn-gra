import { NextRequest, NextResponse } from 'next/server';
import { getStripe, StripeEvent } from '@/lib/stripe';
import { confirmBookingPayment, getBookingById } from '@/lib/booking-engine/bookings';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: StripeEvent;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        console.error('[stripe-webhook] Missing bookingId in metadata, session:', session.id);
        return NextResponse.json({ received: true });
      }

      const booking = await getBookingById(bookingId);
      if (!booking) {
        console.error('[stripe-webhook] Booking not found:', bookingId, 'session:', session.id);
        return NextResponse.json({ received: true });
      }

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? '');

      // Dostupnost se počítá z bookings (status != cancelled), potvrzení tedy termín blokuje samo.
      const confirmResult = await confirmBookingPayment(booking.id, paymentIntentId);
      if (!confirmResult.ok) {
        console.error('[stripe-webhook] confirmBookingPayment failed:', confirmResult.error);
      }

      console.log('[stripe-webhook] Booking confirmed:', booking.id);
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err);
  }

  return NextResponse.json({ received: true });
}
