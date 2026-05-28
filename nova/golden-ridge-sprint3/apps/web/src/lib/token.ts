/**
 * Token Service
 * Handles guest token generation and validation
 */

import crypto from 'crypto';
import { db } from './db';
import type { PoolClient } from 'pg';
import type {
  TokenPageResponse,
  ReservationStatus,
} from '@/types/booking';

// Token configuration
const TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters
const TOKEN_EXPIRY_DAYS_AFTER_CHECKOUT = 7;
const CHECKIN_INFO_WINDOW_DAYS = 3; // Show check-in info 3 days before arrival

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate token expiration date
 */
export function calculateTokenExpiry(checkOutDate: Date): Date {
  const expiry = new Date(checkOutDate);
  expiry.setDate(expiry.getDate() + TOKEN_EXPIRY_DAYS_AFTER_CHECKOUT);
  return expiry;
}

/**
 * Create a guest token for a reservation
 */
export async function createGuestToken(
  client: PoolClient,
  reservationId: string,
  token: string
): Promise<void> {
  // Get checkout date for expiry calculation
  const reservationResult = await client.query<{ check_out_date: Date }>(
    `SELECT check_out_date FROM reservations WHERE id = $1`,
    [reservationId]
  );
  
  if (reservationResult.rows.length === 0) {
    throw new Error('Reservation not found');
  }
  
  const checkOutDate = reservationResult.rows[0].check_out_date;
  const expiresAt = calculateTokenExpiry(checkOutDate);
  const tokenHash = hashToken(token);
  
  await client.query(
    `INSERT INTO guest_tokens (reservation_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [reservationId, tokenHash, expiresAt]
  );
}

/**
 * Validate a token and get reservation data
 */
export async function validateToken(
  token: string
): Promise<TokenPageResponse> {
  const tokenHash = hashToken(token);
  
  // Find token and related reservation
  const result = await db.query<{
    token_id: string;
    expires_at: Date;
    reservation_id: string;
    reference_number: string;
    status: string;
    apartment_id: string;
    apartment_name: string;
    apartment_slug: string;
    check_in_date: Date;
    check_out_date: Date;
    nights_count: number;
    guest_first_name: string;
    guest_last_name: string;
    guest_count: number;
    total_price: number;
    currency: string;
    language: string;
  }>(
    `SELECT 
      gt.id as token_id,
      gt.expires_at,
      r.id as reservation_id,
      r.reference_number,
      r.status,
      r.apartment_id,
      a.name as apartment_name,
      a.slug as apartment_slug,
      r.check_in_date,
      r.check_out_date,
      r.nights_count,
      r.guest_first_name,
      r.guest_last_name,
      r.guest_count,
      r.total_price,
      r.currency,
      r.language
     FROM guest_tokens gt
     JOIN reservations r ON gt.reservation_id = r.id
     JOIN apartments a ON r.apartment_id = a.id
     WHERE gt.token_hash = $1`,
    [tokenHash]
  );
  
  if (result.rows.length === 0) {
    return { valid: false };
  }
  
  const row = result.rows[0];
  
  // Check if token is expired
  const now = new Date();
  if (new Date(row.expires_at) < now) {
    return { valid: false, expired: true };
  }
  
  // Build reservation response
  const response: TokenPageResponse = {
    valid: true,
    reservation: {
      referenceNumber: row.reference_number,
      status: row.status as ReservationStatus,
      apartmentName: row.apartment_name,
      apartmentSlug: row.apartment_slug,
      checkInDate: formatDate(row.check_in_date),
      checkOutDate: formatDate(row.check_out_date),
      nightsCount: row.nights_count,
      guestFirstName: row.guest_first_name,
      guestLastName: row.guest_last_name,
      guestCount: row.guest_count,
      totalPrice: parseFloat(row.total_price.toString()),
      currency: row.currency,
      language: row.language as 'cs' | 'en',
    },
  };
  
  // Check if we should show check-in information
  const checkInDate = new Date(row.check_in_date);
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Show check-in info if within window or already checked in
  if (daysUntilCheckIn <= CHECKIN_INFO_WINDOW_DAYS || 
      ['CONFIRMED', 'CHECKED_IN'].includes(row.status)) {
    const checkInInfo = await getCheckInInfo(row.apartment_id);
    if (checkInInfo) {
      response.checkInInfo = checkInInfo;
    }
  }
  
  // Get house rules and apartment info
  const content = await getApartmentContent(
    row.apartment_id, 
    row.language as 'cs' | 'en'
  );
  
  if (content) {
    response.houseRules = content.houseRules;
    response.apartmentInfo = content.apartmentInfo;
  }
  
  return response;
}

/**
 * Get check-in information for an apartment
 */
async function getCheckInInfo(apartmentId: string): Promise<{
  address: string;
  accessCode: string;
  parkingInfo: string;
  wifiName: string;
  wifiPassword: string;
  emergencyContact: string;
  checkInTime: string;
  checkOutTime: string;
} | null> {
  const result = await db.query<{
    address: string;
    access_code: string;
    parking_info: string;
    wifi_name: string;
    wifi_password: string;
    emergency_contact: string;
    check_in_time: string;
    check_out_time: string;
  }>(
    `SELECT 
      address,
      access_code,
      parking_info,
      wifi_name,
      wifi_password,
      emergency_contact,
      check_in_time,
      check_out_time
     FROM apartment_checkin_info
     WHERE apartment_id = $1`,
    [apartmentId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    address: row.address,
    accessCode: row.access_code || '',
    parkingInfo: row.parking_info || '',
    wifiName: row.wifi_name || '',
    wifiPassword: row.wifi_password || '',
    emergencyContact: row.emergency_contact || '',
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
  };
}

/**
 * Get apartment content (house rules, info)
 */
async function getApartmentContent(
  apartmentId: string,
  language: 'cs' | 'en'
): Promise<{ houseRules: string; apartmentInfo: string } | null> {
  const houseRulesCol = language === 'cs' ? 'house_rules_cs' : 'house_rules_en';
  const apartmentInfoCol = language === 'cs' ? 'apartment_info_cs' : 'apartment_info_en';
  
  const result = await db.query<{
    house_rules: string;
    apartment_info: string;
  }>(
    `SELECT 
      ${houseRulesCol} as house_rules,
      ${apartmentInfoCol} as apartment_info
     FROM apartment_checkin_info
     WHERE apartment_id = $1`,
    [apartmentId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    houseRules: result.rows[0].house_rules || '',
    apartmentInfo: result.rows[0].apartment_info || '',
  };
}

/**
 * Request a new token (for expired tokens)
 */
export async function requestNewToken(
  email: string,
  referenceNumber: string
): Promise<{ success: boolean; message: string; newToken?: string }> {
  // Find reservation by email and reference
  const result = await db.query<{
    id: string;
    check_out_date: Date;
    status: string;
    guest_email: string;
  }>(
    `SELECT id, check_out_date, status, guest_email
     FROM reservations
     WHERE reference_number = $1 
     AND LOWER(guest_email) = LOWER($2)`,
    [referenceNumber, email]
  );
  
  if (result.rows.length === 0) {
    return {
      success: false,
      message: 'No reservation found with the provided details',
    };
  }
  
  const reservation = result.rows[0];
  
  // Check if reservation is cancelled
  if (reservation.status === 'CANCELLED') {
    return {
      success: false,
      message: 'This reservation has been cancelled',
    };
  }
  
  // Check if checkout was too long ago (30 days limit)
  const checkOutDate = new Date(reservation.check_out_date);
  const maxRequestDate = new Date(checkOutDate);
  maxRequestDate.setDate(maxRequestDate.getDate() + 30);
  
  if (new Date() > maxRequestDate) {
    return {
      success: false,
      message: 'Token request period has expired',
    };
  }
  
  // Generate new token
  const newToken = generateToken();
  const newExpiry = calculateTokenExpiry(checkOutDate);
  const tokenHash = hashToken(newToken);
  
  // Invalidate old tokens and create new one
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Delete old tokens for this reservation
    await client.query(
      `DELETE FROM guest_tokens WHERE reservation_id = $1`,
      [reservation.id]
    );
    
    // Create new token
    await client.query(
      `INSERT INTO guest_tokens (reservation_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [reservation.id, tokenHash, newExpiry]
    );
    
    await client.query('COMMIT');
    
    // TODO: Send email with new token URL
    // await sendNewTokenEmail(reservation.guest_email, newToken, referenceNumber);
    
    return {
      success: true,
      message: 'A new access link has been sent to your email',
      newToken, // In production, don't return this - send via email only
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating new token:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  } finally {
    client.release();
  }
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
