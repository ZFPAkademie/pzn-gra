'use client';

/**
 * Payment Success Page
 * /rezervace/platba-uspesna
 * 
 * Displayed after successful Stripe payment
 * Sprint 3: Payment Integration
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SessionData {
  referenceNumber: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  currency: string;
  guestName: string;
  language: 'cs' | 'en';
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Default to Czech, will update when data loads
  const [locale, setLocale] = useState<'cs' | 'en'>('cs');

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setError('Missing session ID');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/checkout/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'Failed to verify payment');
          setLoading(false);
          return;
        }

        setSessionData(data.session);
        setLocale(data.session.language);
      } catch (err) {
        setError('Failed to verify payment');
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [sessionId]);

  const labels = {
    title: locale === 'cs' ? 'Platba úspěšná!' : 'Payment Successful!',
    subtitle: locale === 'cs' 
      ? 'Děkujeme za Vaši platbu. Vaše rezervace je nyní potvrzena.'
      : 'Thank you for your payment. Your reservation is now confirmed.',
    referenceNumber: locale === 'cs' ? 'Číslo rezervace' : 'Reference Number',
    apartment: locale === 'cs' ? 'Apartmán' : 'Apartment',
    checkIn: locale === 'cs' ? 'Check-in' : 'Check-in',
    checkOut: locale === 'cs' ? 'Check-out' : 'Check-out',
    total: locale === 'cs' ? 'Uhrazeno' : 'Amount Paid',
    emailSent: locale === 'cs' 
      ? 'Potvrzení bylo odesláno na Váš e-mail.'
      : 'Confirmation has been sent to your email.',
    nextSteps: locale === 'cs' ? 'Co bude následovat?' : 'What happens next?',
    step1: locale === 'cs' 
      ? 'Obdržíte e-mail s potvrzením platby'
      : 'You will receive a payment confirmation email',
    step2: locale === 'cs'
      ? 'Den před příjezdem obdržíte pokyny k check-inu'
      : 'One day before arrival, you will receive check-in instructions',
    backHome: locale === 'cs' ? 'Zpět na hlavní stránku' : 'Back to Homepage',
    viewReservation: locale === 'cs' ? 'Zobrazit rezervaci' : 'View Reservation',
    loading: locale === 'cs' ? 'Ověřuji platbu...' : 'Verifying payment...',
    error: locale === 'cs' ? 'Chyba při ověření platby' : 'Payment verification failed',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.error}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {labels.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{labels.title}</h1>
          <p className="text-gray-600">{labels.subtitle}</p>
        </div>

        {/* Reference number */}
        <div className="bg-green-50 p-4 rounded-lg text-center mb-6 border border-green-200">
          <p className="text-sm text-green-700 mb-1">{labels.referenceNumber}</p>
          <p className="text-2xl font-mono font-bold text-green-900">{sessionData.referenceNumber}</p>
        </div>

        {/* Booking details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600">{labels.apartment}</dt>
              <dd className="font-medium text-gray-900">{sessionData.apartmentName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{labels.checkIn}</dt>
              <dd className="text-gray-900">{sessionData.checkIn}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{labels.checkOut}</dt>
              <dd className="text-gray-900">{sessionData.checkOut}</dd>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between">
                <dt className="font-semibold text-gray-900">{labels.total}</dt>
                <dd className="text-xl font-bold text-green-600">
                  {sessionData.totalPrice} {sessionData.currency}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Email confirmation */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center border border-blue-200">
          <svg className="w-6 h-6 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-blue-800">{labels.emailSent}</p>
        </div>

        {/* What happens next */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
          <h2 className="font-semibold text-gray-900 mb-4">{labels.nextSteps}</h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <span className="text-gray-600">{labels.step1}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <span className="text-gray-600">{labels.step2}</span>
            </li>
          </ol>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            {labels.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
