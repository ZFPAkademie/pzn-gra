-- ============================================================================
-- Sprint 2 Database Schema
-- Golden Ridge Apartments - Booking System
-- ============================================================================

-- Note: This extends the existing schema from Sprint 0/1
-- Apartments table assumed to exist

-- ============================================================================
-- PRICING CONFIGURATION
-- ============================================================================

-- Base pricing per apartment
CREATE TABLE IF NOT EXISTS apartment_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    min_nights INTEGER NOT NULL DEFAULT 2,
    max_guests INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_apartment_pricing UNIQUE (apartment_id),
    CONSTRAINT positive_base_price CHECK (base_price_per_night > 0),
    CONSTRAINT valid_min_nights CHECK (min_nights >= 1),
    CONSTRAINT valid_max_guests CHECK (max_guests >= 1)
);

-- Seasonal/date-based pricing rules
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    
    -- Date range when rule applies
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Adjustment type: 'PERCENTAGE' or 'ABSOLUTE'
    adjustment_type VARCHAR(20) NOT NULL,
    -- Value can be positive (increase) or negative (decrease)
    adjustment_value DECIMAL(10, 2) NOT NULL,
    
    -- Priority: lower number = higher priority (applied first)
    priority INTEGER NOT NULL DEFAULT 100,
    
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_adjustment_type CHECK (adjustment_type IN ('PERCENTAGE', 'ABSOLUTE'))
);

CREATE INDEX idx_pricing_rules_apartment ON pricing_rules(apartment_id);
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX idx_pricing_rules_enabled ON pricing_rules(is_enabled) WHERE is_enabled = TRUE;

-- ============================================================================
-- RESERVATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE RESTRICT,
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    
    -- Guest details
    guest_first_name VARCHAR(100) NOT NULL,
    guest_last_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    guest_country VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
    guest_count INTEGER NOT NULL,
    special_requests TEXT,
    
    -- Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights_count INTEGER NOT NULL,
    
    -- Pricing (snapshot at booking time)
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    price_breakdown JSONB, -- Stores detailed per-night breakdown
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    -- Consent
    gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Language preference
    language VARCHAR(2) NOT NULL DEFAULT 'cs',
    
    -- Source tracking (for future OTA integration)
    source VARCHAR(20) NOT NULL DEFAULT 'WEB',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_nights CHECK (nights_count >= 2),
    CONSTRAINT valid_guest_count CHECK (guest_count >= 1),
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT valid_language CHECK (language IN ('cs', 'en')),
    CONSTRAINT valid_source CHECK (source IN ('WEB', 'BOOKING', 'AIRBNB', 'MANUAL')),
    CONSTRAINT consent_required CHECK (gdpr_consent = TRUE AND terms_accepted = TRUE)
);

