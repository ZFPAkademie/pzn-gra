'use client';

/**
 * BookingForm Component
 * Complete guest details collection form for booking
 * 
 * Features:
 * - All required fields per SPRINT_2_PLAN.md
 * - Validation feedback
 * - Country selection
 * - GDPR and Terms checkboxes
 * - Submit handling
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BookingFormProps {
  apartmentId: string;
  apartmentName: string;
  checkIn: Date;
  checkOut: Date;
  nightsCount: number;
  totalPrice: number;
  currency: string;
  maxGuests: number;
  locale?: 'cs' | 'en';
  onSubmit: (data: BookingFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export interface BookingFormData {
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  guestCount: number;
  specialRequests: string;
  gdprConsent: boolean;
  termsAccepted: boolean;
}

interface FormErrors {
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCountry?: string;
  guestCount?: string;
  gdprConsent?: string;
  termsAccepted?: string;
  general?: string;
}

interface Country {
  code: string;
  name: string;
}

export function BookingForm({
  apartmentId,
  apartmentName,
  checkIn,
  checkOut,
  nightsCount,
  totalPrice,
  currency,
  maxGuests,
  locale = 'cs',
  onSubmit,
  onCancel,
  className,
}: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
    guestCountry: 'CZ',
    guestCount: 2,
    specialRequests: '',
    gdprConsent: false,
    termsAccepted: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Labels
  const labels = {
    title: locale === 'cs' ? 'Údaje o hostu' : 'Guest Details',
    firstName: locale === 'cs' ? 'Jméno' : 'First Name',
    lastName: locale === 'cs' ? 'Příjmení' : 'Last Name',
    email: locale === 'cs' ? 'E-mail' : 'Email',
    phone: locale === 'cs' ? 'Telefon' : 'Phone',
    country: locale === 'cs' ? 'Země' : 'Country',
    guestCount: locale === 'cs' ? 'Počet hostů' : 'Number of Guests',
    specialRequests: locale === 'cs' ? 'Speciální požadavky' : 'Special Requests',
    specialRequestsPlaceholder: locale === 'cs' 
      ? 'Např. pozdní příjezd, dětská postýlka...' 
      : 'E.g. late arrival, baby cot...',
    gdprConsent: locale === 'cs'
      ? 'Souhlasím se zpracováním osobních údajů'
      : 'I agree to the processing of personal data',
    termsAccepted: locale === 'cs'
      ? 'Souhlasím s obchodními podmínkami'
      : 'I agree to the terms and conditions',
    submit: locale === 'cs' ? 'Dokončit rezervaci' : 'Complete Booking',
    cancel: locale === 'cs' ? 'Zrušit' : 'Cancel',
    required: locale === 'cs' ? 'Povinné pole' : 'Required field',
    invalidEmail: locale === 'cs' ? 'Neplatný e-mail' : 'Invalid email',
    invalidPhone: locale === 'cs' ? 'Neplatný telefon' : 'Invalid phone number',
    nameTooShort: locale === 'cs' ? 'Minimálně 2 znaky' : 'Minimum 2 characters',
    mustAccept: locale === 'cs' ? 'Musíte souhlasit' : 'You must agree',
    guest: locale === 'cs' ? 'host' : 'guest',
    guests: locale === 'cs' ? 'hostů' : 'guests',
    processing: locale === 'cs' ? 'Zpracovávám...' : 'Processing...',
  };

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`/api/v1/bookings?language=${locale}`);
        if (response.ok) {
          const data = await response.json();
          setCountries(data.countries || []);
        }
      } catch (error) {
        // Use default countries
        setCountries([
          { code: 'CZ', name: locale === 'cs' ? 'Česká republika' : 'Czech Republic' },
          { code: 'SK', name: locale === 'cs' ? 'Slovensko' : 'Slovakia' },
          { code: 'DE', name: locale === 'cs' ? 'Německo' : 'Germany' },
          { code: 'AT', name: locale === 'cs' ? 'Rakousko' : 'Austria' },
          { code: 'PL', name: locale === 'cs' ? 'Polsko' : 'Poland' },
        ]);
      }
    };
    
    fetchCountries();
  }, [locale]);

  // Validation
  const validateField = (name: keyof BookingFormData, value: any): string | undefined => {
    switch (name) {
      case 'guestFirstName':
      case 'guestLastName':
        if (!value || value.trim().length < 2) {
          return labels.nameTooShort;
        }
        break;
      case 'guestEmail':
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return labels.invalidEmail;
        }
        break;
      case 'guestPhone':
        if (!value || !/^[\d\s\-\+\(\)]{6,20}$/.test(value)) {
          return labels.invalidPhone;
        }
        break;
      case 'guestCountry':
        if (!value) {
          return labels.required;
        }
        break;
      case 'guestCount':
        if (!value || value < 1 || value > maxGuests) {
          return `1-${maxGuests} ${labels.guests}`;
        }
        break;
      case 'gdprConsent':
      case 'termsAccepted':
        if (!value) {
          return labels.mustAccept;
        }
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    (Object.keys(formData) as Array<keyof BookingFormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : type === 'number' 
        ? parseInt(value) 
        : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error on change if field was touched
    if (touched[name]) {
      const error = validateField(name as keyof BookingFormData, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle blur (mark as touched)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name as keyof BookingFormData, fieldValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setErrors({});
    
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({
        general: error instanceof Error 
          ? error.message 
          : (locale === 'cs' ? 'Došlo k chybě' : 'An error occurred'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Format date display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format price
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Booking summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">{apartmentName}</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>{formatDate(checkIn)} → {formatDate(checkOut)}</p>
          <p className="font-medium">{nightsCount} {nightsCount === 1 ? labels.guest : labels.guests} • {formatPrice(totalPrice)}</p>
        </div>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {errors.general}
        </div>
      )}

      {/* Guest details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">{labels.title}</h3>
        
        {/* Name fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="guestFirstName" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.firstName} *
            </label>
            <input
              type="text"
              id="guestFirstName"
              name="guestFirstName"
              value={formData.guestFirstName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.guestFirstName && touched.guestFirstName
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              )}
              required
            />
            {errors.guestFirstName && touched.guestFirstName && (
              <p className="mt-1 text-xs text-red-600">{errors.guestFirstName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="guestLastName" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.lastName} *
            </label>
            <input
              type="text"
              id="guestLastName"
              name="guestLastName"
              value={formData.guestLastName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.guestLastName && touched.guestLastName
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              )}
              required
            />
            {errors.guestLastName && touched.guestLastName && (
              <p className="mt-1 text-xs text-red-600">{errors.guestLastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-1">
            {labels.email} *
          </label>
          <input
            type="email"
            id="guestEmail"
            name="guestEmail"
            value={formData.guestEmail}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.guestEmail && touched.guestEmail
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500'
            )}
            required
          />
          {errors.guestEmail && touched.guestEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.guestEmail}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="guestPhone" className="block text-sm font-medium text-gray-700 mb-1">
            {labels.phone} *
          </label>
          <input
            type="tel"
            id="guestPhone"
            name="guestPhone"
            value={formData.guestPhone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="+420 123 456 789"
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.guestPhone && touched.guestPhone
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500'
            )}
            required
          />
          {errors.guestPhone && touched.guestPhone && (
            <p className="mt-1 text-xs text-red-600">{errors.guestPhone}</p>
          )}
        </div>

        {/* Country and Guest Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="guestCountry" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.country} *
            </label>
            <select
              id="guestCountry"
              name="guestCountry"
              value={formData.guestCountry}
              onChange={handleChange}
              onBlur={handleBlur}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.guestCountry && touched.guestCountry
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              )}
              required
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.guestCountry && touched.guestCountry && (
              <p className="mt-1 text-xs text-red-600">{errors.guestCountry}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="guestCount" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.guestCount} *
            </label>
            <select
              id="guestCount"
              name="guestCount"
              value={formData.guestCount}
              onChange={handleChange}
              onBlur={handleBlur}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'border-gray-300 focus:border-blue-500'
              )}
              required
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? labels.guest : labels.guests}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Special requests */}
        <div>
          <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
            {labels.specialRequests}
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            placeholder={labels.specialRequestsPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Consent checkboxes */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="gdprConsent"
            checked={formData.gdprConsent}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'mt-1 h-4 w-4 rounded border-gray-300 text-blue-600',
              'focus:ring-blue-500',
              errors.gdprConsent && touched.gdprConsent ? 'border-red-300' : ''
            )}
            required
          />
          <span className="text-sm text-gray-600">
            {labels.gdprConsent} *
          </span>
        </label>
        {errors.gdprConsent && touched.gdprConsent && (
          <p className="text-xs text-red-600 ml-7">{errors.gdprConsent}</p>
        )}
        
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'mt-1 h-4 w-4 rounded border-gray-300 text-blue-600',
              'focus:ring-blue-500',
              errors.termsAccepted && touched.termsAccepted ? 'border-red-300' : ''
            )}
            required
          />
          <span className="text-sm text-gray-600">
            {labels.termsAccepted} *
          </span>
        </label>
        {errors.termsAccepted && touched.termsAccepted && (
          <p className="text-xs text-red-600 ml-7">{errors.termsAccepted}</p>
        )}
      </div>

      {/* Submit buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'flex-1 py-3 px-4 rounded-md font-medium text-white',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            'transition-colors',
            submitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {submitting ? labels.processing : labels.submit}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="py-3 px-4 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {labels.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

export default BookingForm;
