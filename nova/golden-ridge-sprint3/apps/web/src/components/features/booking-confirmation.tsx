'use client';

/**
 * BookingConfirmation Component
 * Displays booking confirmation after successful reservation
 * 
 * Features:
 * - Reservation reference number
 * - Booking summary
 * - Payment instructions
 * - Link to token page
 */

import { cn } from '@/lib/utils';

interface BookingConfirmationProps {
  referenceNumber: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  totalPrice: number;
  currency: string;
  guestName: string;
  guestEmail: string;
  tokenUrl: string;
  locale?: 'cs' | 'en';
  className?: string;
}

function formatPrice(amount: number, currency: string, locale: 'cs' | 'en'): string {
  return new Intl.NumberFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string, locale: 'cs' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function BookingConfirmation({
  referenceNumber,
  apartmentName,
  checkIn,
  checkOut,
  nightsCount,
  totalPrice,
  currency,
  guestName,
  guestEmail,
  tokenUrl,
  locale = 'cs',
  className,
}: BookingConfirmationProps) {
  const labels = {
    title: locale === 'cs' ? 'Rezervace potvrzena!' : 'Booking Confirmed!',
    subtitle: locale === 'cs' 
      ? 'Děkujeme za Vaši rezervaci. Na e-mail jsme Vám zaslali potvrzení.'
      : 'Thank you for your booking. We have sent a confirmation to your email.',
    referenceNumber: locale === 'cs' ? 'Číslo rezervace' : 'Reference Number',
    bookingDetails: locale === 'cs' ? 'Detail rezervace' : 'Booking Details',
    apartment: locale === 'cs' ? 'Apartmán' : 'Apartment',
    checkIn: locale === 'cs' ? 'Check-in' : 'Check-in',
    checkOut: locale === 'cs' ? 'Check-out' : 'Check-out',
    nights: locale === 'cs' ? 'Počet nocí' : 'Number of Nights',
    guest: locale === 'cs' ? 'Host' : 'Guest',
    total: locale === 'cs' ? 'Celkem k úhradě' : 'Total Amount',
    paymentTitle: locale === 'cs' ? 'Platební údaje' : 'Payment Information',
    paymentInfo: locale === 'cs'
      ? 'Prosím uhraďte rezervaci bankovním převodem. Podrobné instrukce najdete v e-mailu.'
      : 'Please complete your payment via bank transfer. Detailed instructions have been sent to your email.',
    iban: 'IBAN',
    variableSymbol: locale === 'cs' ? 'Variabilní symbol' : 'Reference',
    amount: locale === 'cs' ? 'Částka' : 'Amount',
    viewReservation: locale === 'cs' ? 'Zobrazit rezervaci' : 'View Reservation',
    emailSent: locale === 'cs' 
      ? 'Potvrzení bylo odesláno na:'
      : 'Confirmation sent to:',
    whatNext: locale === 'cs' ? 'Co bude následovat?' : 'What happens next?',
    step1: locale === 'cs' 
      ? 'Obdržíte e-mail s potvrzením a platebními údaji'
      : 'You will receive an email with confirmation and payment details',
    step2: locale === 'cs'
      ? 'Po přijetí platby Vám potvrdíme rezervaci'
      : 'Once payment is received, we will confirm your reservation',
    step3: locale === 'cs'
      ? 'Den před příjezdem obdržíte pokyny k check-inu'
      : 'One day before arrival, you will receive check-in instructions',
  };

  // Bank account info (placeholder - to be provided by client)
  const bankInfo = {
    iban: 'CZ00 0000 0000 0000 0000 0000',
  };

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.title}</h1>
        <p className="text-gray-600">{labels.subtitle}</p>
      </div>

      {/* Reference number */}
      <div className="bg-blue-50 p-4 rounded-lg text-center mb-6">
        <p className="text-sm text-blue-700 mb-1">{labels.referenceNumber}</p>
        <p className="text-2xl font-mono font-bold text-blue-900">{referenceNumber}</p>
      </div>

      {/* Booking details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">{labels.bookingDetails}</h2>
        
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-600">{labels.apartment}</dt>
            <dd className="font-medium text-gray-900">{apartmentName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">{labels.checkIn}</dt>
            <dd className="text-gray-900">{formatDate(checkIn, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">{labels.checkOut}</dt>
            <dd className="text-gray-900">{formatDate(checkOut, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">{labels.nights}</dt>
            <dd className="text-gray-900">{nightsCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">{labels.guest}</dt>
            <dd className="text-gray-900">{guestName}</dd>
          </div>
          
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between">
              <dt className="font-semibold text-gray-900">{labels.total}</dt>
              <dd className="text-xl font-bold text-gray-900">
                {formatPrice(totalPrice, currency, locale)}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      {/* Payment information */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-amber-900 mb-3">{labels.paymentTitle}</h2>
        <p className="text-sm text-amber-800 mb-4">{labels.paymentInfo}</p>
        
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-amber-700">{labels.iban}</dt>
            <dd className="font-mono text-amber-900">{bankInfo.iban}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-amber-700">{labels.variableSymbol}</dt>
            <dd className="font-mono font-bold text-amber-900">{referenceNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-amber-700">{labels.amount}</dt>
            <dd className="font-bold text-amber-900">{formatPrice(totalPrice, currency, locale)}</dd>
          </div>
        </dl>
      </div>

      {/* Email confirmation */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm text-gray-600">{labels.emailSent}</p>
        <p className="font-medium text-gray-900">{guestEmail}</p>
      </div>

      {/* What happens next */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">{labels.whatNext}</h2>
        
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
            <span className="text-gray-600">{labels.step1}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <span className="text-gray-600">{labels.step2}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
            <span className="text-gray-600">{labels.step3}</span>
          </li>
        </ol>
      </div>

      {/* View reservation button */}
      <div className="text-center">
        <a
          href={tokenUrl}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {labels.viewReservation}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default BookingConfirmation;
