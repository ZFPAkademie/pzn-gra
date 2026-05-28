'use client';

/**
 * AvailabilityCalendar Component
 * Displays monthly calendar with availability status
 * 
 * Features:
 * - Monthly navigation
 * - Visual distinction for available/unavailable dates
 * - Past dates disabled
 * - Minimum 2-night selection enforcement
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  apartmentSlug: string;
  selectedCheckIn?: Date | null;
  selectedCheckOut?: Date | null;
  onDateSelect?: (checkIn: Date | null, checkOut: Date | null) => void;
  minNights?: number;
  locale?: 'cs' | 'en';
  className?: string;
}

interface MonthAvailability {
  availableDates: string[];
  unavailableDates: string[];
}

const WEEKDAYS_CS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTHS_CS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateISO(date1) === formatDateISO(date2);
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const dateStr = formatDateISO(date);
  const startStr = formatDateISO(start);
  const endStr = formatDateISO(end);
  return dateStr > startStr && dateStr < endStr;
}

export function AvailabilityCalendar({
  apartmentSlug,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  minNights = 2,
  locale = 'cs',
  className,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  const [availability, setAvailability] = useState<MonthAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  const weekdays = locale === 'cs' ? WEEKDAYS_CS : WEEKDAYS_EN;
  const months = locale === 'cs' ? MONTHS_CS : MONTHS_EN;

  // Fetch availability for current month
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/v1/apartments/${apartmentSlug}/availability?month=${currentMonth.month}&year=${currentMonth.year}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load availability');
      }
      
      const data = await response.json();
      setAvailability({
        availableDates: data.availableDates || [],
        unavailableDates: data.unavailableDates || [],
      });
    } catch (err) {
      setError(locale === 'cs' 
        ? 'Nepodařilo se načíst dostupnost' 
        : 'Failed to load availability'
      );
    } finally {
      setLoading(false);
    }
  }, [apartmentSlug, currentMonth.month, currentMonth.year, locale]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Check if previous month navigation should be disabled
  const canGoPrevious = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    
    return currentMonth.year > currentYear || 
           (currentMonth.year === currentYear && currentMonth.month > currentMonthNum);
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!onDateSelect) return;
    
    const dateStr = formatDateISO(date);
    
    // Check if date is available
    if (availability?.unavailableDates.includes(dateStr)) {
      return;
    }
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return;
    }
    
    if (!selectingCheckOut || !selectedCheckIn) {
      // Selecting check-in date
      onDateSelect(date, null);
      setSelectingCheckOut(true);
    } else {
      // Selecting check-out date
      if (date <= selectedCheckIn) {
        // If clicked date is before check-in, reset
        onDateSelect(date, null);
        setSelectingCheckOut(true);
      } else {
        // Check minimum nights
        const nights = Math.ceil(
          (date.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (nights < minNights) {
          // Show minimum nights error or select minimum valid date
          const minCheckOut = new Date(selectedCheckIn);
          minCheckOut.setDate(minCheckOut.getDate() + minNights);
          onDateSelect(selectedCheckIn, minCheckOut);
        } else {
          onDateSelect(selectedCheckIn, date);
        }
        setSelectingCheckOut(false);
      }
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentMonth.year, currentMonth.month - 1, 1);
    const lastDay = new Date(currentMonth.year, currentMonth.month, 0);
    
    // Get day of week (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before first of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentMonth.year, currentMonth.month - 1, day));
    }
    
    return days;
  };

  // Get CSS classes for a day cell
  const getDayClasses = (date: Date | null) => {
    if (!date) {
      return 'bg-transparent';
    }
    
    const dateStr = formatDateISO(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isPast = date < today;
    const isUnavailable = availability?.unavailableDates.includes(dateStr);
    const isAvailable = availability?.availableDates.includes(dateStr);
    const isCheckIn = selectedCheckIn && isSameDay(date, selectedCheckIn);
    const isCheckOut = selectedCheckOut && isSameDay(date, selectedCheckOut);
    const isInRange = selectedCheckIn && selectedCheckOut && 
                      isDateInRange(date, selectedCheckIn, selectedCheckOut);
    const isToday = isSameDay(date, today);
    
    return cn(
      'h-10 w-10 rounded-md flex items-center justify-center text-sm transition-colors',
      {
        // Past or unavailable
        'text-gray-300 cursor-not-allowed': isPast || isUnavailable,
        'bg-gray-100 line-through': isUnavailable && !isPast,
        
        // Available
        'hover:bg-blue-100 cursor-pointer': isAvailable && !isPast && !isCheckIn && !isCheckOut,
        
        // Selected dates
        'bg-blue-600 text-white hover:bg-blue-700': isCheckIn || isCheckOut,
        'bg-blue-100': isInRange,
        
        // Today indicator
        'ring-2 ring-blue-400': isToday && !isCheckIn && !isCheckOut,
      }
    );
  };

  const days = generateCalendarDays();

  return (
    <div className={cn('w-full max-w-sm', className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious()}
          className={cn(
            'p-2 rounded-md transition-colors',
            canGoPrevious() 
              ? 'hover:bg-gray-100 text-gray-700' 
              : 'text-gray-300 cursor-not-allowed'
          )}
          aria-label={locale === 'cs' ? 'Předchozí měsíc' : 'Previous month'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="font-semibold text-gray-900">
          {months[currentMonth.month - 1]} {currentMonth.year}
        </h3>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
          aria-label={locale === 'cs' ? 'Následující měsíc' : 'Next month'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="h-60 flex items-center justify-center text-red-500 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <div key={index} className="flex items-center justify-center">
              {date ? (
                <button
                  type="button"
                  onClick={() => handleDateClick(date)}
                  className={getDayClasses(date)}
                  disabled={
                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                    availability?.unavailableDates.includes(formatDateISO(date))
                  }
                >
                  {date.getDate()}
                </button>
              ) : (
                <span className="h-10 w-10" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-blue-600" />
          <span>{locale === 'cs' ? 'Vybraný' : 'Selected'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-100 line-through flex items-center justify-center text-gray-400">×</span>
          <span>{locale === 'cs' ? 'Obsazeno' : 'Unavailable'}</span>
        </div>
      </div>
    </div>
  );
}

export default AvailabilityCalendar;
