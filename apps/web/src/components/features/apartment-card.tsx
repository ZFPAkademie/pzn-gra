'use client';

/**
 * Apartment Card Component
 * Sprint 1: Single apartment preview per SPRINT_1_PLAN.md §5.2
 */

import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { useLanguage } from '@/components/providers/language-provider';

export interface ApartmentCardData {
  id: string;
  number: number;
  name: string;
  slug: string;
  description: string;
  photos: string[];
  capacity?: number;
  priceFrom?: number;
}

interface ApartmentCardProps {
  apartment: ApartmentCardData;
}

export function ApartmentCard({ apartment }: ApartmentCardProps) {
  const { t } = useLanguage();

  return (
    <Link href={`/golden-ridge-apartments/apartman/${apartment.slug}`} className="block group">
      <Card hover className="h-full overflow-hidden">
        {/* Image */}
        <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
          {apartment.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={apartment.photos[0]}
              alt={apartment.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-stone-500">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Price badge */}
          {apartment.priceFrom && (
            <Badge variant="highlight" className="absolute top-3 right-3">
              {t('common.priceFrom')} €{apartment.priceFrom}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-navy mb-1 group-hover:text-slate-700">
            {apartment.name}
          </h3>
          
          {apartment.capacity && (
            <p className="text-sm text-slate-500 mb-2">
              {t('rental.capacity', { count: apartment.capacity.toString() })}
            </p>
          )}
          
          <p className="text-stone-700 text-sm line-clamp-2">
            {apartment.description}
          </p>

          <div className="mt-4 flex items-center text-sm font-medium text-sky-600 group-hover:text-sky-700">
            {t('rental.viewApartment')}
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  );
}
