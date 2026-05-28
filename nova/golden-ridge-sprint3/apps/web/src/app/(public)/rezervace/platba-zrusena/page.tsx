'use client';

/**
 * Payment Cancelled Page
 * /rezervace/platba-zrusena
 * 
 * Displayed when user cancels Stripe payment
 * Sprint 3: Payment Integration
 */

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservation_id');
  
  // Detect language (default Czech)
  const locale = 'cs'; // Could be enhanced with actual detection

  const labels = {
    title: locale === 'cs' ? 'Platba zrušena' : 'Payment Cancelled',
    subtitle: locale === 'cs' 
      ? 'Vaše platba nebyla dokončena.'
      : 'Your payment was not completed.',
    description: locale === 'cs'
      ? 'Vaše rezervace byla vytvořena, ale platba nebyla dokončena. Můžete se vrátit a zkusit platbu znovu.'
      : 'Your reservation was created, but payment was not completed. You can go back and try payment again.',
    tryAgain: locale === 'cs' ? 'Zkusit platbu znovu' : 'Try Payment Again',
    backHome: locale === 'cs' ? 'Zpět na hlavní stránku' : 'Back to Homepage',
    contact: locale === 'cs' 
      ? 'Pokud máte problémy s platbou, kontaktujte nás.'
      : 'If you have trouble with payment, contact us.',
    contactLink: locale === 'cs' ? 'Kontaktovat nás' : 'Contact Us',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Warning icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.title}</h1>
        <p className="text-gray-600 mb-6">{labels.subtitle}</p>

        {/* Description */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-orange-800 text-sm">{labels.description}</p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {reservationId && (
            <Link
              href={`/api/v1/checkout/retry?reservation_id=${reservationId}`}
              className="block w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {labels.tryAgain}
            </Link>
          )}
          
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            {labels.backHome}
          </Link>
        </div>

        {/* Contact info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">{labels.contact}</p>
          <Link
            href="/kontakt"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {labels.contactLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
