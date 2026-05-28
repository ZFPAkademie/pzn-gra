/**
 * Booking Service
 * Handles reservation creation and management
 * 
 * Sprint 3: Added mock data fallback for development
 */

import { db } from './db';
import { checkAvailability, getApartmentBySlug } from './availability';
import { calculatePrice, getApartmentPricing } from './pricing';
import { generateToken, createGuestToken } from './token';
import { queueConfirmationEmail } from './email';
import { getMockApartmentById } from './mock-data';
import type {
  BookingRequest,
  BookingResponse,
  Reservation,
  ReservationStatus,
  ValidationResult,
} from '@/types/booking';

// Mock mode detection
const USE_MOCK = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

// In-memory store for mock reservations
const mockReservations = new Map<string, any>();

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]{6,20}$/;

// List of valid country codes (ISO 3166-1 alpha-2)
const VALID_COUNTRIES = [
  'CZ', 'SK', 'DE', 'AT', 'PL', 'HU', 'NL', 'BE', 'GB', 'US', 
  'FR', 'IT', 'ES', 'CH', 'DK', 'SE', 'NO', 'FI', 'RU', 'UA',
  // Add more as needed
];

/**
 * Validate booking request
 */
export function validateBookingRequest(request: BookingRequest): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!request.apartmentId?.trim()) {
    errors.push('Apartment ID is required');
  }
  
  if (!request.checkIn?.trim()) {
    errors.push('Check-in date is required');
  }
  
  if (!request.checkOut?.trim()) {
    errors.push('Check-out date is required');
  }
  
  // Guest details validation
  if (!request.guestFirstName?.trim()) {
    errors.push('First name is required');
  } else if (request.guestFirstName.length < 2 || request.guestFirstName.length > 50) {
    errors.push('First name must be between 2 and 50 characters');
  }
  
  if (!request.guestLastName?.trim()) {
    errors.push('Last name is required');
  } else if (request.guestLastName.length < 2 || request.guestLastName.length > 50) {
    errors.push('Last name must be between 2 and 50 characters');
  }
  
  if (!request.guestEmail?.trim()) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(request.guestEmail)) {
    errors.push('Invalid email format');
  }
  
  if (!request.guestPhone?.trim()) {
    errors.push('Phone number is required');
  } else if (!PHONE_REGEX.test(request.guestPhone)) {
    errors.push('Invalid phone number format');
  }
  
  if (!request.guestCountry?.trim()) {
    errors.push('Country is required');
  } else if (!VALID_COUNTRIES.includes(request.guestCountry.toUpperCase())) {
    errors.push('Invalid country code');
  }
  
  if (!request.guestCount || request.guestCount < 1) {
    errors.push('Guest count must be at least 1');
  }
  
  // Consent validation
  if (!request.gdprConsent) {
    errors.push('GDPR consent is required');
  }
  
  if (!request.termsAccepted) {
    errors.push('Terms acceptance is required');
  }
  
  // Language validation
  if (request.language && !['cs', 'en'].includes(request.language)) {
    errors.push('Language must be "cs" or "en"');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a new booking
 */
export async function createBooking(
  request: BookingRequest
): Promise<BookingResponse> {
  // Step 1: Validate request
  const validation = validateBookingRequest(request);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }
  
  // MOCK MODE: Handle booking without database
  if (USE_MOCK) {
    return createMockBooking(request);
  }
  
  // Step 2: Verify apartment exists and get details
  const apartmentResult = await db.query<{
    id: string;
    name: string;
    slug: string;
    rental_enabled: boolean;
  }>(
    `SELECT id, name, slug, rental_enabled FROM apartments WHERE id = $1`,
    [request.apartmentId]
  );
  
  if (apartmentResult.rows.length === 0) {
    return {
      success: false,
      errors: ['Apartment not found'],
    };
  }
  
  const apartment = apartmentResult.rows[0];
  
  if (!apartment.rental_enabled) {
    return {
      success: false,
      errors: ['Apartment is not available for rental'],
    };
  }
  
  // Step 3: Check availability
  const availability = await checkAvailability(request.apartmentId, {
    checkIn: request.checkIn,
    checkOut: request.checkOut,
  });
  
  if (!availability.available) {
    return {
      success: false,
      errors: [availability.message || 'Selected dates are not available'],
    };
  }
  
  // Step 4: Get pricing and validate guest count
  const pricing = await getApartmentPricing(request.apartmentId);
  if (!pricing) {
    return {
      success: false,
      errors: ['Apartment pricing not configured'],
    };
  }
  
  if (request.guestCount > pricing.max_guests) {
    return {
      success: false,
      errors: [`Maximum ${pricing.max_guests} guests allowed for this apartment`],
    };
  }
  
  // Step 5: Calculate price
  const priceCalculation = await calculatePrice(request.apartmentId, {
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    guestCount: request.guestCount,
  });
  
  if (!priceCalculation.isValid) {
    return {
      success: false,
      errors: priceCalculation.validationErrors || ['Price calculation failed'],
    };
  }
  
  // Step 6: Create reservation in database (within transaction)
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Double-check availability (lock rows)
    const lockCheck = await client.query(
      `SELECT date FROM blocked_dates 
       WHERE apartment_id = $1 
       AND date >= $2 AND date < $3
       FOR UPDATE`,
      [request.apartmentId, request.checkIn, request.checkOut]
    );
    
    if (lockCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        errors: ['Selected dates are no longer available'],
      };
    }
    
    // Insert reservation (reference_number generated by trigger)
    const reservationResult = await client.query<{
      id: string;
      reference_number: string;
    }>(
      `INSERT INTO reservations (
        apartment_id,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_country,
        guest_count,
        special_requests,
        check_in_date,
        check_out_date,
        nights_count,
        base_price_per_night,
        total_price,
        currency,
        price_breakdown,
        status,
        gdpr_consent,
        terms_accepted,
        language,
        source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, reference_number`,
      [
        request.apartmentId,
        request.guestFirstName.trim(),
        request.guestLastName.trim(),
        request.guestEmail.trim().toLowerCase(),
        request.guestPhone.trim(),
        request.guestCountry.toUpperCase(),
        request.guestCount,
        request.specialRequests?.trim() || null,
        request.checkIn,
        request.checkOut,
        priceCalculation.nightsCount,
        priceCalculation.basePricePerNight,
        priceCalculation.totalPrice,
        priceCalculation.currency,
        JSON.stringify(priceCalculation.breakdown),
        'PENDING' as ReservationStatus,
        request.gdprConsent,
        request.termsAccepted,
        request.language || 'cs',
        'WEB',
      ]
    );
    
    const reservation = reservationResult.rows[0];
    
    // Generate and store guest token
    const token = generateToken();
    await createGuestToken(client, reservation.id, token);
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Queue confirmation email (async, outside transaction)
    await queueConfirmationEmail(reservation.id, token);
    
    // Build token URL
    const tokenUrl = `/rezervace/${token}`;
    
    return {
      success: true,
      reservationId: reservation.id,
      referenceNumber: reservation.reference_number,
      tokenUrl,
      apartmentName: apartment.name,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      nightsCount: priceCalculation.nightsCount,
      totalPrice: priceCalculation.totalPrice,
      currency: priceCalculation.currency,
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking creation error:', error);
    
    return {
      success: false,
      errors: ['An error occurred while creating your booking. Please try again.'],
    };
  } finally {
    client.release();
  }
}

