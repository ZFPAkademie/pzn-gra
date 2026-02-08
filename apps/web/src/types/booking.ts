/**
 * Sprint 2 - Booking System Types
 * Golden Ridge Apartments
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PricingAdjustmentType {
  PERCENTAGE = 'PERCENTAGE', // +/- X%
  ABSOLUTE = 'ABSOLUTE',     // +/- X EUR
}

export enum EmailType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  CHECKIN_INSTRUCTIONS = 'CHECKIN_INSTRUCTIONS',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface Reservation {
  id: string;
  apartmentId: string;
  referenceNumber: string;
  
  // Guest details
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  guestCount: number;
  specialRequests: string | null;
  
  // Dates
  checkInDate: Date;
  checkOutDate: Date;
  nightsCount: number;
  
  // Pricing
  basePrice: number;        // Per night
  totalPrice: number;       // Final calculated price
  currency: string;         // EUR
  
  // Status
  status: ReservationStatus;
  
  // Consent
  gdprConsent: boolean;
  termsAccepted: boolean;
  
  // Language preference
  language: 'cs' | 'en';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingRule {
  id: string;
  apartmentId: string;
  name: string;
  
  // Date range when rule applies
  startDate: Date;
  endDate: Date;
  
  // Adjustment
  adjustmentType: PricingAdjustmentType;
  adjustmentValue: number; // Positive or negative
  
  // Priority (lower = higher priority)
  priority: number;
  
  // Status
  isEnabled: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestToken {
  id: string;
  reservationId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface EmailLog {
  id: string;
  reservationId: string;
  emailType: EmailType;
  recipientEmail: string;
  status: EmailStatus;
  sentAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Availability API
export interface AvailabilityRequest {
  checkIn: string;  // ISO date string
  checkOut: string; // ISO date string
}

export interface AvailabilityResponse {
  available: boolean;
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  blockedDates?: string[]; // ISO date strings of unavailable dates
  message?: string;
}

export interface MonthAvailabilityResponse {
  apartmentId: string;
  year: number;
  month: number;
  availableDates: string[];   // ISO date strings
  unavailableDates: string[]; // ISO date strings
}

// Price Calculation API
export interface PriceCalculationRequest {
  checkIn: string;  // ISO date string
  checkOut: string; // ISO date string
  guestCount?: number;
}

export interface PriceBreakdown {
  date: string;         // ISO date string
  basePrice: number;
  adjustedPrice: number;
  appliedRules: string[]; // Rule names applied
}

export interface PriceCalculationResponse {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  guestCount: number;
  
  // Pricing
  basePricePerNight: number;
  breakdown: PriceBreakdown[];
  subtotal: number;
  totalPrice: number;
  currency: string;
  
  // Validation
  isValid: boolean;
  validationErrors?: string[];
}

// Booking Creation API
export interface BookingRequest {
  apartmentId: string;
  
  // Dates
  checkIn: string;
  checkOut: string;
  
  // Guest details
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  guestCount: number;
  specialRequests?: string;
  
  // Consent
  gdprConsent: boolean;
  termsAccepted: boolean;
  
  // Language
  language: 'cs' | 'en';
}

export interface BookingResponse {
  success: boolean;
  reservationId?: string;
  referenceNumber?: string;
  tokenUrl?: string;
  
  // Confirmation details
  apartmentName?: string;
  checkIn?: string;
  checkOut?: string;
  nightsCount?: number;
  totalPrice?: number;
  currency?: string;
  
  // Errors
  errors?: string[];
}

// Token Page API
export interface TokenPageResponse {
  valid: boolean;
  expired?: boolean;
  
  // Reservation data (if valid)
  reservation?: {
    referenceNumber: string;
    status: ReservationStatus;
    apartmentName: string;
    apartmentSlug: string;
    
    checkInDate: string;
    checkOutDate: string;
    nightsCount: number;
    
    guestFirstName: string;
    guestLastName: string;
    guestCount: number;
    
    totalPrice: number;
    currency: string;
    
    language: 'cs' | 'en';
  };
  
  // Check-in info (if within window)
  checkInInfo?: {
    address: string;
    accessCode: string;
    parkingInfo: string;
    wifiName: string;
    wifiPassword: string;
    emergencyContact: string;
    checkInTime: string;
    checkOutTime: string;
  };
  
  // Content
  houseRules?: string;
  apartmentInfo?: string;
}

export interface MessageRequest {
  message: string;
  guestEmail: string;
}

export interface MessageResponse {
  success: boolean;
  error?: string;
}

export interface RequestNewTokenRequest {
  email: string;
  referenceNumber: string;
}

export interface RequestNewTokenResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// APARTMENT EXTENSION (from Sprint 1)
// ============================================================================

export interface ApartmentPricing {
  apartmentId: string;
  basePricePerNight: number;
  currency: string;
  minNights: number;
  maxGuests: number;
}
