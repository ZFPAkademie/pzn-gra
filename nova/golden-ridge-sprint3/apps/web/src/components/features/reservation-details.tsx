'use client';

/**
 * ReservationDetails Component
 * Displays reservation status, dates, and price on token page
 */

import { cn } from '@/lib/utils';
import type { ReservationStatus } from '@/types/booking';

interface ReservationDetailsProps {
  referenceNumber: string;
  status: ReservationStatus;
  apartmentName: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  guestFirstName: string;
  guestLastName: string;
  guestCount: number;
  totalPrice: number;
  currency: string;
  locale?: 'cs' | 'en';
  className?: string;
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

function formatPrice(amount: number, currency: string, locale: 'cs' | 'en'): string {
  return new Intl.NumberFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

const statusConfig: Record<ReservationStatus, {
  labelCs: string;
  labelEn: string;
  color: string;
  bgColor: string;
}> = {
  PENDING: {
    labelCs: 'Čeká na potvrzení',
    labelEn: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  CONFIRMED: {
    labelCs: 'Potvrzeno',
    labelEn: 'Confirmed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  CHECKED_IN: {
    labelCs: 'Ubytován',
    labelEn: 'Checked In',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  COMPLETED: {
    labelCs: 'Dokončeno',
    labelEn: 'Completed',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  CANCELLED: {
    labelCs: 'Zrušeno',
    labelEn: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

export function ReservationDetails({
  referenceNumber,
  status,
  apartmentName,
  checkInDate,
  checkOutDate,
  nightsCount,
  guestFirstName,
  guestLastName,
  guestCount,
  totalPrice,
  currency,
  locale = 'cs',
  className,
}: ReservationDetailsProps) {
  const labels = {
    reservation: locale === 'cs' ? 'Rezervace' : 'Reservation',
    status: locale === 'cs' ? 'Stav' : 'Status',
    apartment: locale === 'cs' ? 'Apartmán' : 'Apartment',
    checkIn: locale === 'cs' ? 'Check-in' : 'Check-in',
    checkOut: locale === 'cs' ? 'Check-out' : 'Check-out',
    nights: locale === 'cs' ? 'Počet nocí' : 'Nights',
    guest: locale === 'cs' ? 'Host' : 'Guest',
    guestCount: locale === 'cs' ? 'Počet hostů' : 'Guests',
    total: locale === 'cs' ? 'Celkem' : 'Total',
    paymentPending: locale === 'cs' 
      ? 'Čeká na úhradu bankovním převodem'
      : 'Awaiting bank transfer payment',
  };

  const statusInfo = statusConfig[status];

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-500">{labels.reservation}</p>
            <p className="text-lg font-mono font-bold text-gray-900">{referenceNumber}</p>
          </div>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            statusInfo.bgColor,
            statusInfo.color
          )}>
            {locale === 'cs' ? statusInfo.labelCs : statusInfo.labelEn}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-4">
        {/* Apartment */}
        <div>
          <p className="text-sm text-gray-500">{labels.apartment}</p>
          <p className="font-semibold text-gray-900">{apartmentName}</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{labels.checkIn}</p>
            <p className="font-medium text-gray-900">{formatDate(checkInDate, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{labels.checkOut}</p>
            <p className="font-medium text-gray-900">{formatDate(checkOutDate, locale)}</p>
          </div>
        </div>

        {/* Nights and guests */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{labels.nights}</p>
            <p className="font-medium text-gray-900">{nightsCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{labels.guestCount}</p>
            <p className="font-medium text-gray-900">{guestCount}</p>
          </div>
        </div>

        {/* Guest name */}
        <div>
          <p className="text-sm text-gray-500">{labels.guest}</p>
          <p className="font-medium text-gray-900">{guestFirstName} {guestLastName}</p>
        </div>
      </div>

      {/* Price footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">{labels.total}</span>
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(totalPrice, currency, locale)}
          </span>
        </div>
        
        {status === 'PENDING' && (
          <p className="text-sm text-yellow-700 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {labels.paymentPending}
          </p>
        )}
      </div>
    </div>
  );
}

export default ReservationDetails;
