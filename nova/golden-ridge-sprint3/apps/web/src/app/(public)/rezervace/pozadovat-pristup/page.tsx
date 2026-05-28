'use client';

/**
 * Request Token Page
 * /rezervace/pozadovat-pristup
 * 
 * Allows guests to request a new access token
 */

import { RequestTokenForm } from '@/components/features';

export default function RequestTokenPage() {
  // Simple language detection from URL or default
  const locale = typeof window !== 'undefined' && window.location.pathname.startsWith('/en') 
    ? 'en' 
    : 'cs';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <RequestTokenForm locale={locale} />
    </div>
  );
}
