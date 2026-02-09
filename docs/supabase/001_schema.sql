-- ============================================================================
-- Golden Ridge Apartments - Supabase Schema
-- Sprint 3: Production Booking System
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- APARTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS apartments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'FOR_RENT' CHECK (status IN ('FOR_RENT', 'FOR_SALE', 'SOLD', 'MAINTENANCE')),
  published BOOLEAN NOT NULL DEFAULT false,
  
  -- Descriptions (bilingual)
  description_cs TEXT,
  description_en TEXT,
  
  -- Details
  capacity INTEGER NOT NULL DEFAULT 2,
  size_sqm INTEGER,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  
  -- Pricing
  base_price_eur DECIMAL(10, 2) NOT NULL,
  min_nights INTEGER NOT NULL DEFAULT 2,
  
  -- Amenities (stored as JSONB array)
  amenities JSONB DEFAULT '[]'::jsonb,
  
  -- Photos (stored as JSONB array of URLs)
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_apartments_slug ON apartments(slug);
CREATE INDEX IF NOT EXISTS idx_apartments_published ON apartments(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_apartments_status ON apartments(status);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference
  reference_number VARCHAR(20) NOT NULL UNIQUE,
  confirmation_token VARCHAR(64) NOT NULL UNIQUE,
  
  -- Apartment link
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE RESTRICT,
  
  -- Guest details
  guest_first_name VARCHAR(100) NOT NULL,
  guest_last_name VARCHAR(100) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50),
  guest_country VARCHAR(2),
  guest_count INTEGER NOT NULL DEFAULT 1,
  
  -- Booking details
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights_count INTEGER NOT NULL,
  
  -- Pricing
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED')),
  
  -- Stripe integration
  stripe_checkout_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  payment_completed_at TIMESTAMPTZ,
  
  -- Additional
  special_requests TEXT,
  language VARCHAR(2) DEFAULT 'cs',
  
  -- Consent
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_dates CHECK (check_out > check_in),
  CONSTRAINT check_nights CHECK (nights_count >= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference_number);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_bookings_apartment ON bookings(apartment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(apartment_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON bookings(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(guest_email);

-- ============================================================================
-- BLOCKED DATES TABLE (for availability)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason VARCHAR(50) DEFAULT 'BOOKED',
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(apartment_id, date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_apartment ON blocked_dates(apartment_id, date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS apartments_updated_at ON apartments;
CREATE TRIGGER apartments_updated_at
  BEFORE UPDATE ON apartments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Apartments: Anyone can read published apartments
CREATE POLICY "Anyone can view published apartments"
  ON apartments FOR SELECT
  USING (published = true);

-- Apartments: Service role can do anything
CREATE POLICY "Service role full access to apartments"
  ON apartments FOR ALL
  TO service_role
  USING (true);

-- Bookings: Service role can do anything
CREATE POLICY "Service role full access to bookings"
  ON bookings FOR ALL
  TO service_role
  USING (true);

-- Bookings: Anon can insert (for booking creation)
CREATE POLICY "Anon can insert bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Bookings: Anyone can view their booking by token
CREATE POLICY "Anyone can view booking by token"
  ON bookings FOR SELECT
  TO anon
  USING (true);

-- Blocked dates: Anyone can read
CREATE POLICY "Anyone can view blocked dates"
  ON blocked_dates FOR SELECT
  USING (true);

-- Blocked dates: Service role can manage
CREATE POLICY "Service role full access to blocked_dates"
  ON blocked_dates FOR ALL
  TO service_role
  USING (true);
