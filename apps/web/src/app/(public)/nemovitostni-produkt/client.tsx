/**
 * Share Request CTA Client Component
 * Modal trigger for investment share requests
 */

'use client';

import { useState } from 'react';
import { LeadForm } from '@/components/features/lead-form';

interface ShareRequestCTAProps {
  locale?: string;
  variant?: 'dark' | 'light';
}

export function ShareRequestCTA({ locale = 'cs', variant = 'dark' }: ShareRequestCTAProps) {
  const [showModal, setShowModal] = useState(false);

  const buttonClasses = variant === 'dark'
    ? 'px-8 py-3.5 bg-gold text-navy font-semibold rounded hover:bg-gold-400 transition-colors'
    : 'px-8 py-3.5 bg-gold text-navy font-semibold rounded hover:bg-gold-400 transition-colors';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={buttonClasses}
      >
        Získat nabídku podílů
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-stone-500 hover:text-stone-700 transition-colors"
              aria-label="Zavřít"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Form */}
            <div className="p-6">
              <LeadForm
                type="investment_share_request"
                locale={locale}
                onSuccess={() => setShowModal(false)}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
