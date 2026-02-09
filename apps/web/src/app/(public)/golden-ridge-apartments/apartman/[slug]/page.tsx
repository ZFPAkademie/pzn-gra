/**
 * Rent Apartment Detail Page
 * Production v1: Static detail with CTA panel
 * 
 * URL: /golden-ridge-apartments/apartman/[slug]
 * 
 * CTA: "Poptat termín" (per design doc)
 * NO disabled booking text
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { 
  getApartmentBySlug, 
  formatAreaDisplay, 
  formatPriceDisplay,
  getApartmentDisplayName,
  getCTALabel,
} from '@/lib/apartments';
import { RentDetailCTA } from './client';

// Force dynamic rendering (uses cookies for locale)
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const apartment = getApartmentBySlug(params.slug);
  
  if (!apartment || apartment.mode !== 'rent') {
    return { title: 'Apartmán nenalezen' };
  }

  return {
    title: `${apartment.title} | Pronájem | Pod Zlatým návrším`,
    description: `${apartment.title} - ${formatAreaDisplay(apartment.m2.total)}. Luxusní apartmán k pronájmu ve Špindlerově Mlýně.`,
  };
}

export default async function RentApartmentDetailPage({ params }: PageProps) {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const apartment = getApartmentBySlug(params.slug);

  if (!apartment || apartment.mode !== 'rent') {
    notFound();
  }

  const displayName = getApartmentDisplayName(apartment, locale);

  const t = locale === 'cs' ? {
    back: 'Zpět na apartmány',
    badge: 'Pronájem',
    priceLabel: 'Cena',
    areaLabel: 'Plocha',
    roomsLabel: 'Místnosti',
    buildingLabel: 'Budova',
    layoutTitle: 'Rozdělení ploch',
    total: 'Celkem',
    amenitiesTitle: 'Vybavení',
    amenities: ['Wi-Fi', 'Parkování', 'Vybavená kuchyně', 'Smart TV', 'Pračka', 'Výhled na hory'],
    locationTitle: 'Lokalita',
    locationText: 'Apartmán se nachází v centru Špindlerova Mlýna, v těsné blízkosti skiareálu a turistických tras.',
    locationLink: 'Více o lokalitě',
  } : {
    back: 'Back to apartments',
    badge: 'Rent',
    priceLabel: 'Price',
    areaLabel: 'Area',
    roomsLabel: 'Rooms',
    buildingLabel: 'Building',
    layoutTitle: 'Area breakdown',
    total: 'Total',
    amenitiesTitle: 'Amenities',
    amenities: ['Wi-Fi', 'Parking', 'Equipped kitchen', 'Smart TV', 'Washing machine', 'Mountain view'],
    locationTitle: 'Location',
    locationText: 'The apartment is located in the center of Špindlerův Mlýn, close to the ski resort and hiking trails.',
    locationLink: 'More about location',
  };

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-stone py-4">
        <div className="max-w-6xl mx-auto px-6">
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem" 
            className="text-sm text-stone-700 hover:text-navy transition-colors"
          >
            ← {t.back}
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left: Images & Info (3 cols) */}
            <div className="lg:col-span-3">
              {/* Main image placeholder */}
              <div className="aspect-[4/3] bg-stone rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-stone-400">
                  <svg className="w-20 h-20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
                  </svg>
                </div>
              </div>

              {/* Thumbnail placeholders */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-stone rounded" />
                ))}
              </div>

              {/* Room breakdown */}
              <div className="mt-12">
                <h2 className="text-xl font-medium text-navy mb-6">{t.layoutTitle}</h2>
                <div className="space-y-3">
                  {apartment.m2.breakdown.map((room, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-stone-700">{room.room}</span>
                      <span className="font-medium text-navy">{room.m2.toFixed(2)} m²</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-navy">{t.total}</span>
                    <span className="font-medium text-navy">{apartment.m2.total.toFixed(2)} m²</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-12">
                <h2 className="text-xl font-medium text-navy mb-6">{t.amenitiesTitle}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {t.amenities.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-stone rounded">
                      <span className="text-stone-500">✓</span>
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: CTA Panel (2 cols) */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 bg-white border border-stone-300 rounded-lg p-6 shadow-sm">
                {/* Badge */}
                <span className="inline-block bg-stone text-slate-700 text-xs font-medium px-2.5 py-1 rounded mb-4">
                  {t.badge}
                </span>
                
                {/* Title */}
                <h1 className="text-2xl font-medium text-navy mb-4">
                  {displayName}
                </h1>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-sm text-slate-500 mb-1">{t.priceLabel}</div>
                  <div className="text-2xl font-medium text-navy">
                    {formatPriceDisplay(apartment, locale)}
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-100">
                  <div>
                    <div className="text-sm text-slate-500">{t.areaLabel}</div>
                    <div className="font-medium text-navy">{formatAreaDisplay(apartment.m2.total)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">{t.roomsLabel}</div>
                    <div className="font-medium text-navy">{apartment.m2.breakdown.length}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-slate-500">{t.buildingLabel}</div>
                    <div className="font-medium text-navy">{apartment.building}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <RentDetailCTA 
                  apartment={{ slug: apartment.slug, title: displayName }}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-12 md:py-16 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-xl font-medium text-navy mb-4">{t.locationTitle}</h2>
            <p className="text-stone-700 mb-4">{t.locationText}</p>
            <Link 
              href="/lokalita"
              className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
            >
              {t.locationLink}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
