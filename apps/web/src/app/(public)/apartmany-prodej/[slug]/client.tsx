/**
 * Sale Detail CTA Client Component
 * Opens lead form modal for sale inquiry
 * 
 * CTA: "Nezávazně poptat cenu" (per design doc)
 */

'use client';

import { useState } from 'react';
import { LeadForm } from '@/components/features/lead-form';

interface SaleDetailCTAProps {
  apartment: {
    slug: string;
    title: string;
  };
  locale: string;
}

export function SaleDetailCTA({ apartment, locale }: SaleDetailCTAProps) {
  const [showForm, setShowForm] = useState(false);

  const label = locale === 'cs' ? 'Nezávazně poptat cenu' : 'Request price information';

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-3 px-6 bg-amber-500 text-slate-900 font-medium rounded hover:bg-amber-400 transition-colors"
      >
        {label}
      </button>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <LeadForm
                type="sale_inquiry"
                apartmentSlug={apartment.slug}
                apartmentTitle={apartment.title}
                locale={locale}
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
