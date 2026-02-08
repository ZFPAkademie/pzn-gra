'use client';

/**
 * Apartment Detail Component
 * Sprint 1: Full apartment view per SPRINT_1_PLAN.md §5.2
 */

import Link from 'next/link';
import { Container, Section, Badge, Button } from '@/components/ui';
import { PhotoGallery } from './photo-gallery';
import { useLanguage } from '@/components/providers/language-provider';

export interface ApartmentDetailData {
  id: string;
  number: number;
  name: string;
  slug: string;
  description: string;
  photos: string[];
  amenities: string[];
  capacity?: number;
  sizeSqm?: number;
  priceFrom?: number;
}

interface ApartmentDetailProps {
  apartment: ApartmentDetailData;
}

// Amenity labels (would come from translations in production)
const amenityLabels: Record<string, { cs: string; en: string }> = {
  wifi: { cs: 'Wi-Fi', en: 'Wi-Fi' },
  parking: { cs: 'Parkování', en: 'Parking' },
  kitchen: { cs: 'Kuchyně', en: 'Kitchen' },
  tv: { cs: 'TV', en: 'TV' },
  washer: { cs: 'Pračka', en: 'Washer' },
  terrace: { cs: 'Terasa', en: 'Terrace' },
  sauna: { cs: 'Sauna', en: 'Sauna' },
  fireplace: { cs: 'Krb', en: 'Fireplace' },
  garden: { cs: 'Zahrada', en: 'Garden' },
  workspace: { cs: 'Pracovní kout', en: 'Workspace' },
  dishwasher: { cs: 'Myčka', en: 'Dishwasher' },
  'kids-friendly': { cs: 'Vhodné pro děti', en: 'Kids friendly' },
};

export function ApartmentDetail({ apartment }: ApartmentDetailProps) {
  const { locale, t } = useLanguage();

  return (
    <>
      {/* Back link */}
      <Section className="py-4 border-b border-slate-200">
        <Container>
          <Link
            href="/golden-ridge-apartments"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.backToList')}
          </Link>
        </Container>
      </Section>

      {/* Photo Gallery */}
      <Section className="py-8">
        <Container>
          <PhotoGallery photos={apartment.photos} alt={apartment.name} />
        </Container>
      </Section>

      {/* Apartment Info */}
      <Section className="py-8">
        <Container>
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {apartment.name}
              </h1>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 mb-8">
                {apartment.capacity && (
                  <div className="flex items-center text-slate-600">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {t('rental.capacity', { count: apartment.capacity.toString() })}
                  </div>
                )}
                {apartment.sizeSqm && (
                  <div className="flex items-center text-slate-600">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {apartment.sizeSqm} m²
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  {t('rental.description')}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {apartment.description}
                </p>
              </div>

              {/* Amenities */}
              {apartment.amenities.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    {t('rental.amenities')}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {apartment.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center p-3 bg-slate-50 rounded-lg"
                      >
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-slate-700">
                          {amenityLabels[amenity]?.[locale] || amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Booking card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                {apartment.priceFrom && (
                  <div className="mb-6">
                    <span className="text-sm text-slate-500">{t('common.priceFrom')}</span>
                    <div className="text-3xl font-bold text-slate-900">
                      €{apartment.priceFrom}
                      <span className="text-base font-normal text-slate-500"> / {locale === 'cs' ? 'noc' : 'night'}</span>
                    </div>
                  </div>
                )}

                {/* Booking placeholder - Sprint 2 */}
                <div className="space-y-4">
                  <Badge variant="highlight" className="w-full justify-center py-2">
                    {t('rental.bookingComingSoon')}
                  </Badge>
                  
                  <p className="text-sm text-slate-500 text-center">
                    {locale === 'cs'
                      ? 'Online rezervace bude brzy dostupná. Zatím nás kontaktujte přímo.'
                      : 'Online booking coming soon. Please contact us directly for now.'}
                  </p>

                  <Link href="/kontakt" className="block">
                    <Button variant="primary" className="w-full">
                      {t('nav.contact')}
                    </Button>
                  </Link>
                </div>

                {/* Contact info */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">
                    {locale === 'cs' ? 'Máte dotazy?' : 'Have questions?'}
                  </p>
                  <a
                    href="tel:+420736242624"
                    className="flex items-center text-slate-900 hover:text-sky-600"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    +420 736 242 624
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
