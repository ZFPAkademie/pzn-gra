# Golden Ridge Apartments

> Pod Zlatým návrším / Golden Ridge Apartments - Management System
> **Sprint 3: Payments & Transactional Email**

## Quick Start (Demo Mode - No Database Required)

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local - add ONLY your Stripe test keys

# 3. Start development server
pnpm dev

# 4. (Separate terminal) Start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
# Copy the webhook secret to .env.local as STRIPE_WEBHOOK_SECRET
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Mode (Mock Data)

**No database setup required!** The application runs with mock data when `DATABASE_URL` is not set.

### What works in demo mode:
- ✅ Homepage with 10 apartments
- ✅ Apartment listing and detail pages
- ✅ Booking flow with date selection
- ✅ Price calculation
- ✅ Stripe Checkout integration
- ✅ Payment success/cancel pages
- ✅ Confirmation emails (logged to console)

### Minimal .env.local for demo:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

## Test the Complete Payment Flow

1. **Start the app:**
   ```bash
   pnpm dev
   ```

2. **Start Stripe webhook listener (new terminal):**
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
   ```
   Copy the displayed `whsec_...` secret to your `.env.local`

3. **Test booking:**
   - Go to http://localhost:3000/golden-ridge-apartments
   - Click any apartment → "Rezervovat"
   - Select dates (min 2 nights, future dates)
   - Fill guest details
   - Submit → Redirect to Stripe Checkout

4. **Complete test payment:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Click "Pay"

5. **Verify success:**
   - ✅ Redirected to `/rezervace/platba-uspesna`
   - ✅ Stripe CLI shows webhook received
   - ✅ Console shows email would be sent

## Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── apartments/      # Apartment listing & details
│   │   │   ├── bookings/        # Create booking
│   │   │   ├── checkout/        # Stripe session API
│   │   │   └── webhooks/stripe/ # Payment webhooks
│   │   └── (public)/
│   │       ├── golden-ridge-apartments/
│   │       │   └── apartman/[slug]/
│   │       │       ├── page.tsx       # Apartment detail
│   │       │       └── booking/       # Booking wizard
│   │       └── rezervace/
│   │           ├── platba-uspesna/    # Payment success
│   │           └── platba-zrusena/    # Payment cancelled
│   ├── lib/
│   │   ├── mock-data.ts        # Mock apartments (10 units)
│   │   ├── stripe.ts           # Stripe integration
│   │   ├── email.ts            # Resend integration
│   │   ├── booking.ts          # Booking service
│   │   ├── availability.ts     # Availability checking
│   │   └── pricing.ts          # Price calculation
│   └── components/features/    # UI components
packages/database/
└── src/schema/
    └── 003_payment_schema.sql  # Stripe fields (for production)
```

## Sprint 3 Features

### Payment Flow
1. User fills booking form
2. Reservation created (PENDING status)
3. Stripe Checkout session created
4. User redirected to Stripe hosted checkout
5. User completes payment
6. Stripe webhook confirms payment
7. Reservation status → CONFIRMED
8. Confirmation email sent

### Transactional Email
- Automatic confirmation after payment
- Bilingual templates (Czech/English)
- Resend API integration (or console logging in dev)

## Available Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint
pnpm type-check   # TypeScript check
```

## Production Setup

For production deployment with database:

1. Set `DATABASE_URL` to your PostgreSQL connection string
2. Run database migrations from `packages/database/src/schema/`
3. Configure Stripe production keys
4. Set `RESEND_API_KEY` for real email delivery

## Prerequisites

- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- Stripe CLI (for webhook testing)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Payments:** Stripe Checkout
- **Email:** Resend (optional)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## License

Private - All rights reserved.
