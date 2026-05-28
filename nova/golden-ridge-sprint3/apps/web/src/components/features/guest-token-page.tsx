'use client';

/**
 * GuestTokenPage Component
 * Full layout for guest token page with all sub-components
 */

import { ReservationDetails } from './reservation-details';
import { CheckInInstructions } from './checkin-instructions';
import { HouseRules } from './house-rules';
import { MessageForm } from './message-form';
import { cn } from '@/lib/utils';
import type { TokenPageResponse, ReservationStatus } from '@/types/booking';

interface GuestTokenPageProps {
  token: string;
  data: TokenPageResponse;
  locale?: 'cs' | 'en';
  className?: string;
}

export function GuestTokenPage({
  token,
  data,
  locale = 'cs',
  className,
}: GuestTokenPageProps) {
  if (!data.valid || !data.reservation) {
    return null; // Should not happen - parent should handle invalid state
  }

  const { reservation, checkInInfo, houseRules, apartmentInfo } = data;
  
  const labels = {
    title: locale === 'cs' ? 'Vaše rezervace' : 'Your Reservation',
    apartmentLink: locale === 'cs' ? 'Zobrazit apartmán' : 'View Apartment',
  };

  return (
    <div className={cn('max-w-2xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
        <a
          href={`/golden-ridge-apartments/apartman/${reservation.apartmentSlug}`}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          {labels.apartmentLink} →
        </a>
      </div>

      {/* Reservation Details */}
      <ReservationDetails
        referenceNumber={reservation.referenceNumber}
        status={reservation.status as ReservationStatus}
        apartmentName={reservation.apartmentName}
        checkInDate={reservation.checkInDate}
        checkOutDate={reservation.checkOutDate}
        nightsCount={reservation.nightsCount}
        guestFirstName={reservation.guestFirstName}
        guestLastName={reservation.guestLastName}
        guestCount={reservation.guestCount}
        totalPrice={reservation.totalPrice}
        currency={reservation.currency}
        locale={locale}
      />

      {/* Check-in Instructions (if available) */}
      {checkInInfo && (
        <CheckInInstructions
          address={checkInInfo.address}
          accessCode={checkInInfo.accessCode}
          parkingInfo={checkInInfo.parkingInfo}
          wifiName={checkInInfo.wifiName}
          wifiPassword={checkInInfo.wifiPassword}
          emergencyContact={checkInInfo.emergencyContact}
          checkInTime={checkInInfo.checkInTime}
          checkOutTime={checkInInfo.checkOutTime}
          locale={locale}
        />
      )}

      {/* House Rules & Apartment Info */}
      <HouseRules
        houseRules={houseRules}
        apartmentInfo={apartmentInfo}
        locale={locale}
      />

      {/* Contact Form */}
      <MessageForm
        token={token}
        locale={locale}
      />
    </div>
  );
}

export default GuestTokenPage;
