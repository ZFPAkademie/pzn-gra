-- ============================================================================
-- Sprint 3 Database Schema
-- Golden Ridge Apartments - Payment Integration
-- ============================================================================

-- Add Stripe payment fields to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for looking up by checkout session
CREATE INDEX IF NOT EXISTS idx_reservations_stripe_session 
ON reservations(stripe_checkout_session_id) 
WHERE stripe_checkout_session_id IS NOT NULL;

-- Create index for looking up by payment intent
CREATE INDEX IF NOT EXISTS idx_reservations_payment_intent 
ON reservations(stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- PAYMENT LOG (for audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    stripe_event_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(3),
    status VARCHAR(50) NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_events_reservation ON payment_events(reservation_id);
CREATE INDEX idx_payment_events_stripe_event ON payment_events(stripe_event_id);
CREATE INDEX idx_payment_events_created ON payment_events(created_at);

-- ============================================================================
-- UPDATE EMAIL LOG for payment emails
-- ============================================================================

-- Add PAYMENT_CONFIRMATION to email_type enum if needed
-- (Using DO block for idempotency)
DO $$ 
BEGIN
    -- Check if PAYMENT_CONFIRMATION exists in email_log
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'email_type' AND e.enumlabel = 'PAYMENT_CONFIRMATION'
    ) THEN
        -- If email_type is an enum, we need to add the value
        -- If it's varchar, this will be a no-op
        BEGIN
            ALTER TYPE email_type ADD VALUE IF NOT EXISTS 'PAYMENT_CONFIRMATION';
        EXCEPTION
            WHEN others THEN NULL; -- Ignore if not an enum type
        END;
    END IF;
END $$;
