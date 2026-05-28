'use client';

/**
 * Booking Confirmation Page
 * /rezervace/potvrzeni
 * 
 * Displays booking confirmation after successful reservation
 * Reads booking data from URL params or sessionStorage
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingConfirmation } from '@/components/features';

interface ConfirmationData {
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
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const locale = 'cs'; // Default to Czech

  const labels = {
    loading: locale === 'cs' ? 'Načítám...' : 'Loading...',
    notFound: locale === 'cs' ? 'Rezervace nenalezena' : 'Reservation not found',
    notFoundDesc: locale === 'cs' 
      ? 'Nepodařilo se načíst údaje o rezervaci.'
      : 'Could not load reservation details.',
    backHome: locale === 'cs' ? 'Zpět na hlavní stránku' : 'Back to homepage',
  };

  useEffect(() => {
    // Try to get data from URL params
    const ref = searchParams.get('ref');
    
    if (ref) {
      // Fetch reservation data by reference
      const fetchData = async () => {
        try {
          // In a real implementation, we might fetch from API
          // For now, try sessionStorage (set during booking flow)
          const stored = sessionStorage.getItem(`booking_${ref}`);
          if (stored) {
            setData(JSON.parse(stored));
          }
        } catch (err) {
          console.error('Failed to load confirmation data:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      // Try sessionStorage for most recent booking
      try {
        const stored = sessionStorage.getItem('last_booking');
        if (stored) {
          setData(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load confirmation data:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{labels.notFound}</h1>
          <p className="text-gray-600 mb-6">{labels.notFoundDesc}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            {labels.backHome}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <BookingConfirmation
        referenceNumber={data.referenceNumber}
        apartmentName={data.apartmentName}
        checkIn={data.checkIn}
        checkOut={data.checkOut}
        nightsCount={data.nightsCount}
        totalPrice={data.totalPrice}
        currency={data.currency}
        guestName={data.guestName}
        guestEmail={data.guestEmail}
        tokenUrl={data.tokenUrl}
        locale={locale}
      />
    </div>
  );
}
