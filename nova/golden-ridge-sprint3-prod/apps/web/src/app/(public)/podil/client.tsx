/**
 * Share Request Form - Inline version for /podil page
 */

'use client';

import { useState, useEffect } from 'react';

interface GeoData {
  country?: string;
  city?: string;
  region?: string;
  postal?: string;
}

export function ShareRequestForm({ locale = 'cs' }: { locale?: string }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shareCount: '',
    message: '',
    postalCode: '',
  });
  const [geoData, setGeoData] = useState<GeoData>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Fetch IP geolocation on mount
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setGeoData({
          country: data.country_name,
          city: data.city,
          region: data.region,
          postal: data.postal,
        });
        if (data.postal) {
          setFormData(prev => ({ ...prev, postalCode: data.postal }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'investment_share_request',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          share_count: formData.shareCount ? parseInt(formData.shareCount) : null,
          metadata: {
            geo: {
              ...geoData,
              postal: formData.postalCode || geoData.postal,
            },
            source: 'podil',
            apartment: 'chata-1-suite-7',
            locale,
          },
        }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const t = locale === 'cs' ? {
    name: 'Jméno a příjmení',
    email: 'E-mail',
    phone: 'Telefon',
    shares: 'Předpokládaný počet podílů',
    sharesPlaceholder: 'např. 5',
    postalCode: 'PSČ',
    postalCodePlaceholder: 'např. 664 62',
    message: 'Poznámka',
    messagePlaceholder: 'Vaše dotazy nebo požadavky...',
    submit: 'Odeslat poptávku',
    sending: 'Odesílám...',
    success: 'Děkujeme za váš zájem! Ozveme se vám co nejdříve.',
    error: 'Něco se pokazilo. Zkuste to prosím znovu.',
  } : {
    name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    shares: 'Expected number of shares',
    sharesPlaceholder: 'e.g. 5',
    postalCode: 'Postal code',
    postalCodePlaceholder: 'e.g. 664 62',
    message: 'Note',
    messagePlaceholder: 'Your questions or requirements...',
    submit: 'Send inquiry',
    sending: 'Sending...',
    success: 'Thank you for your interest! We will contact you soon.',
    error: 'Something went wrong. Please try again.',
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12 bg-white border border-navy/10 p-10">
        <svg className="w-16 h-16 text-gold mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-navy text-lg">{t.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-navy/10 p-10 space-y-6">
      {/* Name */}
      <div>
        <label className="block text-xs text-navy/40 uppercase tracking-widest mb-2">
          {t.name} *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-transparent border-b border-navy/20 py-3 text-navy focus:border-gold focus:outline-none transition-colors"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs text-navy/40 uppercase tracking-widest mb-2">
          {t.email} *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-transparent border-b border-navy/20 py-3 text-navy focus:border-gold focus:outline-none transition-colors"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs text-navy/40 uppercase tracking-widest mb-2">
          {t.phone}
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full bg-transparent border-b border-navy/20 py-3 text-navy focus:border-gold focus:outline-none transition-colors"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Postal Code */}
        <div>
          <label className="block text-xs text-navy/40 uppercase tracking-widest mb-2">
            {t.postalCode}
          </label>
          <input
            type="text"
            placeholder={t.postalCodePlaceholder}
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            className="w-full bg-transparent border-b border-navy/20 py-3 text-navy focus:border-gold focus:outline-none transition-colors"
          />
        </div>

        {/* Share count */}
        <div>
          <label className="block text-xs text-navy/40 uppercase tracking-widest mb-2">
            {t.shares}
          </label>
          <input
            type="number"
            min="1"
            max="50"
            placeholder={t.sharesPlaceholder}
            value={formData.shareCount}
            onChange={(e) => setFormData({ ...formData, shareCount: e.target.value })}
            className="w-full bg-transparent border-b border-navy/20 py-3 text-navy focus:border-gold focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs text-navy/40 uppercase tracking-widest mb-2">
          {t.message}
        </label>
        <textarea
          rows={3}
          placeholder={t.messagePlaceholder}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full bg-transparent border-b border-navy/20 py-3 text-navy focus:border-gold focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Error */}
      {status === 'error' && (
        <p className="text-red-600 text-sm">{t.error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-4 bg-navy text-white text-sm tracking-widest uppercase hover:bg-gold hover:text-navy transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? t.sending : t.submit}
      </button>
    </form>
  );
}
