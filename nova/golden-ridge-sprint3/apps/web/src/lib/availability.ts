/**
 * Availability Service
 * Handles availability checking for apartments
 * 
 * Sprint 3: Added mock data fallback for development
 */

import { db } from './db';
import { getMockApartmentBySlug, getMockApartmentById, MOCK_APARTMENTS } from './mock-data';
import type {
  AvailabilityRequest,
  AvailabilityResponse,
  MonthAvailabilityResponse,
  ValidationResult,
} from '@/types/booking';

// Minimum nights constant (from business rules)
const MIN_NIGHTS = 2;

// Mock mode detection - use mock when DB is not configured
const USE_MOCK = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

/**
 * Validate date range for availability check
 */
export function validateDateRange(checkIn: string, checkOut: string): ValidationResult {
  const errors: string[] = [];
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check valid dates
  if (isNaN(checkInDate.getTime())) {
    errors.push('Invalid check-in date');
  }
  if (isNaN(checkOutDate.getTime())) {
    errors.push('Invalid check-out date');
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Check-in must be in the future
  if (checkInDate < today) {
    errors.push('Check-in date must be in the future');
  }
  
  // Check-out must be after check-in
  if (checkOutDate <= checkInDate) {
    errors.push('Check-out date must be after check-in date');
  }
  
  // Minimum nights check
  const nightsCount = calculateNights(checkInDate, checkOutDate);
  if (nightsCount < MIN_NIGHTS) {
    errors.push(`Minimum stay is ${MIN_NIGHTS} nights`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get all dates in a range (excluding check-out date)
 */
export function getDatesInRange(checkIn: Date, checkOut: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(checkIn);
  
  while (currentDate < checkOut) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check availability for a specific date range
 */
export async function checkAvailability(
  apartmentId: string,
  request: AvailabilityRequest
): Promise<AvailabilityResponse> {
  const { checkIn, checkOut } = request;
  
  // Validate dates
  const validation = validateDateRange(checkIn, checkOut);
  if (!validation.isValid) {
    return {
      available: false,
      apartmentId,
      checkIn,
      checkOut,
      nightsCount: 0,
      message: validation.errors.join('; '),
    };
  }
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nightsCount = calculateNights(checkInDate, checkOutDate);
  
  // Mock mode: all dates available
  if (USE_MOCK) {
    return {
      available: true,
      apartmentId,
      checkIn,
      checkOut,
      nightsCount,
    };
  }
  
  // Query blocked dates in the range
  const blockedDates = await db.query<{ date: Date; reason: string }>(
    `SELECT date, reason FROM blocked_dates 
     WHERE apartment_id = $1 
     AND date >= $2 
     AND date < $3
     ORDER BY date`,
    [apartmentId, checkIn, checkOut]
  );
  
  const isAvailable = blockedDates.rows.length === 0;
  
  return {
    available: isAvailable,
    apartmentId,
    checkIn,
    checkOut,
    nightsCount,
    blockedDates: isAvailable 
      ? undefined 
      : blockedDates.rows.map(row => formatDateISO(row.date)),
    message: isAvailable 
      ? undefined 
      : 'Selected dates are not available',
  };
}

/**
 * Get monthly availability calendar
 */
export async function getMonthAvailability(
  apartmentId: string,
  year: number,
  month: number
): Promise<MonthAvailabilityResponse> {
  // Calculate first and last day of month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Mock mode: all future dates available
  if (USE_MOCK) {
    const availableDates: string[] = [];
    const unavailableDates: string[] = [];
    
    const currentDate = new Date(firstDay);
    while (currentDate <= lastDay) {
      const dateStr = formatDateISO(currentDate);
      
      // Past dates are unavailable
      if (currentDate < today) {
        unavailableDates.push(dateStr);
      } else {
        availableDates.push(dateStr);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      apartmentId,
      year,
      month,
      availableDates,
      unavailableDates,
    };
  }
  
  // Get blocked dates for the month
  const blockedDates = await db.query<{ date: Date }>(
    `SELECT date FROM blocked_dates 
     WHERE apartment_id = $1 
     AND date >= $2 
     AND date <= $3
     ORDER BY date`,
    [apartmentId, formatDateISO(firstDay), formatDateISO(lastDay)]
  );
  
  const blockedSet = new Set(
    blockedDates.rows.map(row => formatDateISO(row.date))
  );
  
  // Generate all dates in month
  const availableDates: string[] = [];
  const unavailableDates: string[] = [];
  
  const currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    const dateStr = formatDateISO(currentDate);
    
    // Past dates are unavailable
    if (currentDate < today) {
      unavailableDates.push(dateStr);
    } else if (blockedSet.has(dateStr)) {
      unavailableDates.push(dateStr);
    } else {
      availableDates.push(dateStr);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    apartmentId,
    year,
    month,
    availableDates,
    unavailableDates,
  };
}

/**
 * Check if apartment exists and is rental-enabled
 */
export async function verifyApartmentExists(
  apartmentId: string
): Promise<{ exists: boolean; rentalEnabled: boolean; slug: string | null }> {
  // Mock mode
  if (USE_MOCK) {
    const apt = getMockApartmentById(apartmentId);
    if (!apt) {
      return { exists: false, rentalEnabled: false, slug: null };
    }
    return { exists: true, rentalEnabled: true, slug: apt.slug };
  }
  
  const result = await db.query<{ 
    id: string; 
    rental_enabled: boolean; 
    slug: string;
  }>(
    `SELECT id, rental_enabled, slug FROM apartments WHERE id = $1`,
    [apartmentId]
  );
  
  if (result.rows.length === 0) {
    return { exists: false, rentalEnabled: false, slug: null };
  }
  
  return {
    exists: true,
    rentalEnabled: result.rows[0].rental_enabled,
    slug: result.rows[0].slug,
  };
}

/**
 * Get apartment ID by slug
 */
export async function getApartmentBySlug(
  slug: string
): Promise<{ id: string; name: string; maxGuests: number } | null> {
  // Mock mode
  if (USE_MOCK) {
    const apt = getMockApartmentBySlug(slug, 'cs');
    if (!apt) return null;
    return {
      id: apt.id,
      name: apt.name,
      maxGuests: apt.maxGuests || apt.capacity,
    };
  }
  
  const result = await db.query<{
    id: string;
    name: string;
    max_guests: number;
  }>(
    `SELECT a.id, a.name, COALESCE(ap.max_guests, 4) as max_guests
     FROM apartments a
     LEFT JOIN apartment_pricing ap ON a.id = ap.apartment_id
     WHERE a.slug = $1 AND a.rental_enabled = true`,
    [slug]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    maxGuests: result.rows[0].max_guests,
  };
}
