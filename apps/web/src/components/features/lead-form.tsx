/**
 * Lead Capture Form
 * Production v1: Apartment inquiries
 * 
 * CTA labels (per design doc):
 * - rent → "Poptat termín"
 * - sale → "Nezávazně poptat cenu"
 * - investment → "Kontaktovat investiční tým"
 * - investment_share → "Získat nabídku podílů"
 */

'use client';

import { useState } from 'react';

interface LeadFormProps {
  type: 'rent_inquiry' | 'sale_inquiry' | 'investment_inquiry' | 'investment_share_request' | 'general_inquiry';
  apartmentSlug?: string;
  apartmentTitle?: string;
  locale?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeadForm({
  type,
  apartmentSlug,
  apartmentTitle,
  locale = 'cs',
  onSuccess,
  onCancel,
}: LeadFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
    preferred_dates: '',
    guest_count: '',
    share_count: '',
    gdpr_consent: false,
    terms_accepted: false,
    marketing_consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Translations per design doc (calm, no exclamation marks)
  const t = locale === 'cs' ? {
    title: type === 'rent_inquiry' 
      ? 'Poptat termín' 
      : type === 'sale_inquiry' 
        ? 'Nezávazně poptat cenu'
        : type === 'investment_inquiry'
          ? 'Kontaktovat investiční tým'
          : type === 'investment_share_request'
            ? 'Získat nabídku podílů'
            : 'Kontaktujte nás',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    email: 'E-mail',
    phone: 'Telefon',
    message: 'Zpráva',
    preferredDates: 'Preferované termíny',
    guestCount: 'Počet hostů',
    shareCount: 'Orientační počet podílů',
    gdprConsent: 'Souhlasím se zpracováním osobních údajů',
    termsAccepted: 'Souhlasím s obchodními podmínkami',
    marketingConsent: 'Souhlasím se zasíláním novinek',
    submit: 'Odeslat poptávku',
    submitting: 'Odesílám...',
    successTitle: 'Děkujeme za váš zájem',
    successMessage: 'Vaše poptávka byla odeslána. Ozveme se vám co nejdříve.',
    close: 'Zavřít',
    optional: 'nepovinné',
  } : {
    title: type === 'rent_inquiry' 
      ? 'Inquire about dates' 
      : type === 'sale_inquiry' 
        ? 'Request price information'
        : type === 'investment_inquiry'
          ? 'Contact investment team'
          : type === 'investment_share_request'
            ? 'Request share offer'
            : 'Contact us',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    message: 'Message',
    preferredDates: 'Preferred Dates',
    guestCount: 'Number of Guests',
    shareCount: 'Estimated number of shares',
    gdprConsent: 'I agree to the processing of personal data',
    termsAccepted: 'I accept the terms and conditions',
    marketingConsent: 'I agree to receive news and updates',
    submit: 'Submit inquiry',
    submitting: 'Submitting...',
    successTitle: 'Thank you for your interest',
    successMessage: 'Your inquiry has been sent. We will contact you soon.',
    close: 'Close',
    optional: 'optional',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type: inputType } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          apartment_slug: apartmentSlug,
          apartment_title: apartmentTitle,
          source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          language: locale,
          ...formData,
          guest_count: formData.guest_count ? parseInt(formData.guest_count, 10) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nepodařilo se odeslat');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(locale === 'cs' ? 'Chyba připojení. Zkuste to prosím znovu.' : 'Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">{t.successTitle}</h3>
        <p className="text-slate-600 mb-6">{t.successMessage}</p>
        {(onSuccess || onCancel) && (
          <button
            onClick={onSuccess || onCancel}
            className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors"
          >
            {t.close}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-xl font-medium text-slate-900">{t.title}</h3>
      
      {apartmentTitle && (
        <div className="bg-slate-50 px-4 py-3 rounded border border-slate-200">
          <span className="text-slate-900">{apartmentTitle}</span>
        </div>
      )}

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.firstName} <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.lastName} <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t.email} <span className="text-amber-600">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Phone (optional) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t.phone} <span className="text-slate-400 text-xs">({t.optional})</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Rent-specific fields */}
      {type === 'rent_inquiry' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.preferredDates} <span className="text-slate-400 text-xs">({t.optional})</span>
            </label>
            <input
              type="text"
              name="preferred_dates"
              value={formData.preferred_dates}
              onChange={handleChange}
              placeholder={locale === 'cs' ? 'např. 15. 3. – 20. 3. 2025' : 'e.g. March 15-20, 2025'}
              className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t.guestCount} <span className="text-slate-400 text-xs">({t.optional})</span>
            </label>
            <input
              type="number"
              name="guest_count"
              value={formData.guest_count}
              onChange={handleChange}
              min="1"
              max="10"
              className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>
        </>
      )}

      {/* Share request-specific fields */}
      {type === 'investment_share_request' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t.shareCount} <span className="text-slate-400 text-xs">({t.optional})</span>
          </label>
          <input
            type="number"
            name="share_count"
            value={formData.share_count}
            onChange={handleChange}
            min="1"
            max="50"
            placeholder={locale === 'cs' ? '1–50 podílů' : '1–50 shares'}
            className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>
      )}
      )}

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {t.message} <span className="text-slate-400 text-xs">({t.optional})</span>
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
        />
      </div>

      {/* Consents */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="gdpr_consent"
            checked={formData.gdpr_consent}
            onChange={handleChange}
            required
            className="mt-0.5 w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-slate-600">
            {t.gdprConsent} <span className="text-amber-600">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="terms_accepted"
            checked={formData.terms_accepted}
            onChange={handleChange}
            required
            className="mt-0.5 w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-slate-600">
            {t.termsAccepted} <span className="text-amber-600">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="marketing_consent"
            checked={formData.marketing_consent}
            onChange={handleChange}
            className="mt-0.5 w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-slate-600">{t.marketingConsent}</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-700 text-sm bg-red-50 px-4 py-3 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors"
          >
            {locale === 'cs' ? 'Zrušit' : 'Cancel'}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`flex-1 px-4 py-2.5 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            !onCancel ? 'w-full' : ''
          }`}
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </div>
    </form>
  );
}
