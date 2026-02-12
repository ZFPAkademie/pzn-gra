/**
 * Share Request CTA Client Component
 * Modal with form including IP geolocation
 */

'use client';

import { useState, useEffect } from 'react';

interface ShareRequestCTAProps {
  locale?: string;
  variant?: 'dark' | 'light';
}

interface GeoData {
  country?: string;
  city?: string;
  region?: string;
  postal?: string;
}

export function ShareRequestCTA({ locale = 'cs', variant = 'dark' }: ShareRequestCTAProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shareCount: '',
    message: '',
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
      })
      .catch(() => {
        // Fallback - no geolocation
      });
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
            geo: geoData,
            source: 'nemovitostni-produkt',
            locale,
          },
        }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          setShowModal(false);
          setStatus('idle');
          setFormData({ name: '', email: '', phone: '', shareCount: '', message: '' });
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const buttonClasses = variant === 'dark'
    ? 'px-8 py-4 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors'
    : 'px-8 py-4 bg-white text-navy text-sm tracking-widest uppercase hover:bg-white/90 transition-colors';

  const t = locale === 'cs' ? {
    cta: 'Získat nabídku podílů',
    title: 'Nezávazná poptávka',
    subtitle: 'Zanechte nám kontakt a připravíme vám nabídku.',
    name: 'Jméno a příjmení',
    email: 'E-mail',
    phone: 'Telefon',
    shares: 'Předpokládaný počet podílů',
    sharesPlaceholder: 'např. 5',
    message: 'Poznámka',
    messagePlaceholder: 'Vaše dotazy nebo požadavky...',
    submit: 'Odeslat poptávku',
    sending: 'Odesílám...',
    success: 'Děkujeme! Ozveme se vám.',
    error: 'Něco se pokazilo. Zkuste to znovu.',
    close: 'Zavřít',
    location: 'Vaše lokalita',
  } : {
    cta: 'Get share offer',
    title: 'Non-binding inquiry',
    subtitle: 'Leave us your contact and we will prepare an offer.',
    name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    shares: 'Expected number of shares',
    sharesPlaceholder: 'e.g. 5',
    message: 'Note',
    messagePlaceholder: 'Your questions or requirements...',
    submit: 'Send inquiry',
    sending: 'Sending...',
    success: 'Thank you! We will contact you.',
    error: 'Something went wrong. Please try again.',
    close: 'Close',
    location: 'Your location',
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className={buttonClasses}>
        {t.cta}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-cream rounded-none shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-1 text-navy/40 hover:text-navy transition-colors"
              aria-label={t.close}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Form */}
            <div className="p-10">
              <h2 className="text-2xl font-light text-navy mb-2">{t.title}</h2>
              <p className="text-navy/50 text-sm mb-8">{t.subtitle}</p>

              {status === 'success' ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gold mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-navy">{t.success}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
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

                  {/* Geolocation indicator */}
                  {geoData.city && (
                    <div className="text-xs text-navy/30 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t.location}: {geoData.city}, {geoData.country}
                      {geoData.postal && ` (${geoData.postal})`}
                    </div>
                  )}

                  {/* Error */}
                  {status === 'error' && (
                    <p className="text-red-600 text-sm">{t.error}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-4 bg-navy text-white text-sm tracking-widest uppercase hover:bg-navy/90 transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? t.sending : t.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
