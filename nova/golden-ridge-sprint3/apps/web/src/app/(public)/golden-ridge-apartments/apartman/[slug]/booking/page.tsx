'use client';

/**
 * Booking Page
 * /golden-ridge-apartments/apartman/[slug]/booking
 * 
 * Full booking flow for apartment reservation
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  DateRangePicker, 
  PriceSummary, 
  BookingForm,
  BookingConfirmation,
  BookingError,
} from '@/components/features';
import type { BookingFormData } from '@/components/features';
import { cn } from '@/lib/utils';

type ErrorType = 'rate_limited' | 'unavailable' | 'server_error' | 'validation' | 'generic';

interface ApartmentData {
  id: string;
  name: string;
  slug: string;
  maxGuests: number;
  basePricePerNight: number;
  currency: string;
}

interface BookingResult {
  success: boolean;
  referenceNumber: string;
  tokenUrl: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  nightsCount: number;
  totalPrice: number;
  currency: string;
  guestName: string;
  guestEmail: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  // Language detection (simplified - would use i18n context in production)
  const [locale, setLocale] = useState<'cs' | 'en'>('cs');
  
  // State
  const [apartment, setApartment] = useState<ApartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [priceValid, setPriceValid] = useState(false);
  
  const [step, setStep] = useState<'dates' | 'form' | 'confirmation' | 'error'>('dates');
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [bookingError, setBookingError] = useState<{ type: ErrorType; message?: string } | null>(null);

  const labels = {
    title: locale === 'cs' ? 'Rezervace' : 'Book Now',
    step1: locale === 'cs' ? 'Vyberte termín' : 'Select Dates',
    step2: locale === 'cs' ? 'Vaše údaje' : 'Your Details',
    step3: locale === 'cs' ? 'Potvrzení' : 'Confirmation',
    continue: locale === 'cs' ? 'Pokračovat' : 'Continue',
    back: locale === 'cs' ? 'Zpět' : 'Back',
    loading: locale === 'cs' ? 'Načítám...' : 'Loading...',
    notFound: locale === 'cs' ? 'Apartmán nenalezen' : 'Apartment not found',
    selectDates: locale === 'cs' ? 'Nejdříve vyberte termín' : 'Please select dates first',
    guests: locale === 'cs' ? 'Počet hostů' : 'Number of Guests',
    guest: locale === 'cs' ? 'host' : 'guest',
    guestsLabel: locale === 'cs' ? 'hostů' : 'guests',
  };

  // Fetch apartment data
  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const response = await fetch(`/api/v1/apartments/${slug}`);
        if (!response.ok) {
          throw new Error('Apartment not found');
        }
        
        const data = await response.json();
        setApartment({
          id: data.id,
          name: data.name,
          slug: data.slug,
          maxGuests: data.maxGuests || 6,
          basePricePerNight: data.priceFrom || 150,
          currency: 'EUR',
        });
      } catch (err) {
        setError(labels.notFound);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApartment();
  }, [slug, labels.notFound]);

  // Handle dates change
  const handleDatesChange = (newCheckIn: Date | null, newCheckOut: Date | null) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
    setPriceValid(false);
  };

  // Handle price calculated
  const handlePriceCalculated = (price: number | null, valid: boolean) => {
    setCalculatedPrice(price);
    setPriceValid(valid);
  };

  // Handle continue to form
  const handleContinueToForm = () => {
    if (checkIn && checkOut && priceValid) {
      setStep('form');
    }
  };

  // Handle back to dates
  const handleBackToDates = () => {
    setStep('dates');
  };

  // Calculate nights
  const nightsCount = checkIn && checkOut
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Handle booking submit
  const handleBookingSubmit = async (formData: BookingFormData) => {
    if (!apartment || !checkIn || !checkOut || !calculatedPrice) {
      throw new Error('Missing booking data');
    }

    const response = await fetch('/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apartmentId: apartment.id,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        ...formData,
        language: locale,
      }),
    });

    const data = await response.json();

    // Handle specific error types
    if (response.status === 429) {
      setBookingError({ type: 'rate_limited' });
      setStep('error');
      return;
    }

    if (response.status === 409 || data.error?.includes('availability')) {
      setBookingError({ type: 'unavailable', message: data.error });
      setStep('error');
      return;
    }

    if (response.status >= 500) {
      setBookingError({ type: 'server_error', message: data.error });
      setStep('error');
      return;
    }

    if (!response.ok || !data.success) {
      // Validation errors stay on form, others go to error page
      if (response.status === 400 && data.errors?.length > 0) {
        throw new Error(data.errors.join(', '));
      }
      setBookingError({ type: 'generic', message: data.error || data.errors?.[0] });
      setStep('error');
      return;
    }

    // If Stripe checkout URL is available, redirect to payment
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    // Fallback: Show confirmation page (for when Stripe is not configured)
    setBookingResult({
      success: true,
      referenceNumber: data.referenceNumber,
      tokenUrl: data.tokenUrl,
      apartmentName: apartment.name,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      nightsCount,
      totalPrice: calculatedPrice,
      currency: 'EUR',
      guestName: `${formData.guestFirstName} ${formData.guestLastName}`,
      guestEmail: formData.guestEmail,
    });

    setStep('confirmation');
  };

  // Handle retry from error state
  const handleRetry = () => {
    setBookingError(null);
    setStep('form');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Error state
  if (error || !apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || labels.notFound}</p>
          <a href="/golden-ridge-apartments" className="text-blue-600 hover:underline">
            {locale === 'cs' ? 'Zpět na přehled' : 'Back to overview'}
          </a>
        </div>
      </div>
    );
  }

  // Booking error step
  if (step === 'error' && bookingError) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <BookingError
          type={bookingError.type}
          message={bookingError.message}
          apartmentSlug={slug}
          locale={locale}
          onRetry={bookingError.type !== 'rate_limited' ? handleRetry : undefined}
        />
      </div>
    );
  }

  // Confirmation step
  if (step === 'confirmation' && bookingResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <BookingConfirmation
          referenceNumber={bookingResult.referenceNumber}
          apartmentName={bookingResult.apartmentName}
          checkIn={bookingResult.checkIn}
          checkOut={bookingResult.checkOut}
          nightsCount={bookingResult.nightsCount}
          totalPrice={bookingResult.totalPrice}
          currency={bookingResult.currency}
          guestName={bookingResult.guestName}
          guestEmail={bookingResult.guestEmail}
          tokenUrl={bookingResult.tokenUrl}
          locale={locale}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <a 
            href={`/golden-ridge-apartments/apartman/${slug}`}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {apartment.name}
          </a>
          <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
        </div>
      </div>

      {/* Progress steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className={cn(
              'flex items-center gap-2',
              step === 'dates' ? 'text-blue-600 font-medium' : 'text-gray-500'
            )}>
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                step === 'dates' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              )}>1</span>
              {labels.step1}
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={cn(
              'flex items-center gap-2',
              step === 'form' ? 'text-blue-600 font-medium' : 'text-gray-500'
            )}>
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                step === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              )}>2</span>
              {labels.step2}
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-200">3</span>
              {labels.step3}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {step === 'dates' && (
          <div className="space-y-6">
            {/* Date selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">{labels.step1}</h2>
              
              <DateRangePicker
                apartmentSlug={slug}
                checkIn={checkIn}
                checkOut={checkOut}
                onDatesChange={handleDatesChange}
                minNights={2}
                locale={locale}
              />

              {/* Guest count */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {labels.guests}
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value))}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: apartment.maxGuests }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? labels.guest : labels.guestsLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price summary */}
            <PriceSummary
              apartmentSlug={slug}
              checkIn={checkIn}
              checkOut={checkOut}
              guestCount={guestCount}
              locale={locale}
              onPriceCalculated={handlePriceCalculated}
            />

            {/* Continue button */}
            <button
              onClick={handleContinueToForm}
              disabled={!checkIn || !checkOut || !priceValid}
              className={cn(
                'w-full py-3 px-4 rounded-md font-medium text-white transition-colors',
                checkIn && checkOut && priceValid
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {labels.continue}
            </button>
          </div>
        )}

        {step === 'form' && checkIn && checkOut && calculatedPrice && (
          <div className="space-y-6">
            <button
              onClick={handleBackToDates}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {labels.back}
            </button>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <BookingForm
                apartmentId={apartment.id}
                apartmentName={apartment.name}
                checkIn={checkIn}
                checkOut={checkOut}
                nightsCount={nightsCount}
                totalPrice={calculatedPrice}
                currency="EUR"
                maxGuests={apartment.maxGuests}
                locale={locale}
                onSubmit={handleBookingSubmit}
                onCancel={handleBackToDates}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
