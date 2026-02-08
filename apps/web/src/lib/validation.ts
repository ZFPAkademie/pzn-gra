/**
 * Validation Utilities
 * Shared validation functions for booking system
 */

import type { ValidationResult } from '@/types/booking';

// Constants
export const MIN_NIGHTS = 2;
export const MAX_NIGHTS = 30;
export const MAX_GUESTS = 10;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_SPECIAL_REQUESTS_LENGTH = 500;

// Regex patterns
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[\d\s\-\+\(\)]{6,20}$/;
export const REFERENCE_NUMBER_REGEX = /^GR-\d{8}-[A-Z0-9]{4}$/i;
export const TOKEN_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/**
 * Validate reference number format
 */
export function isValidReferenceNumber(reference: string): boolean {
  return REFERENCE_NUMBER_REGEX.test(reference);
}

/**
 * Validate token format
 */
export function isValidToken(token: string): boolean {
  return TOKEN_REGEX.test(token);
}

/**
 * Validate ISO date string
 */
export function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Check if date is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validate date range for booking
 */
export function validateDateRange(
  checkIn: string, 
  checkOut: string
): ValidationResult {
  const errors: string[] = [];
  
  // Validate date formats
  if (!isValidDateString(checkIn)) {
    errors.push('Invalid check-in date format');
  }
  
  if (!isValidDateString(checkOut)) {
    errors.push('Invalid check-out date format');
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Check-in must be in the future
  if (!isFutureDate(checkIn)) {
    errors.push('Check-in date must be today or in the future');
  }
  
  // Check-out must be after check-in
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  if (checkOutDate <= checkInDate) {
    errors.push('Check-out date must be after check-in date');
  }
  
  // Validate number of nights
  const nights = calculateNights(checkIn, checkOut);
  
  if (nights < MIN_NIGHTS) {
    errors.push(`Minimum stay is ${MIN_NIGHTS} nights`);
  }
  
  if (nights > MAX_NIGHTS) {
    errors.push(`Maximum stay is ${MAX_NIGHTS} nights`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate guest count
 */
export function validateGuestCount(
  count: number, 
  maxCapacity: number
): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(count) || count < 1) {
    errors.push('Guest count must be at least 1');
  }
  
  if (count > maxCapacity) {
    errors.push(`Maximum ${maxCapacity} guests allowed`);
  }
  
  if (count > MAX_GUESTS) {
    errors.push(`Maximum ${MAX_GUESTS} guests allowed`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) return '';
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize email (lowercase and trim)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date in localized format
 */
export function formatDateLocalized(
  date: Date | string, 
  language: 'cs' | 'en' = 'cs'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'cs' ? 'cs-CZ' : 'en-GB';
  
  return dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format short date
 */
export function formatDateShort(
  date: Date | string, 
  language: 'cs' | 'en' = 'cs'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'cs' ? 'cs-CZ' : 'en-GB';
  
  return dateObj.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
