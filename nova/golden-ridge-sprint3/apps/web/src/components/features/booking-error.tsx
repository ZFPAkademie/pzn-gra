'use client';

/**
 * BookingError Component
 * Displays booking error states (rate-limited, server error, unavailable, etc.)
 */

import { cn } from '@/lib/utils';

type ErrorType = 'rate_limited' | 'unavailable' | 'server_error' | 'validation' | 'generic';

interface BookingErrorProps {
  type: ErrorType;
  message?: string;
  apartmentSlug?: string;
  locale?: 'cs' | 'en';
  onRetry?: () => void;
  className?: string;
}

const errorConfig: Record<ErrorType, {
  iconColor: string;
  bgColor: string;
  iconPath: string;
}> = {
  rate_limited: {
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  unavailable: {
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  server_error: {
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  validation: {
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  generic: {
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export function BookingError({
  type,
  message,
  apartmentSlug,
  locale = 'cs',
  onRetry,
  className,
}: BookingErrorProps) {
  const labels = {
    rate_limited: {
      title: locale === 'cs' ? 'Příliš mnoho pokusů' : 'Too many attempts',
      description: locale === 'cs' 
        ? 'Prosím počkejte několik minut a zkuste to znovu.'
        : 'Please wait a few minutes and try again.',
    },
    unavailable: {
      title: locale === 'cs' ? 'Termín není dostupný' : 'Dates not available',
      description: locale === 'cs'
        ? 'Vybraný termín byl právě obsazen. Zkuste prosím jiný termín.'
        : 'The selected dates have just been booked. Please try different dates.',
    },
    server_error: {
      title: locale === 'cs' ? 'Chyba serveru' : 'Server error',
      description: locale === 'cs'
        ? 'Omlouváme se, došlo k technické chybě. Zkuste to prosím později.'
        : 'Sorry, a technical error occurred. Please try again later.',
    },
    validation: {
      title: locale === 'cs' ? 'Neplatné údaje' : 'Invalid data',
      description: locale === 'cs'
        ? 'Zkontrolujte prosím vyplněné údaje a opravte chyby.'
        : 'Please check the entered data and correct any errors.',
    },
    generic: {
      title: locale === 'cs' ? 'Něco se pokazilo' : 'Something went wrong',
      description: locale === 'cs'
        ? 'Rezervaci se nepodařilo dokončit.'
        : 'The booking could not be completed.',
    },
    retry: locale === 'cs' ? 'Zkusit znovu' : 'Try again',
    backToApartment: locale === 'cs' ? 'Zpět na apartmán' : 'Back to apartment',
    backHome: locale === 'cs' ? 'Zpět na hlavní stránku' : 'Back to homepage',
    contactUs: locale === 'cs' ? 'Kontaktujte nás' : 'Contact us',
  };

  const config = errorConfig[type];
  const errorLabels = labels[type];

  return (
    <div className={cn('max-w-md mx-auto text-center', className)}>
      {/* Error icon */}
      <div className={cn(
        'inline-flex items-center justify-center w-16 h-16 rounded-full mb-6',
        config.bgColor
      )}>
        <svg 
          className={cn('w-8 h-8', config.iconColor)} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={config.iconPath} 
          />
        </svg>
      </div>

      {/* Error title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {errorLabels.title}
      </h1>

      {/* Error description */}
      <p className="text-gray-600 mb-2">
        {errorLabels.description}
      </p>

      {/* Custom message */}
      {message && (
        <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg">
          {message}
        </p>
      )}

      {/* Actions */}
      <div className="space-y-3 mt-6">
        {/* Retry button (for retryable errors) */}
        {onRetry && type !== 'rate_limited' && (
          <button
            onClick={onRetry}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {labels.retry}
          </button>
        )}

        {/* Rate limited - show countdown hint */}
        {type === 'rate_limited' && (
          <div className="text-sm text-orange-700 bg-orange-50 p-4 rounded-lg">
            <p>{locale === 'cs' ? 'Limit: 5 požadavků za minutu' : 'Limit: 5 requests per minute'}</p>
          </div>
        )}

        {/* Back to apartment */}
        {apartmentSlug && (
          <a
            href={`/golden-ridge-apartments/apartman/${apartmentSlug}`}
            className="block w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {labels.backToApartment}
          </a>
        )}

        {/* Back home */}
        <a
          href="/"
          className="block text-gray-600 hover:text-gray-900 text-sm"
        >
          {labels.backHome}
        </a>

        {/* Contact link for server errors */}
        {type === 'server_error' && (
          <a
            href="/kontakt"
            className="block text-blue-600 hover:text-blue-700 text-sm"
          >
            {labels.contactUs}
          </a>
        )}
      </div>
    </div>
  );
}

export default BookingError;
