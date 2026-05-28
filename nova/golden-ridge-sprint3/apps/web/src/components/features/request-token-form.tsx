'use client';

/**
 * RequestTokenForm Component
 * Allows guests to request a new access token when their token has expired
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RequestTokenFormProps {
  locale?: 'cs' | 'en';
  className?: string;
}

export function RequestTokenForm({
  locale = 'cs',
  className,
}: RequestTokenFormProps) {
  const [email, setEmail] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    title: locale === 'cs' ? 'Požádat o nový přístup' : 'Request New Access',
    description: locale === 'cs' 
      ? 'Váš přístupový odkaz vypršel. Zadejte své údaje a my vám zašleme nový.'
      : 'Your access link has expired. Enter your details and we will send you a new one.',
    email: locale === 'cs' ? 'E-mail' : 'Email',
    emailPlaceholder: locale === 'cs' ? 'Váš e-mail z rezervace' : 'Your booking email',
    referenceNumber: locale === 'cs' ? 'Číslo rezervace' : 'Reference Number',
    referenceNumberPlaceholder: 'GR-XXXXXXXX-XXXX',
    submit: locale === 'cs' ? 'Odeslat nový odkaz' : 'Send New Link',
    submitting: locale === 'cs' ? 'Odesílám...' : 'Sending...',
    success: locale === 'cs' 
      ? 'Pokud existuje rezervace s těmito údaji, nový přístupový odkaz byl odeslán na váš e-mail.'
      : 'If a reservation exists with these details, a new access link has been sent to your email.',
    error: locale === 'cs' 
      ? 'Nepodařilo se odeslat požadavek. Zkuste to prosím znovu.'
      : 'Failed to send request. Please try again.',
    invalidEmail: locale === 'cs' ? 'Neplatný e-mail' : 'Invalid email',
    invalidReference: locale === 'cs' 
      ? 'Neplatné číslo rezervace (formát: GR-XXXXXXXX-XXXX)'
      : 'Invalid reference number (format: GR-XXXXXXXX-XXXX)',
    backToHome: locale === 'cs' ? 'Zpět na hlavní stránku' : 'Back to homepage',
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateReference = (reference: string): boolean => {
    return /^GR-\d{8}-[A-Z0-9]{4}$/i.test(reference);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email
    if (!validateEmail(email)) {
      setError(labels.invalidEmail);
      return;
    }
    
    // Validate reference number
    if (!validateReference(referenceNumber)) {
      setError(labels.invalidReference);
      return;
    }
    
    setSending(true);
    
    try {
      const response = await fetch('/api/v1/bookings/request-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          referenceNumber: referenceNumber.trim().toUpperCase(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok && response.status !== 200) {
        throw new Error(data.error || labels.error);
      }
      
      // Always show success to prevent email enumeration
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setSending(false);
    }
  };

  // Success state
  if (sent) {
    return (
      <div className={cn('max-w-md mx-auto', className)}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {locale === 'cs' ? 'Zkontrolujte svůj e-mail' : 'Check your email'}
          </h2>
          <p className="text-gray-600 mb-6">{labels.success}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {labels.backToHome}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-md mx-auto', className)}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{labels.title}</h1>
          </div>
          <p className="text-gray-600">{labels.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.email}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder={labels.emailPlaceholder}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                error?.includes('mail') ? 'border-red-300' : 'border-gray-300'
              )}
              required
            />
          </div>

          {/* Reference number field */}
          <div>
            <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
              {labels.referenceNumber}
            </label>
            <input
              type="text"
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => {
                setReferenceNumber(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder={labels.referenceNumberPlaceholder}
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm text-sm font-mono',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                error?.includes('reference') || error?.includes('rezervace') 
                  ? 'border-red-300' 
                  : 'border-gray-300'
              )}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {locale === 'cs' 
                ? 'Najdete ho v potvrzovacím e-mailu'
                : 'Find it in your confirmation email'
              }
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={sending}
            className={cn(
              'w-full py-3 px-4 rounded-md font-medium text-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              sending
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {sending ? labels.submitting : labels.submit}
          </button>
        </form>

        {/* Back link */}
        <div className="px-6 pb-6">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {labels.backToHome}
          </a>
        </div>
      </div>
    </div>
  );
}

export default RequestTokenForm;
