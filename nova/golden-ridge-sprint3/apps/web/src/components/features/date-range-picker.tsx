'use client';

/**
 * DateRangePicker Component
 * Compact date selection with check-in/check-out inputs
 * 
 * Features:
 * - Date input fields
 * - Integrated calendar popup
 * - Validation feedback
 * - Minimum nights enforcement
 */

import { useState, useRef, useEffect } from 'react';
import { AvailabilityCalendar } from './availability-calendar';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  apartmentSlug: string;
  checkIn: Date | null;
  checkOut: Date | null;
  onDatesChange: (checkIn: Date | null, checkOut: Date | null) => void;
  minNights?: number;
  locale?: 'cs' | 'en';
  error?: string;
  className?: string;
}

function formatDateDisplay(date: Date | null, locale: 'cs' | 'en'): string {
  if (!date) return '';
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  
  return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', options);
}

function formatDateInput(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

function parseInputDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function DateRangePicker({
  apartmentSlug,
  checkIn,
  checkOut,
  onDatesChange,
  minNights = 2,
  locale = 'cs',
  error,
  className,
}: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [focusedField, setFocusedField] = useState<'checkIn' | 'checkOut' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const labels = {
    checkIn: locale === 'cs' ? 'Check-in' : 'Check-in',
    checkOut: locale === 'cs' ? 'Check-out' : 'Check-out',
    nights: locale === 'cs' ? 'nocí' : 'nights',
    selectDates: locale === 'cs' ? 'Vyberte termín' : 'Select dates',
  };

  // Calculate nights
  const nightsCount = checkIn && checkOut
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
        setFocusedField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle date input change
  const handleInputChange = (field: 'checkIn' | 'checkOut', value: string) => {
    const date = parseInputDate(value);
    
    if (field === 'checkIn') {
      if (date && checkOut && date >= checkOut) {
        // If new check-in is after check-out, clear check-out
        onDatesChange(date, null);
      } else {
        onDatesChange(date, checkOut);
      }
    } else {
      if (date && checkIn && date <= checkIn) {
        // Invalid: check-out before check-in
        return;
      }
      onDatesChange(checkIn, date);
    }
  };

  // Handle calendar date selection
  const handleCalendarSelect = (newCheckIn: Date | null, newCheckOut: Date | null) => {
    onDatesChange(newCheckIn, newCheckOut);
    
    if (newCheckIn && newCheckOut) {
      setShowCalendar(false);
      setFocusedField(null);
    }
  };

  // Get minimum checkout date
  const getMinCheckoutDate = (): string => {
    if (!checkIn) return '';
    const minDate = new Date(checkIn);
    minDate.setDate(minDate.getDate() + minNights);
    return formatDateInput(minDate);
  };

  // Get today's date for min check-in
  const getTodayString = (): string => {
    return formatDateInput(new Date());
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Date inputs */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Check-in input */}
        <div className="flex-1">
          <label 
            htmlFor="checkIn" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {labels.checkIn}
          </label>
          <div className="relative">
            <input
              type="date"
              id="checkIn"
              value={formatDateInput(checkIn)}
              min={getTodayString()}
              onChange={(e) => handleInputChange('checkIn', e.target.value)}
              onFocus={() => {
                setFocusedField('checkIn');
                setShowCalendar(true);
              }}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                error ? 'border-red-300' : 'border-gray-300'
              )}
            />
            <button
              type="button"
              onClick={() => {
                setFocusedField('checkIn');
                setShowCalendar(!showCalendar);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={locale === 'cs' ? 'Otevřít kalendář' : 'Open calendar'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Arrow separator */}
        <div className="hidden sm:flex items-end pb-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>

        {/* Check-out input */}
        <div className="flex-1">
          <label 
            htmlFor="checkOut" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {labels.checkOut}
          </label>
          <div className="relative">
            <input
              type="date"
              id="checkOut"
              value={formatDateInput(checkOut)}
              min={getMinCheckoutDate() || getTodayString()}
              onChange={(e) => handleInputChange('checkOut', e.target.value)}
              onFocus={() => {
                setFocusedField('checkOut');
                setShowCalendar(true);
              }}
              disabled={!checkIn}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:bg-gray-50 disabled:text-gray-400',
                error ? 'border-red-300' : 'border-gray-300'
              )}
            />
            <button
              type="button"
              onClick={() => {
                if (checkIn) {
                  setFocusedField('checkOut');
                  setShowCalendar(!showCalendar);
                }
              }}
              disabled={!checkIn}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                checkIn ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300'
              )}
              aria-label={locale === 'cs' ? 'Otevřít kalendář' : 'Open calendar'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Nights count display */}
      {nightsCount > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          {nightsCount} {labels.nights}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Calendar popup */}
      {showCalendar && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
          <AvailabilityCalendar
            apartmentSlug={apartmentSlug}
            selectedCheckIn={checkIn}
            selectedCheckOut={checkOut}
            onDateSelect={handleCalendarSelect}
            minNights={minNights}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