CREATE INDEX idx_reservations_apartment ON reservations(apartment_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_email ON reservations(guest_email);
CREATE INDEX idx_reservations_reference ON reservations(reference_number);

-- ============================================================================
-- BLOCKED DATES (for availability management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason VARCHAR(50) NOT NULL DEFAULT 'BOOKED', -- BOOKED, MAINTENANCE, OWNER_BLOCK
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_apartment_date UNIQUE (apartment_id, date),
    CONSTRAINT valid_reason CHECK (reason IN ('BOOKED', 'MAINTENANCE', 'OWNER_BLOCK'))
);

CREATE INDEX idx_blocked_dates_apartment ON blocked_dates(apartment_id);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX idx_blocked_dates_apartment_date ON blocked_dates(apartment_id, date);

-- ============================================================================
-- GUEST TOKENS
-- ============================================================================

CREATE TABLE IF NOT EXISTS guest_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_guest_tokens_hash ON guest_tokens(token_hash);
CREATE INDEX idx_guest_tokens_reservation ON guest_tokens(reservation_id);
CREATE INDEX idx_guest_tokens_expiry ON guest_tokens(expires_at);

-- ============================================================================
-- EMAIL LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    email_type VARCHAR(30) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_email_type CHECK (email_type IN ('BOOKING_CONFIRMATION', 'CHECKIN_INSTRUCTIONS')),
    CONSTRAINT valid_email_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE INDEX idx_email_log_reservation ON email_log(reservation_id);
CREATE INDEX idx_email_log_status ON email_log(status);
CREATE INDEX idx_email_log_type ON email_log(email_type);

-- ============================================================================
-- CHECK-IN INFORMATION
-- ============================================================================

-- Stores check-in details per apartment (managed by manager in Sprint 5)
CREATE TABLE IF NOT EXISTS apartment_checkin_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    
    address TEXT NOT NULL,
    access_code VARCHAR(50),
    parking_info TEXT,
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    emergency_contact VARCHAR(100),
    check_in_time VARCHAR(10) NOT NULL DEFAULT '15:00',
    check_out_time VARCHAR(10) NOT NULL DEFAULT '10:00',
    
    house_rules_cs TEXT,
    house_rules_en TEXT,
    apartment_info_cs TEXT,
    apartment_info_en TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_apartment_checkin UNIQUE (apartment_id)
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate unique reservation reference number (GR-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    date_part VARCHAR(8);
    random_part VARCHAR(4);
    new_ref VARCHAR(20);
    exists_count INTEGER;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    LOOP
        random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
        new_ref := 'GR-' || date_part || '-' || random_part;
        
        SELECT COUNT(*) INTO exists_count 
        FROM reservations 
        WHERE reference_number = new_ref;
        
        EXIT WHEN exists_count = 0;
    END LOOP;
    
    RETURN new_ref;
END;
$$ LANGUAGE plpgsql;

-- Check if date range is available for apartment
CREATE OR REPLACE FUNCTION check_availability(
    p_apartment_id UUID,
    p_check_in DATE,
    p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    blocked_count INTEGER;
BEGIN
    -- Check for any blocked dates in the range (excluding check-out date)
    SELECT COUNT(*) INTO blocked_count
    FROM blocked_dates
    WHERE apartment_id = p_apartment_id
      AND date >= p_check_in
      AND date < p_check_out;
    
    RETURN blocked_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Get blocked dates for apartment in date range
CREATE OR REPLACE FUNCTION get_blocked_dates(
    p_apartment_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(blocked_date DATE, block_reason VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT date, reason
    FROM blocked_dates
    WHERE apartment_id = p_apartment_id
      AND date >= p_start_date
      AND date <= p_end_date
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_apartment_pricing_updated_at
    BEFORE UPDATE ON apartment_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_apartment_checkin_info_updated_at
    BEFORE UPDATE ON apartment_checkin_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-generate reference number for new reservations
CREATE OR REPLACE FUNCTION set_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        NEW.reference_number := generate_reference_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reservations_reference_number
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION set_reference_number();

-- Auto-block dates when reservation is created
CREATE OR REPLACE FUNCTION block_reservation_dates()
RETURNS TRIGGER AS $$
DECLARE
    d DATE;
BEGIN
    -- Only block for non-cancelled reservations
    IF NEW.status != 'CANCELLED' THEN
        -- Block each night (not including checkout date)
        FOR d IN SELECT generate_series(NEW.check_in_date, NEW.check_out_date - 1, '1 day'::interval)::date
        LOOP
            INSERT INTO blocked_dates (apartment_id, date, reason, reservation_id)
            VALUES (NEW.apartment_id, d, 'BOOKED', NEW.id)
            ON CONFLICT (apartment_id, date) DO UPDATE
            SET reason = 'BOOKED', reservation_id = NEW.id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reservations_block_dates
    AFTER INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION block_reservation_dates();

-- Unblock dates when reservation is cancelled
CREATE OR REPLACE FUNCTION unblock_cancelled_reservation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
        DELETE FROM blocked_dates
        WHERE reservation_id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_reservations_unblock_cancelled
    AFTER UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION unblock_cancelled_reservation();