/**
 * Get reservation by ID
 */
export async function getReservationById(
  reservationId: string
): Promise<Reservation | null> {
  const result = await db.query<any>(
    `SELECT 
      r.*,
      a.name as apartment_name,
      a.slug as apartment_slug
     FROM reservations r
     JOIN apartments a ON r.apartment_id = a.id
     WHERE r.id = $1`,
    [reservationId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapReservationRow(result.rows[0]);
}

/**
 * Get reservation by reference number
 */
export async function getReservationByReference(
  referenceNumber: string
): Promise<Reservation | null> {
  const result = await db.query<any>(
    `SELECT 
      r.*,
      a.name as apartment_name,
      a.slug as apartment_slug
     FROM reservations r
     JOIN apartments a ON r.apartment_id = a.id
     WHERE r.reference_number = $1`,
    [referenceNumber]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return mapReservationRow(result.rows[0]);
}

/**
 * Map database row to Reservation type
 */
function mapReservationRow(row: any): Reservation & { 
  apartmentName: string; 
  apartmentSlug: string;
} {
  return {
    id: row.id,
    apartmentId: row.apartment_id,
    referenceNumber: row.reference_number,
    guestFirstName: row.guest_first_name,
    guestLastName: row.guest_last_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    guestCountry: row.guest_country,
    guestCount: row.guest_count,
    specialRequests: row.special_requests,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    nightsCount: row.nights_count,
    basePrice: row.base_price_per_night,
    totalPrice: parseFloat(row.total_price),
    currency: row.currency,
    status: row.status as ReservationStatus,
    gdprConsent: row.gdpr_consent,
    termsAccepted: row.terms_accepted,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    apartmentName: row.apartment_name,
    apartmentSlug: row.apartment_slug,
  };
}

/**
 * Get list of valid countries with names
 */
export function getCountryList(language: 'cs' | 'en' = 'cs'): Array<{
  code: string;
  name: string;
}> {
  const countriesCs: Record<string, string> = {
    CZ: 'Česká republika',
    SK: 'Slovensko',
    DE: 'Německo',
    AT: 'Rakousko',
    PL: 'Polsko',
    HU: 'Maďarsko',
    NL: 'Nizozemsko',
    BE: 'Belgie',
    GB: 'Velká Británie',
    US: 'USA',
    FR: 'Francie',
    IT: 'Itálie',
    ES: 'Španělsko',
    CH: 'Švýcarsko',
    DK: 'Dánsko',
    SE: 'Švédsko',
    NO: 'Norsko',
    FI: 'Finsko',
    RU: 'Rusko',
    UA: 'Ukrajina',
  };
  
  const countriesEn: Record<string, string> = {
    CZ: 'Czech Republic',
    SK: 'Slovakia',
    DE: 'Germany',
    AT: 'Austria',
    PL: 'Poland',
    HU: 'Hungary',
    NL: 'Netherlands',
    BE: 'Belgium',
    GB: 'United Kingdom',
    US: 'United States',
    FR: 'France',
    IT: 'Italy',
    ES: 'Spain',
    CH: 'Switzerland',
    DK: 'Denmark',
    SE: 'Sweden',
    NO: 'Norway',
    FI: 'Finland',
    RU: 'Russia',
    UA: 'Ukraine',
  };
  
  const countries = language === 'cs' ? countriesCs : countriesEn;
  
  return VALID_COUNTRIES.map(code => ({
    code,
    name: countries[code] || code,
  }));
}

/**
 * Create a mock booking (for development without database)
 */
async function createMockBooking(request: BookingRequest): Promise<BookingResponse> {
  // Get apartment from mock data
  const apartment = getMockApartmentById(request.apartmentId);
  
  if (!apartment) {
    return {
      success: false,
      errors: ['Apartment not found'],
    };
  }
  
  // Validate guest count
  if (request.guestCount > apartment.capacity) {
    return {
      success: false,
      errors: [`Maximum ${apartment.capacity} guests allowed for this apartment`],
    };
  }
  
  // Calculate nights and price
  const checkInDate = new Date(request.checkIn);
  const checkOutDate = new Date(request.checkOut);
  const nightsCount = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = nightsCount * apartment.basePriceEur;
  
  // Generate mock reservation ID and reference number
  const reservationId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const referenceNumber = `GR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store in mock reservations map
  const reservation = {
    id: reservationId,
    referenceNumber,
    token,
    apartmentId: request.apartmentId,
    apartmentName: apartment.name,
    guestFirstName: request.guestFirstName,
    guestLastName: request.guestLastName,
    guestEmail: request.guestEmail,
    guestPhone: request.guestPhone,
    guestCountry: request.guestCountry,
    guestCount: request.guestCount,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    nightsCount,
    totalPrice,
    currency: 'EUR',
    status: 'PENDING',
    language: request.language,
    createdAt: new Date(),
  };
  
  mockReservations.set(reservationId, reservation);
  mockReservations.set(token, reservation); // Also index by token
  
  console.log(`[MOCK] Created reservation: ${referenceNumber}`);
  console.log(`[MOCK] Token URL: /rezervace/${token}`);
  
  // Queue confirmation email (will just log in mock mode)
  try {
    await queueConfirmationEmail(reservationId, token);
  } catch (e) {
    console.log('[MOCK] Email would be sent:', request.guestEmail);
  }
  
  return {
    success: true,
    reservationId,
    referenceNumber,
    tokenUrl: `/rezervace/${token}`,
    apartmentName: apartment.name,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    nightsCount,
    totalPrice,
    currency: 'EUR',
  };
}

/**
 * Get mock reservation by ID or token
 */
export function getMockReservation(idOrToken: string) {
  return mockReservations.get(idOrToken);
}
