/**
 * Email Service
 * Handles transactional emails for bookings
 * 
 * Note: Email provider to be selected during implementation (per D-006)
 * This module provides the interface and templates; actual sending is abstracted
 * 
 * Sprint 3: Added mock mode support and Resend integration
 */

import { db } from './db';
import { getMockReservation } from './booking';
import type { EmailType, EmailStatus } from '@/types/booking';

// Mock mode detection
const USE_MOCK = !process.env.DATABASE_URL || process.env.USE_MOCK_DATA === 'true';

// Email configuration (to be set via environment variables)
const FROM_EMAIL = process.env.EMAIL_FROM || 'rezervace@goldenridge.cz';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Golden Ridge Apartments';
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager@goldenridge.cz';

// Bank transfer details (placeholder - to be provided by client)
const BANK_ACCOUNT = {
  iban: 'CZ00 0000 0000 0000 0000 0000',
  bic: 'XXXXCZPP',
  bankName: 'Example Bank',
  accountHolder: 'Golden Ridge s.r.o.',
};

interface EmailRecipient {
  email: string;
  name: string;
}

interface ReservationEmailData {
  reservationId: string;
  referenceNumber: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  apartmentName: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  totalPrice: number;
  currency: string;
  tokenUrl: string;
  language: 'cs' | 'en';
}

interface CheckInEmailData extends ReservationEmailData {
  address: string;
  accessCode: string;
  checkInTime: string;
  checkOutTime: string;
  emergencyContact: string;
}

/**
 * Log email to database
 */
