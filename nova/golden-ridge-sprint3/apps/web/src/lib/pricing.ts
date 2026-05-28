/**
 * Pricing Service
 * Handles price calculation for apartment bookings
 * 
 * Sprint 3: Added mock data fallback for development
 */

import { db } from './db';
import { getMockApartmentById } from './mock-data';
import { 
  calculateNights, 
  getDatesInRange, 
  formatDateISO, 
  validateDateRange 
} from './availability';
import type {
  PriceCalculationRequest,
  PriceCalculationResponse,
  PriceBreakdown,
  PricingRule,
  PricingAdjustmentType,
} from '@/types/booking';

// Default values
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_GUEST_COUNT = 2;

// Mock mode detection
const USE_MOCK = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

interface PricingRuleRow {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  adjustment_type: string;
  adjustment_value: number;
  priority: number;
}

interface ApartmentPricingRow {
  base_price_per_night: number;
  currency: string;
  min_nights: number;
  max_guests: number;
}

/**
 * Get base pricing for an apartment
 */
export async function getApartmentPricing(
  apartmentId: string
): Promise<ApartmentPricingRow | null> {
  // Mock mode
  if (USE_MOCK) {
    const apt = getMockApartmentById(apartmentId);
    if (!apt) return null;
    return {
      base_price_per_night: apt.basePriceEur,
      currency: 'EUR',
      min_nights: 2,
      max_guests: apt.capacity,
    };
  }
  
  const result = await db.query<ApartmentPricingRow>(
    `SELECT base_price_per_night, currency, min_nights, max_guests
     FROM apartment_pricing
     WHERE apartment_id = $1`,
    [apartmentId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get applicable pricing rules for a date range
 */
export async function getApplicablePricingRules(
  apartmentId: string,
  checkIn: Date,
  checkOut: Date
): Promise<PricingRuleRow[]> {
  // Mock mode: no special pricing rules
  if (USE_MOCK) {
    return [];
  }
  
  const result = await db.query<PricingRuleRow>(
    `SELECT id, name, start_date, end_date, adjustment_type, adjustment_value, priority
     FROM pricing_rules
     WHERE apartment_id = $1
       AND is_enabled = true
       AND start_date <= $3
       AND end_date >= $2
     ORDER BY priority ASC, created_at ASC`,
    [apartmentId, formatDateISO(checkIn), formatDateISO(checkOut)]
  );
  
  return result.rows;
}

/**
 * Check if a date falls within a rule's date range
 */
function isDateInRuleRange(date: Date, rule: PricingRuleRow): boolean {
  const dateStr = formatDateISO(date);
  const startStr = formatDateISO(rule.start_date);
  const endStr = formatDateISO(rule.end_date);
  
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Apply pricing adjustment to base price
 */
function applyAdjustment(
  basePrice: number,
  adjustmentType: string,
  adjustmentValue: number
): number {
  if (adjustmentType === 'PERCENTAGE') {
    // adjustmentValue is percentage (e.g., 20 for +20%, -10 for -10%)
    return basePrice * (1 + adjustmentValue / 100);
  } else if (adjustmentType === 'ABSOLUTE') {
    // adjustmentValue is absolute amount in currency
    return basePrice + adjustmentValue;
  }
  
  return basePrice;
}

/**
 * Calculate price for a single night
 */
function calculateNightPrice(
  date: Date,
  basePrice: number,
  rules: PricingRuleRow[]
): { price: number; appliedRules: string[] } {
  let price = basePrice;
  const appliedRules: string[] = [];
  
  // Apply rules in priority order
  for (const rule of rules) {
    if (isDateInRuleRange(date, rule)) {
      price = applyAdjustment(price, rule.adjustment_type, rule.adjustment_value);
      appliedRules.push(rule.name);
    }
  }
  
  // Ensure price is not negative
  return {
    price: Math.max(0, Math.round(price * 100) / 100),
    appliedRules,
  };
}

/**
 * Calculate full price for a booking
 */
export async function calculatePrice(
  apartmentId: string,
  request: PriceCalculationRequest
): Promise<PriceCalculationResponse> {
  const { checkIn, checkOut, guestCount = DEFAULT_GUEST_COUNT } = request;
  
  // Validate dates
  const validation = validateDateRange(checkIn, checkOut);
  if (!validation.isValid) {
    return {
      apartmentId,
      checkIn,
      checkOut,
      nightsCount: 0,
      guestCount,
      basePricePerNight: 0,
      breakdown: [],
      subtotal: 0,
      totalPrice: 0,
      currency: DEFAULT_CURRENCY,
      isValid: false,
      validationErrors: validation.errors,
    };
  }
  
  // Get apartment pricing
  const pricing = await getApartmentPricing(apartmentId);
  if (!pricing) {
    return {
      apartmentId,
      checkIn,
      checkOut,
      nightsCount: 0,
      guestCount,
      basePricePerNight: 0,
      breakdown: [],
      subtotal: 0,
      totalPrice: 0,
      currency: DEFAULT_CURRENCY,
      isValid: false,
      validationErrors: ['Apartment pricing not configured'],
    };
  }
  
  // Validate guest count
  if (guestCount > pricing.max_guests) {
    return {
      apartmentId,
      checkIn,
      checkOut,
      nightsCount: 0,
      guestCount,
      basePricePerNight: pricing.base_price_per_night,
      breakdown: [],
      subtotal: 0,
      totalPrice: 0,
      currency: pricing.currency,
      isValid: false,
      validationErrors: [`Maximum ${pricing.max_guests} guests allowed`],
    };
  }
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nightsCount = calculateNights(checkInDate, checkOutDate);
  
  // Validate minimum nights
  if (nightsCount < pricing.min_nights) {
    return {
      apartmentId,
      checkIn,
      checkOut,
      nightsCount,
      guestCount,
      basePricePerNight: pricing.base_price_per_night,
      breakdown: [],
      subtotal: 0,
      totalPrice: 0,
      currency: pricing.currency,
      isValid: false,
      validationErrors: [`Minimum stay is ${pricing.min_nights} nights`],
    };
  }
  
  // Get applicable pricing rules
  const rules = await getApplicablePricingRules(
    apartmentId,
    checkInDate,
    checkOutDate
  );
  
  // Calculate price for each night
  const dates = getDatesInRange(checkInDate, checkOutDate);
  const breakdown: PriceBreakdown[] = [];
  let subtotal = 0;
  
  for (const date of dates) {
    const { price, appliedRules } = calculateNightPrice(
      date,
      pricing.base_price_per_night,
      rules
    );
    
    breakdown.push({
      date: formatDateISO(date),
      basePrice: pricing.base_price_per_night,
      adjustedPrice: price,
      appliedRules,
    });
    
    subtotal += price;
  }
  
  // Round total to 2 decimal places
  const totalPrice = Math.round(subtotal * 100) / 100;
  
  return {
    apartmentId,
    checkIn,
    checkOut,
    nightsCount,
    guestCount,
    basePricePerNight: pricing.base_price_per_night,
    breakdown,
    subtotal: totalPrice,
    totalPrice,
    currency: pricing.currency,
    isValid: true,
  };
}

/**
 * Get price summary (simplified for display)
 */
export async function getPriceSummary(
  apartmentId: string,
  checkIn: string,
  checkOut: string,
  guestCount: number = DEFAULT_GUEST_COUNT
): Promise<{
  valid: boolean;
  nightsCount: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  hasSeasonalPricing: boolean;
  error?: string;
}> {
  const result = await calculatePrice(apartmentId, { checkIn, checkOut, guestCount });
  
  if (!result.isValid) {
    return {
      valid: false,
      nightsCount: 0,
      pricePerNight: 0,
      totalPrice: 0,
      currency: DEFAULT_CURRENCY,
      hasSeasonalPricing: false,
      error: result.validationErrors?.join('; '),
    };
  }
  
  // Check if any seasonal pricing was applied
  const hasSeasonalPricing = result.breakdown.some(
    day => day.appliedRules.length > 0
  );
  
  // Calculate average price per night
  const avgPricePerNight = result.totalPrice / result.nightsCount;
  
  return {
    valid: true,
    nightsCount: result.nightsCount,
    pricePerNight: Math.round(avgPricePerNight * 100) / 100,
    totalPrice: result.totalPrice,
    currency: result.currency,
    hasSeasonalPricing,
  };
}
