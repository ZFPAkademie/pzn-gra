'use client';

/**
 * PriceSummary Component
 * Displays calculated price for selected date range
 * 
 * Features:
 * - Real-time price calculation
 * - Breakdown display (optional)
 * - Seasonal pricing indicator
 * - Loading and error states
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PriceSummaryProps {
  apartmentSlug: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guestCount: number;
  showBreakdown?: boolean;
  locale?: 'cs' | 'en';
  className?: string;
  onPriceCalculated?: (price: number | null, valid: boolean) => void;
}

interface PriceData {
  nightsCount: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  hasSeasonalPricing: boolean;
  breakdown?: Array<{
    date: string;
    basePrice: number;
    adjustedPrice: number;
    appliedRules: string[];
  }>;
}

function formatPrice(amount: number, currency: string, locale: 'cs' | 'en'): string {
  return new Intl.NumberFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateShort(dateStr: string, locale: 'cs' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function PriceSummary({
  apartmentSlug,
  checkIn,
  checkOut,
  guestCount,
  showBreakdown = false,
  locale = 'cs',
  className,
  onPriceCalculated,
}: PriceSummaryProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    pricePerNight: locale === 'cs' ? 'Cena za noc' : 'Price per night',
    nights: locale === 'cs' ? 'nocí' : 'nights',
    night: locale === 'cs' ? 'noc' : 'night',
    total: locale === 'cs' ? 'Celkem' : 'Total',
    seasonalPricing: locale === 'cs' ? 'Sezónní ceny' : 'Seasonal pricing',
    selectDates: locale === 'cs' ? 'Vyberte termín pro zobrazení ceny' : 'Select dates to see price',
    calculating: locale === 'cs' ? 'Počítám cenu...' : 'Calculating price...',
    errorLoading: locale === 'cs' ? 'Nepodařilo se načíst cenu' : 'Failed to load price',
    breakdown: locale === 'cs' ? 'Rozpis ceny' : 'Price breakdown',
    basePrice: locale === 'cs' ? 'Základní cena' : 'Base price',
    adjusted: locale === 'cs' ? 'Upravená cena' : 'Adjusted price',
    from: locale === 'cs' ? 'od' : 'from',
  };

  // Fetch price when dates change
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setPriceData(null);
      onPriceCalculated?.(null, false);
      return;
    }

    const fetchPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          checkIn: formatDateISO(checkIn),
          checkOut: formatDateISO(checkOut),
          guestCount: guestCount.toString(),
          detailed: showBreakdown.toString(),
        });

        const response = await fetch(
          `/api/v1/apartments/${apartmentSlug}/price?${params}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to calculate price');
        }

        const data = await response.json();
        
        setPriceData({
          nightsCount: data.nightsCount,
          pricePerNight: data.pricePerNight,
          totalPrice: data.totalPrice,
          currency: data.currency,
          hasSeasonalPricing: data.hasSeasonalPricing,
          breakdown: data.breakdown,
        });
        
        onPriceCalculated?.(data.totalPrice, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : labels.errorLoading);
        onPriceCalculated?.(null, false);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, [apartmentSlug, checkIn, checkOut, guestCount, showBreakdown, onPriceCalculated, labels.errorLoading]);

  // No dates selected
  if (!checkIn || !checkOut) {
    return (
      <div className={cn('p-4 bg-gray-50 rounded-lg', className)}>
        <p className="text-sm text-gray-500 text-center">
          {labels.selectDates}
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn('p-4 bg-gray-50 rounded-lg', className)}>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span className="text-sm">{labels.calculating}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-4 bg-red-50 rounded-lg', className)}>
        <p className="text-sm text-red-600 text-center">{error}</p>
      </div>
    );
  }

  // No price data
  if (!priceData) {
    return null;
  }

  return (
    <div className={cn('p-4 bg-gray-50 rounded-lg', className)}>
      {/* Price per night */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm text-gray-600">{labels.pricePerNight}</span>
        <span className="font-semibold">
          {formatPrice(priceData.pricePerNight, priceData.currency, locale)}
        </span>
      </div>

      {/* Nights count */}
      <div className="flex items-baseline justify-between mb-3 text-sm text-gray-600">
        <span>
          {priceData.nightsCount} {priceData.nightsCount === 1 ? labels.night : labels.nights}
        </span>
        {priceData.hasSeasonalPricing && (
          <span className="text-xs text-blue-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {labels.seasonalPricing}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3" />

      {/* Total price */}
      <div className="flex items-baseline justify-between">
        <span className="font-medium text-gray-900">{labels.total}</span>
        <span className="text-xl font-bold text-gray-900">
          {formatPrice(priceData.totalPrice, priceData.currency, locale)}
        </span>
      </div>

      {/* Breakdown (if available and requested) */}
      {showBreakdown && priceData.breakdown && priceData.breakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="w-full text-left"
            onClick={(e) => {
              const target = e.currentTarget.nextElementSibling;
              if (target) {
                target.classList.toggle('hidden');
              }
            }}
          >
            <span className="text-sm font-medium text-gray-700 flex items-center justify-between">
              {labels.breakdown}
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          
          <div className="hidden mt-3 space-y-2">
            {priceData.breakdown.map((day, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {formatDateShort(day.date, locale)}
                </span>
                <span className={cn(
                  'font-medium',
                  day.appliedRules.length > 0 ? 'text-blue-600' : 'text-gray-700'
                )}>
                  {formatPrice(day.adjustedPrice, priceData.currency, locale)}
                  {day.appliedRules.length > 0 && (
                    <span className="ml-1 text-gray-400" title={day.appliedRules.join(', ')}>
                      *
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceSummary;
