'use client';

/**
 * Apartment Grid Component
 * Sprint 1: Listing grid per SPRINT_1_PLAN.md §5.2
 */

import { ApartmentCard, ApartmentCardData } from './apartment-card';
import { useLanguage } from '@/components/providers/language-provider';

interface ApartmentGridProps {
  apartments: ApartmentCardData[];
}

export function ApartmentGrid({ apartments }: ApartmentGridProps) {
  const { t } = useLanguage();

  if (apartments.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-stone-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-slate-500">
          {t('rental.availableCount', { count: '0' })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-stone-700 mb-6">
        {t('rental.availableCount', { count: apartments.length.toString() })}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apartments.map((apartment) => (
          <ApartmentCard key={apartment.id} apartment={apartment} />
        ))}
      </div>
    </div>
  );
}
