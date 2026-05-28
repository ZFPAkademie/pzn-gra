# SPRINT3_BOOKING_REFERENCE.md
## Pod Zlatým návrším — Booking Engine Reference

**Zdroj:** `golden-ridge-sprint3-FIXED.zip`  
**Status:** Implementováno, ale nepoužito (pivot na lead capture)  
**Použití:** Reference pro Fázi 2 (Booking Engine)

---

## 1. Přehled

Sprint 3 obsahuje kompletní booking engine:
- ✅ Rezervační API s validací
- ✅ Stripe Checkout integrace
- ✅ Webhook handler pro platby
- ✅ Email notifikace (Resend)
- ✅ Guest token pages
- ✅ Availability calendar
- ✅ Dynamic pricing

---

## 2. SQL Migrace

### 002_booking_schema.sql

```sql
-- Pricing
CREATE TABLE apartment_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id),
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    min_nights INTEGER DEFAULT 2,
    max_guests INTEGER NOT NULL
);

CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    adjustment_type VARCHAR(20) NOT NULL, -- 'PERCENTAGE' | 'ABSOLUTE'
    adjustment_value DECIMAL(10, 2) NOT NULL,
    priority INTEGER DEFAULT 100,
    is_enabled BOOLEAN DEFAULT TRUE
);

-- Reservations
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id),
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    
    -- Guest
    guest_first_name VARCHAR(100) NOT NULL,
    guest_last_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    guest_country VARCHAR(2) NOT NULL,
    guest_count INTEGER NOT NULL,
    special_requests TEXT,
    
    -- Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights_count INTEGER NOT NULL,
    
    -- Pricing
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    price_breakdown JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',
    -- 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'
    
    -- Consent
    gdpr_consent BOOLEAN NOT NULL,
    terms_accepted BOOLEAN NOT NULL,
    language VARCHAR(2) DEFAULT 'cs',
    source VARCHAR(20) DEFAULT 'WEB',
    -- 'WEB' | 'BOOKING' | 'AIRBNB' | 'MANUAL'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked dates
CREATE TABLE blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id),
    date DATE NOT NULL,
    reason VARCHAR(50) DEFAULT 'BOOKED',
    -- 'BOOKED' | 'MAINTENANCE' | 'OWNER_BLOCK'
    reservation_id UUID REFERENCES reservations(id),
    UNIQUE (apartment_id, date)
);

-- Guest tokens
CREATE TABLE guest_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Check-in info
CREATE TABLE apartment_checkin_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id),
    address TEXT NOT NULL,
    access_code VARCHAR(50),
    parking_info TEXT,
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    check_in_time VARCHAR(10) DEFAULT '15:00',
    check_out_time VARCHAR(10) DEFAULT '10:00',
    house_rules_cs TEXT,
    house_rules_en TEXT
);
```

### 003_payment_schema.sql

```sql
-- Add Stripe fields to reservations
ALTER TABLE reservations 
ADD COLUMN stripe_checkout_session_id VARCHAR(255),
ADD COLUMN stripe_payment_intent_id VARCHAR(255),
ADD COLUMN payment_completed_at TIMESTAMPTZ;

-- Payment events log
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id),
    event_type VARCHAR(100) NOT NULL,
    stripe_event_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(3),
    status VARCHAR(50) NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API Routes

### POST /api/v1/bookings
Vytvoří rezervaci a vrátí Stripe checkout URL.

```typescript
// Request
{
  apartmentId: string,
  checkIn: string,      // ISO date
  checkOut: string,     // ISO date
  guestFirstName: string,
  guestLastName: string,
  guestEmail: string,
  guestPhone: string,
  guestCountry: string, // ISO 2-letter
  guestCount: number,
  specialRequests?: string,
  gdprConsent: boolean,
  termsAccepted: boolean,
  language: 'cs' | 'en'
}

// Response
{
  success: true,
  reservationId: string,
  referenceNumber: string,  // "GR-20260527-XXXX"
  tokenUrl: string,         // "/rezervace/{token}"
  checkoutUrl: string,      // Stripe Checkout URL
  booking: {
    apartmentName: string,
    checkIn: string,
    checkOut: string,
    nightsCount: number,
    totalPrice: number,
    currency: string
  }
}
```

### GET /api/v1/apartments/[slug]/availability
Vrátí dostupnost pro měsíc nebo date range.

```typescript
// Calendar view
GET /api/v1/apartments/gr-suite-a/availability?month=6&year=2026

// Date range check
GET /api/v1/apartments/gr-suite-a/availability?checkIn=2026-06-01&checkOut=2026-06-05

// Response
{
  available: boolean,
  blockedDates: string[],
  message?: string
}
```

### POST /api/v1/checkout
Vytvoří Stripe Checkout session pro existující rezervaci.

```typescript
// Request
{ reservationId: string }

