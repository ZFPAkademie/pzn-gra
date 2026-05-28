'use client';

/**
 * Token Page
 * /rezervace/[token]
 * 
 * Guest access page for viewing reservation details
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GuestTokenPage, RequestTokenForm } from '@/components/features';
import type { TokenPageResponse } from '@/types/booking';

export default function TokenPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [data, setData] = useState<TokenPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detect language from reservation or default
  const locale = data?.reservation?.language || 'cs';

  const [rateLimited, setRateLimited] = useState(false);

  const labels = {
    loading: locale === 'cs' ? 'Načítám rezervaci...' : 'Loading reservation...',
    invalid: locale === 'cs' ? 'Neplatný přístupový odkaz' : 'Invalid access link',
    invalidDescription: locale === 'cs' 
      ? 'Tento odkaz není platný nebo byl zrušen.'
      : 'This link is not valid or has been revoked.',
    expired: locale === 'cs' ? 'Přístupový odkaz vypršel' : 'Access link expired',
    expiredDescription: locale === 'cs'
      ? 'Váš přístupový odkaz již není platný. Můžete požádat o nový.'
      : 'Your access link is no longer valid. You can request a new one.',
    rateLimited: locale === 'cs' ? 'Příliš mnoho požadavků' : 'Too many requests',
    rateLimitedDescription: locale === 'cs'
      ? 'Prosím počkejte chvíli a zkuste to znovu.'
      : 'Please wait a moment and try again.',
    error: locale === 'cs' ? 'Došlo k chybě' : 'An error occurred',
    retry: locale === 'cs' ? 'Zkusit znovu' : 'Try again',
    backHome: locale === 'cs' ? 'Zpět na hlavní stránku' : 'Back to homepage',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/v1/bookings/${token}`);
        
        // Handle rate limiting
        if (response.status === 429) {
          setRateLimited(true);
          setLoading(false);
          return;
        }
        
        const result = await response.json();
        
        setData(result);
        
        if (!response.ok && response.status !== 410) {
          setError(result.message || labels.invalid);
        }
      } catch (err) {
        setError(labels.error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, labels.invalid, labels.error]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{labels.loading}</p>
        </div>
      </div>
    );
  }

  // Rate limited state
  if (rateLimited) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.rateLimited}</h1>
          <p className="text-gray-600 mb-6">{labels.rateLimitedDescription}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setRateLimited(false);
                setLoading(true);
                window.location.reload();
              }}
              className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {labels.retry}
            </button>
            <a
              href="/"
              className="block text-gray-600 hover:text-gray-900"
            >
              {labels.backHome}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Expired token - show request new token form
  if (data?.expired) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.expired}</h1>
          <p className="text-gray-600">{labels.expiredDescription}</p>
        </div>
        
        <RequestTokenForm locale={locale} />
      </div>
    );
  }

  // Invalid token
  if (!data?.valid || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.invalid}</h1>
          <p className="text-gray-600 mb-6">{error || labels.invalidDescription}</p>
          
          <div className="space-y-3">
            <a
              href="/rezervace/pozadovat-pristup"
              className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {locale === 'cs' ? 'Požádat o nový odkaz' : 'Request new link'}
            </a>
            <a
              href="/"
              className="block text-gray-600 hover:text-gray-900"
            >
              {labels.backHome}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show reservation page
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <GuestTokenPage
        token={token}
        data={data}
        locale={locale}
      />
    </div>
  );
}