async function logEmail(
  reservationId: string,
  emailType: EmailType,
  recipientEmail: string,
  status: EmailStatus,
  errorMessage?: string
): Promise<void> {
  await db.query(
    `INSERT INTO email_log (reservation_id, email_type, recipient_email, status, sent_at, error_message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      reservationId,
      emailType,
      recipientEmail,
      status,
      status === 'SENT' ? new Date() : null,
      errorMessage || null,
    ]
  );
}

/**
 * Queue confirmation email for sending
 */
export async function queueConfirmationEmail(
  reservationId: string,
  token: string
): Promise<void> {
  // Get reservation data
  const result = await db.query<{
    reference_number: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_email: string;
    apartment_name: string;
    check_in_date: Date;
    check_out_date: Date;
    nights_count: number;
    total_price: number;
    currency: string;
    language: string;
  }>(
    `SELECT 
      r.reference_number,
      r.guest_first_name,
      r.guest_last_name,
      r.guest_email,
      a.name as apartment_name,
      r.check_in_date,
      r.check_out_date,
      r.nights_count,
      r.total_price,
      r.currency,
      r.language
     FROM reservations r
     JOIN apartments a ON r.apartment_id = a.id
     WHERE r.id = $1`,
    [reservationId]
  );
  
  if (result.rows.length === 0) {
    console.error(`Reservation not found for email: ${reservationId}`);
    return;
  }
  
  const row = result.rows[0];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://goldenridge.cz';
  
  const emailData: ReservationEmailData = {
    reservationId,
    referenceNumber: row.reference_number,
    guestFirstName: row.guest_first_name,
    guestLastName: row.guest_last_name,
    guestEmail: row.guest_email,
    apartmentName: row.apartment_name,
    checkInDate: formatDateLocalized(row.check_in_date, row.language as 'cs' | 'en'),
    checkOutDate: formatDateLocalized(row.check_out_date, row.language as 'cs' | 'en'),
    nightsCount: row.nights_count,
    totalPrice: parseFloat(row.total_price.toString()),
    currency: row.currency,
    tokenUrl: `${baseUrl}/rezervace/${token}`,
    language: row.language as 'cs' | 'en',
  };
  
  try {
    await sendConfirmationEmail(emailData);
    await logEmail(reservationId, 'BOOKING_CONFIRMATION', row.guest_email, 'SENT');
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    await logEmail(
      reservationId, 
      'BOOKING_CONFIRMATION', 
      row.guest_email, 
      'FAILED',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Send booking confirmation email
 */
async function sendConfirmationEmail(data: ReservationEmailData): Promise<void> {
  const subject = data.language === 'cs'
    ? `Potvrzení rezervace ${data.referenceNumber} - Golden Ridge Apartments`
    : `Booking Confirmation ${data.referenceNumber} - Golden Ridge Apartments`;
  
  const html = generateConfirmationEmailHtml(data);
  const text = generateConfirmationEmailText(data);
  
  await sendEmail({
    to: { email: data.guestEmail, name: `${data.guestFirstName} ${data.guestLastName}` },
    subject,
    html,
    text,
  });
}

/**
 * Generate confirmation email HTML
 */
function generateConfirmationEmailHtml(data: ReservationEmailData): string {
  const isCs = data.language === 'cs';
  
  return `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isCs ? 'Potvrzení rezervace' : 'Booking Confirmation'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .bank-info { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Golden Ridge Apartments</h1>
      <p>${isCs ? 'Potvrzení rezervace' : 'Booking Confirmation'}</p>
    </div>
    
    <div class="content">
      <p>${isCs ? 'Vážený/á' : 'Dear'} ${data.guestFirstName},</p>
      
      <p>${isCs 
        ? 'Děkujeme za Vaši rezervaci. Níže naleznete shrnutí Vašeho pobytu.'
        : 'Thank you for your booking. Below you will find a summary of your stay.'
      }</p>
      
      <div class="details">
        <h3>${isCs ? 'Detail rezervace' : 'Reservation Details'}</h3>
        <table>
          <tr>
            <td>${isCs ? 'Číslo rezervace' : 'Reference Number'}</td>
            <td><strong>${data.referenceNumber}</strong></td>
          </tr>
          <tr>
            <td>${isCs ? 'Apartmán' : 'Apartment'}</td>
            <td>${data.apartmentName}</td>
          </tr>
          <tr>
            <td>${isCs ? 'Check-in' : 'Check-in'}</td>
            <td>${data.checkInDate}</td>
          </tr>
          <tr>
            <td>${isCs ? 'Check-out' : 'Check-out'}</td>
            <td>${data.checkOutDate}</td>
          </tr>
          <tr>
            <td>${isCs ? 'Počet nocí' : 'Number of Nights'}</td>
            <td>${data.nightsCount}</td>
          </tr>
          <tr>
            <td>${isCs ? 'Celková cena' : 'Total Price'}</td>
            <td><strong>${data.totalPrice} ${data.currency}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="bank-info">
        <h3>${isCs ? 'Platební údaje' : 'Payment Information'}</h3>
        <p>${isCs 
          ? 'Prosím uhraďte rezervaci bankovním převodem na následující účet:'
          : 'Please complete your payment via bank transfer to the following account:'
        }</p>
        <table>
          <tr>
            <td>IBAN:</td>
            <td><strong>${BANK_ACCOUNT.iban}</strong></td>
          </tr>
          <tr>
            <td>BIC/SWIFT:</td>
            <td>${BANK_ACCOUNT.bic}</td>
          </tr>
          <tr>
            <td>${isCs ? 'Částka' : 'Amount'}:</td>
            <td><strong>${data.totalPrice} ${data.currency}</strong></td>
          </tr>
          <tr>
            <td>${isCs ? 'Variabilní symbol' : 'Reference'}:</td>
            <td><strong>${data.referenceNumber}</strong></td>
          </tr>
        </table>
      </div>
      
      <p>${isCs
        ? 'Pro zobrazení detailů Vaší rezervace a informací o check-inu použijte následující odkaz:'
        : 'To view your reservation details and check-in information, use the following link:'
      }</p>
      
      <center>
        <a href="${data.tokenUrl}" class="button">
          ${isCs ? 'Zobrazit moji rezervaci' : 'View My Reservation'}
        </a>
      </center>
      
      <p>${isCs
        ? 'Pokud máte jakékoliv dotazy, neváhejte nás kontaktovat.'
        : 'If you have any questions, please do not hesitate to contact us.'
      }</p>
      
      <p>${isCs ? 'S pozdravem' : 'Best regards'},<br>
      Golden Ridge Apartments</p>
    </div>
    
    <div class="footer">
      <p>Golden Ridge Apartments<br>
      Špindlerův Mlýn, Czech Republic<br>
      ${MANAGER_EMAIL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate confirmation email plain text
 */
function generateConfirmationEmailText(data: ReservationEmailData): string {
  const isCs = data.language === 'cs';
  
  return `
${isCs ? 'GOLDEN RIDGE APARTMENTS - POTVRZENÍ REZERVACE' : 'GOLDEN RIDGE APARTMENTS - BOOKING CONFIRMATION'}

${isCs ? 'Vážený/á' : 'Dear'} ${data.guestFirstName},

${isCs 
  ? 'Děkujeme za Vaši rezervaci. Níže naleznete shrnutí Vašeho pobytu.'
  : 'Thank you for your booking. Below you will find a summary of your stay.'
}

${isCs ? 'DETAIL REZERVACE' : 'RESERVATION DETAILS'}
${isCs ? 'Číslo rezervace' : 'Reference Number'}: ${data.referenceNumber}
${isCs ? 'Apartmán' : 'Apartment'}: ${data.apartmentName}
Check-in: ${data.checkInDate}
Check-out: ${data.checkOutDate}
${isCs ? 'Počet nocí' : 'Number of Nights'}: ${data.nightsCount}
${isCs ? 'Celková cena' : 'Total Price'}: ${data.totalPrice} ${data.currency}

${isCs ? 'PLATEBNÍ ÚDAJE' : 'PAYMENT INFORMATION'}
IBAN: ${BANK_ACCOUNT.iban}
BIC/SWIFT: ${BANK_ACCOUNT.bic}
${isCs ? 'Částka' : 'Amount'}: ${data.totalPrice} ${data.currency}
${isCs ? 'Variabilní symbol' : 'Reference'}: ${data.referenceNumber}

${isCs
  ? 'Pro zobrazení detailů Vaší rezervace navštivte:'
  : 'To view your reservation details, visit:'
}
${data.tokenUrl}

${isCs ? 'S pozdravem' : 'Best regards'},
Golden Ridge Apartments
Špindlerův Mlýn, Czech Republic
${MANAGER_EMAIL}
  `.trim();
}

/**
 * Queue check-in instructions email (T-1)
 */
export async function queueCheckInEmail(reservationId: string): Promise<void> {
  // Get reservation and check-in data
  const result = await db.query<{
    reference_number: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_email: string;
    apartment_name: string;
    apartment_id: string;
    check_in_date: Date;
    check_out_date: Date;
    nights_count: number;
    total_price: number;
    currency: string;
    language: string;
  }>(
    `SELECT 
      r.reference_number,
      r.guest_first_name,
      r.guest_last_name,
      r.guest_email,
      a.name as apartment_name,
      r.apartment_id,
      r.check_in_date,
      r.check_out_date,
      r.nights_count,
      r.total_price,
      r.currency,
      r.language
     FROM reservations r
     JOIN apartments a ON r.apartment_id = a.id
     WHERE r.id = $1 AND r.status NOT IN ('CANCELLED', 'COMPLETED')`,
    [reservationId]
  );
  
  if (result.rows.length === 0) {
    return;
  }
  
  const row = result.rows[0];
  
  // Get check-in info
  const checkInResult = await db.query<{
    address: string;
    access_code: string;
    check_in_time: string;
    check_out_time: string;
    emergency_contact: string;
  }>(
    `SELECT address, access_code, check_in_time, check_out_time, emergency_contact
     FROM apartment_checkin_info
     WHERE apartment_id = $1`,
    [row.apartment_id]
  );
  
  if (checkInResult.rows.length === 0) {
    console.error(`No check-in info found for apartment: ${row.apartment_id}`);
    return;
  }
  
  const checkIn = checkInResult.rows[0];
  
  // Get active token for this reservation
  const tokenResult = await db.query<{ token_hash: string }>(
    `SELECT token_hash FROM guest_tokens 
     WHERE reservation_id = $1 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [reservationId]
  );
  
  // Note: We can't reconstruct the token from hash, so token URL may need 
  // to be stored or handled differently in production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://goldenridge.cz';
  
  const emailData: CheckInEmailData = {
    reservationId,
    referenceNumber: row.reference_number,
    guestFirstName: row.guest_first_name,
    guestLastName: row.guest_last_name,
    guestEmail: row.guest_email,
    apartmentName: row.apartment_name,
    checkInDate: formatDateLocalized(row.check_in_date, row.language as 'cs' | 'en'),
    checkOutDate: formatDateLocalized(row.check_out_date, row.language as 'cs' | 'en'),
    nightsCount: row.nights_count,
    totalPrice: parseFloat(row.total_price.toString()),
    currency: row.currency,
    tokenUrl: `${baseUrl}/rezervace/pozadovat-pristup`, // Fallback if no token
    language: row.language as 'cs' | 'en',
    address: checkIn.address,
    accessCode: checkIn.access_code || '',
    checkInTime: checkIn.check_in_time,
    checkOutTime: checkIn.check_out_time,
    emergencyContact: checkIn.emergency_contact || '',
  };
  
  try {
    await sendCheckInEmail(emailData);
    await logEmail(reservationId, 'CHECKIN_INSTRUCTIONS', row.guest_email, 'SENT');
  } catch (error) {
    console.error('Failed to send check-in email:', error);
    await logEmail(
      reservationId,
      'CHECKIN_INSTRUCTIONS',
      row.guest_email,
      'FAILED',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Send check-in instructions email
 */
async function sendCheckInEmail(data: CheckInEmailData): Promise<void> {
  const isCs = data.language === 'cs';
  const subject = isCs
    ? `Pokyny k check-inu - ${data.apartmentName} - Zítra!`
    : `Check-in Instructions - ${data.apartmentName} - Tomorrow!`;
  
  const html = generateCheckInEmailHtml(data);
  const text = generateCheckInEmailText(data);
  
  await sendEmail({
    to: { email: data.guestEmail, name: `${data.guestFirstName} ${data.guestLastName}` },
    subject,
    html,
    text,
  });
}

/**
 * Generate check-in email HTML
 */
function generateCheckInEmailHtml(data: CheckInEmailData): string {
  const isCs = data.language === 'cs';
  
  return `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isCs ? 'Pokyny k check-inu' : 'Check-in Instructions'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .highlight { background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .access-code { font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Golden Ridge Apartments</h1>
      <p>${isCs ? 'Pokyny k check-inu' : 'Check-in Instructions'}</p>
    </div>
    
    <div class="content">
      <p>${isCs ? 'Vážený/á' : 'Dear'} ${data.guestFirstName},</p>
      
      <p>${isCs 
        ? 'Váš pobyt začíná zítra! Zde jsou důležité informace pro Váš příjezd.'
        : 'Your stay begins tomorrow! Here is important information for your arrival.'
      }</p>
      
      <div class="highlight">
        <h3>${isCs ? 'Adresa' : 'Address'}</h3>
        <p><strong>${data.address}</strong></p>
        
        ${data.accessCode ? `
        <h3>${isCs ? 'Přístupový kód' : 'Access Code'}</h3>
        <p class="access-code">${data.accessCode}</p>
        ` : ''}
      </div>
      
      <div class="details">
        <h3>${isCs ? 'Časy check-in / check-out' : 'Check-in / Check-out Times'}</h3>
        <table>
          <tr>
            <td>Check-in</td>
            <td>${isCs ? 'od' : 'from'} <strong>${data.checkInTime}</strong></td>
          </tr>
          <tr>
            <td>Check-out</td>
            <td>${isCs ? 'do' : 'by'} <strong>${data.checkOutTime}</strong></td>
          </tr>
        </table>
      </div>
      
      ${data.emergencyContact ? `
      <div class="details">
        <h3>${isCs ? 'Nouzový kontakt' : 'Emergency Contact'}</h3>
        <p>${data.emergencyContact}</p>
      </div>
      ` : ''}
      
      <p>${isCs
        ? 'Přejeme Vám příjemný pobyt!'
        : 'We wish you a pleasant stay!'
      }</p>
      
      <p>${isCs ? 'S pozdravem' : 'Best regards'},<br>
      Golden Ridge Apartments</p>
    </div>
    
    <div class="footer">
      <p>Golden Ridge Apartments<br>
      Špindlerův Mlýn, Czech Republic<br>
      ${MANAGER_EMAIL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate check-in email plain text
 */
function generateCheckInEmailText(data: CheckInEmailData): string {
  const isCs = data.language === 'cs';
  
  return `
${isCs ? 'GOLDEN RIDGE APARTMENTS - POKYNY K CHECK-INU' : 'GOLDEN RIDGE APARTMENTS - CHECK-IN INSTRUCTIONS'}

${isCs ? 'Vážený/á' : 'Dear'} ${data.guestFirstName},

${isCs 
  ? 'Váš pobyt začíná zítra! Zde jsou důležité informace pro Váš příjezd.'
  : 'Your stay begins tomorrow! Here is important information for your arrival.'
}

${isCs ? 'ADRESA' : 'ADDRESS'}
${data.address}

${data.accessCode ? `${isCs ? 'PŘÍSTUPOVÝ KÓD' : 'ACCESS CODE'}: ${data.accessCode}` : ''}

${isCs ? 'ČASY' : 'TIMES'}
Check-in: ${isCs ? 'od' : 'from'} ${data.checkInTime}
Check-out: ${isCs ? 'do' : 'by'} ${data.checkOutTime}

${data.emergencyContact ? `${isCs ? 'NOUZOVÝ KONTAKT' : 'EMERGENCY CONTACT'}: ${data.emergencyContact}` : ''}

${isCs ? 'Přejeme Vám příjemný pobyt!' : 'We wish you a pleasant stay!'}

${isCs ? 'S pozdravem' : 'Best regards'},
Golden Ridge Apartments
  `.trim();
}

/**
 * Format date in localized format
 */
function formatDateLocalized(date: Date, language: 'cs' | 'en'): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  const locale = language === 'cs' ? 'cs-CZ' : 'en-GB';
  return date.toLocaleDateString(locale, options);
}

/**
 * Send email via Resend
 * Sprint 3: Transactional Email Integration
 */
async function sendEmail(params: {
  to: EmailRecipient;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  // Development mode: log emails without sending
  if (!resendApiKey || process.env.NODE_ENV === 'development') {
    console.log('=== EMAIL ===');
    console.log('To:', params.to.email);
    console.log('Subject:', params.subject);
    console.log('Text preview:', params.text.substring(0, 300) + '...');
    console.log('=============');
    
    // In development without API key, just log
    if (!resendApiKey) {
      console.log('(Resend API key not configured - email logged only)');
      return;
    }
  }
  
  // Send via Resend
  const { Resend } = await import('resend');
  const resend = new Resend(resendApiKey);
  
  const { error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: params.to.email,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
  
  if (error) {
    console.error('Resend error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send message from guest to manager
 */
export async function sendGuestMessage(
  reservationId: string,
  message: string,
  guestEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get reservation details
    const result = await db.query<{
      reference_number: string;
      guest_first_name: string;
      guest_last_name: string;
      apartment_name: string;
    }>(
      `SELECT r.reference_number, r.guest_first_name, r.guest_last_name, a.name as apartment_name
       FROM reservations r
       JOIN apartments a ON r.apartment_id = a.id
       WHERE r.id = $1`,
      [reservationId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Reservation not found' };
    }
    
    const row = result.rows[0];
    
    // Send email to manager
    await sendEmail({
      to: { email: MANAGER_EMAIL, name: 'Manager' },
      subject: `Guest Message - ${row.reference_number} - ${row.apartment_name}`,
      html: `
        <h2>Message from Guest</h2>
        <p><strong>Reservation:</strong> ${row.reference_number}</p>
        <p><strong>Guest:</strong> ${row.guest_first_name} ${row.guest_last_name}</p>
        <p><strong>Email:</strong> ${guestEmail}</p>
        <p><strong>Apartment:</strong> ${row.apartment_name}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `
Message from Guest
Reservation: ${row.reference_number}
Guest: ${row.guest_first_name} ${row.guest_last_name}
Email: ${guestEmail}
Apartment: ${row.apartment_name}

Message:
${message}
      `,
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to send guest message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    };
  }
}

/**
 * Send payment confirmation email after successful Stripe payment
 * Sprint 3: Transactional Email
 */
export async function sendPaymentConfirmationEmail(
  reservationId: string
): Promise<void> {
  let row: {
    reference_number: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_email: string;
    apartment_name: string;
    check_in_date: Date;
    check_out_date: Date;
    nights_count: number;
    total_price: number;
    currency: string;
    language: string;
    token: string;
  };
  
  // MOCK MODE: Get reservation from mock store
  if (USE_MOCK) {
    const mockRes = getMockReservation(reservationId);
    if (!mockRes) {
      console.log(`[MOCK] Reservation not found for email: ${reservationId}`);
      console.log(`[MOCK] Would send payment confirmation email`);
      return;
    }
    row = {
      reference_number: mockRes.referenceNumber,
      guest_first_name: mockRes.guestFirstName,
      guest_last_name: mockRes.guestLastName,
      guest_email: mockRes.guestEmail,
      apartment_name: mockRes.apartmentName,
      check_in_date: new Date(mockRes.checkIn),
      check_out_date: new Date(mockRes.checkOut),
      nights_count: mockRes.nightsCount,
      total_price: mockRes.totalPrice,
      currency: mockRes.currency || 'EUR',
      language: mockRes.language || 'cs',
      token: mockRes.token,
    };
    console.log(`[MOCK] Sending payment confirmation to: ${row.guest_email}`);
  } else {
    // Get reservation data with guest token from database
    const result = await db.query<{
      reference_number: string;
      guest_first_name: string;
      guest_last_name: string;
      guest_email: string;
      apartment_name: string;
      check_in_date: Date;
      check_out_date: Date;
      nights_count: number;
      total_price: number;
      currency: string;
      language: string;
      token: string;
    }>(
      `SELECT 
        r.reference_number,
        r.guest_first_name,
        r.guest_last_name,
        r.guest_email,
        a.name as apartment_name,
        r.check_in_date,
        r.check_out_date,
        r.nights_count,
        r.total_price,
        r.currency,
        r.language,
        gt.token
       FROM reservations r
       JOIN apartments a ON r.apartment_id = a.id
       LEFT JOIN guest_tokens gt ON r.id = gt.reservation_id AND gt.expires_at > NOW()
       WHERE r.id = $1
       ORDER BY gt.created_at DESC
       LIMIT 1`,
      [reservationId]
    );
    
    if (result.rows.length === 0) {
      console.error(`Reservation not found for payment email: ${reservationId}`);
      return;
    }
    
    row = result.rows[0];
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goldenridge.cz';
  const isCs = row.language === 'cs';
  
  const tokenUrl = row.token 
    ? `${baseUrl}/rezervace/${row.token}`
    : `${baseUrl}/rezervace/pozadovat-pristup`;
  
  const checkInDate = formatDateLocalized(row.check_in_date, row.language as 'cs' | 'en');
  const checkOutDate = formatDateLocalized(row.check_out_date, row.language as 'cs' | 'en');
  
  const subject = isCs
    ? `Platba přijata - ${row.reference_number} - Golden Ridge Apartments`
    : `Payment Received - ${row.reference_number} - Golden Ridge Apartments`;
  
  const html = `
<!DOCTYPE html>
<html lang="${row.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isCs ? 'Platba přijata' : 'Payment Received'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .success-badge { background-color: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Golden Ridge Apartments</h1>
      <p>${isCs ? 'Platba úspěšně přijata!' : 'Payment Successfully Received!'}</p>
    </div>
    
    <div class="content">
      <div class="success-badge">
        <p style="font-size: 24px; margin: 0;">✓</p>
        <p style="font-weight: bold; margin: 10px 0 0 0;">${isCs ? 'Vaše rezervace je potvrzena' : 'Your Reservation is Confirmed'}</p>
      </div>
      
      <p>${isCs ? 'Vážený/á' : 'Dear'} ${row.guest_first_name},</p>
      
      <p>${isCs 
        ? 'Děkujeme za Vaši platbu. Vaše rezervace je nyní potvrzena!'
        : 'Thank you for your payment. Your reservation is now confirmed!'
      }</p>
      
      <div class="details">
        <h3>${isCs ? 'Detail rezervace' : 'Reservation Details'}</h3>
        <table>
          <tr>
            <td>${isCs ? 'Číslo rezervace' : 'Reference Number'}</td>
            <td><strong>${row.reference_number}</strong></td>
          </tr>
          <tr>
            <td>${isCs ? 'Apartmán' : 'Apartment'}</td>
            <td>${row.apartment_name}</td>
          </tr>
          <tr>
            <td>Check-in</td>
            <td>${checkInDate}</td>
          </tr>
          <tr>
            <td>Check-out</td>
            <td>${checkOutDate}</td>
          </tr>
          <tr>
            <td>${isCs ? 'Počet nocí' : 'Number of Nights'}</td>
            <td>${row.nights_count}</td>
          </tr>
          <tr>
            <td>${isCs ? 'Uhrazeno' : 'Amount Paid'}</td>
            <td><strong>${row.total_price} ${row.currency}</strong></td>
          </tr>
        </table>
      </div>
      
      <p>${isCs
        ? 'Den před příjezdem Vám zašleme pokyny k check-inu včetně přístupového kódu.'
        : 'We will send you check-in instructions including the access code one day before your arrival.'
      }</p>
      
      <center>
        <a href="${tokenUrl}" class="button">
          ${isCs ? 'Zobrazit moji rezervaci' : 'View My Reservation'}
        </a>
      </center>
      
      <p>${isCs ? 'Těšíme se na Vaši návštěvu!' : 'We look forward to your visit!'}</p>
      
      <p>${isCs ? 'S pozdravem' : 'Best regards'},<br>
      Golden Ridge Apartments</p>
    </div>
    
    <div class="footer">
      <p>Golden Ridge Apartments<br>
      Špindlerův Mlýn, Czech Republic<br>
      ${MANAGER_EMAIL}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  const text = `
${isCs ? 'GOLDEN RIDGE APARTMENTS - PLATBA PŘIJATA' : 'GOLDEN RIDGE APARTMENTS - PAYMENT RECEIVED'}

${isCs ? 'Vážený/á' : 'Dear'} ${row.guest_first_name},

${isCs 
  ? 'Děkujeme za Vaši platbu. Vaše rezervace je nyní potvrzena!'
  : 'Thank you for your payment. Your reservation is now confirmed!'
}

${isCs ? 'DETAIL REZERVACE' : 'RESERVATION DETAILS'}
${isCs ? 'Číslo rezervace' : 'Reference Number'}: ${row.reference_number}
${isCs ? 'Apartmán' : 'Apartment'}: ${row.apartment_name}
Check-in: ${checkInDate}
Check-out: ${checkOutDate}
${isCs ? 'Počet nocí' : 'Number of Nights'}: ${row.nights_count}
${isCs ? 'Uhrazeno' : 'Amount Paid'}: ${row.total_price} ${row.currency}

${isCs
  ? 'Den před příjezdem Vám zašleme pokyny k check-inu včetně přístupového kódu.'
  : 'We will send you check-in instructions including the access code one day before your arrival.'
}

${isCs ? 'Zobrazit rezervaci' : 'View reservation'}: ${tokenUrl}

${isCs ? 'Těšíme se na Vaši návštěvu!' : 'We look forward to your visit!'}

${isCs ? 'S pozdravem' : 'Best regards'},
Golden Ridge Apartments
  `.trim();
  
  try {
    await sendEmail({
      to: { email: row.guest_email, name: `${row.guest_first_name} ${row.guest_last_name}` },
      subject,
      html,
      text,
    });
    
    // Log email
    await logEmail(reservationId, 'BOOKING_CONFIRMATION', row.guest_email, 'SENT');
    
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    await logEmail(
      reservationId, 
      'BOOKING_CONFIRMATION', 
      row.guest_email, 
      'FAILED',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}