// Response
{
  success: true,
  checkoutUrl: string,
  sessionId: string
}
```

### POST /api/v1/webhooks/stripe
Stripe webhook handler.

Events:
- `checkout.session.completed` → Confirm payment, send email
- `checkout.session.expired` → Log
- `payment_intent.payment_failed` → Log

---

## 4. Komponenty

### Booking Flow
```
components/features/
├── availability-calendar.tsx   # Měsíční kalendář
├── date-range-picker.tsx       # Výběr check-in/out
├── booking-form.tsx            # Hlavní formulář
├── price-summary.tsx           # Souhrn ceny
├── booking-confirmation.tsx    # Potvrzení
├── booking-error.tsx           # Chybové stavy
```

### Guest Token Pages
```
app/(public)/rezervace/
├── [token]/page.tsx            # Detail rezervace
├── pozadovat-pristup/page.tsx  # Request token
├── platba-uspesna/page.tsx     # Payment success
├── platba-zrusena/page.tsx     # Payment cancelled
└── potvrzeni/page.tsx          # Confirmation
```

---

## 5. Lib Services

### lib/stripe.ts
```typescript
// Create checkout session
createCheckoutSession({
  reservationId, referenceNumber, apartmentName,
  checkIn, checkOut, nightsCount,
  totalPrice, currency,
  guestEmail, guestName, language
}): Promise<{ success, sessionId, checkoutUrl }>

// Verify webhook
verifyWebhookSignature(payload, signature): Stripe.Event | null

// Process payment
processPaymentSuccess(session): Promise<{ success, error? }>

// Check config
isStripeConfigured(): boolean
```

### lib/booking.ts
```typescript
// Validate request
validateBookingRequest(request): { isValid, errors }

// Create booking
createBooking(request): Promise<BookingResponse>

// Get reservation
getReservationById(id): Promise<Reservation | null>
getReservationByReference(ref): Promise<Reservation | null>

// Country list
getCountryList(language): Array<{ code, name }>
```

### lib/availability.ts
```typescript
checkAvailability(apartmentId, { checkIn, checkOut })
getMonthAvailability(apartmentId, year, month)
getApartmentBySlug(slug)
```

### lib/pricing.ts
```typescript
calculatePrice(apartmentId, { checkIn, checkOut, guestCount })
getApartmentPricing(apartmentId)
```

---

## 6. Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App URL (for success/cancel redirects)
NEXT_PUBLIC_APP_URL=https://podzlatymnavrsim.cz

# Database
DATABASE_URL=postgresql://...

# Email
RESEND_API_KEY=...
```

---

## 7. Typy

### types/booking.ts
```typescript
export interface BookingRequest {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  guestCount: number;
  specialRequests?: string;
  gdprConsent: boolean;
  termsAccepted: boolean;
  language?: 'cs' | 'en';
}

export interface BookingResponse {
  success: boolean;
  errors?: string[];
  reservationId?: string;
  referenceNumber?: string;
  tokenUrl?: string;
  apartmentName?: string;
  checkIn?: string;
  checkOut?: string;
  nightsCount?: number;
  totalPrice?: number;
  currency?: string;
}

export type ReservationStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type BookingSource = 
  | 'WEB' 
  | 'BOOKING' 
  | 'AIRBNB' 
  | 'MANUAL';
```

---

## 8. Integrace do Fáze 2

### Co použít přímo
- SQL migrace (upravit pro nový datový model)
- Stripe lib (lib/stripe.ts)
- Booking validace (lib/booking.ts validateBookingRequest)
- Availability logic (lib/availability.ts)
- Pricing logic (lib/pricing.ts)

### Co upravit
- API routes - přidat owner_id, commission
- Komponenty - nový Alpine Quiet Luxury design
- Email templates - nový branding
- Webhook handler - přidat owner notification

### Co přidat
- Channel manager sync
- Owner portal views
- Admin dashboard
- Commission calculation
- Payout processing

---

## 9. Soubory k extrakci

```bash
# Zkopírovat ze ZIP do nového projektu:
apps/web/src/lib/stripe.ts
apps/web/src/lib/booking.ts
apps/web/src/lib/availability.ts
apps/web/src/lib/pricing.ts
apps/web/src/types/booking.ts
apps/web/src/app/api/v1/bookings/route.ts
apps/web/src/app/api/v1/checkout/route.ts
apps/web/src/app/api/v1/webhooks/stripe/route.ts
apps/web/src/app/api/v1/apartments/[slug]/availability/route.ts
packages/database/src/schema/002_booking_schema.sql
packages/database/src/schema/003_payment_schema.sql
```

---

*Reference z: golden-ridge-sprint3-FIXED.zip*
