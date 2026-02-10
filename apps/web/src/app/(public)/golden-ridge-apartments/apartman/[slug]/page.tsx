/**
 * Apartment Detail (Rent) - Design Checklist 2030
 * 
 * - Fotografie fullscreen
 * - Cena sekundární
 * - CTA klidné
 * - Technické údaje jako metadata
 * - Žádné tabulky
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { getApartmentBySlug } from '@/lib/apartments';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const apartment = getApartmentBySlug(params.slug);
  if (!apartment) return { title: 'Apartmán nenalezen' };
  return {
    title: `${apartment.title} | Pronájem | Pod Zlatým návrším`,
    description: apartment.description,
  };
}

export default async function RentApartmentDetailPage({ params }: PageProps) {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  
  const apartment = getApartmentBySlug(params.slug);
  if (!apartment || apartment.mode !== 'rent') notFound();

  const t = locale === 'cs' ? {
    back: 'Zpět na přehled',
    area: 'Plocha',
    rooms: 'Místnosti',
    capacity: 'Kapacita',
    persons: 'osob',
    priceFrom: 'Cena od',
    perNight: 'za noc',
    amenities: 'Vybavení',
    cta: 'Poptat termín',
    ctaSubtext: 'Odpovíme do 24 hodin',
  } : {
    back: 'Back to overview',
    area: 'Area',
    rooms: 'Rooms',
    capacity: 'Capacity',
    persons: 'persons',
    priceFrom: 'Price from',
    perNight: 'per night',
    amenities: 'Amenities',
    cta: 'Inquire availability',
    ctaSubtext: 'We respond within 24 hours',
  };

  return (
    <>
      {/* Hero Image - Fullscreen */}
      <section className="relative h-[70vh] bg-navy">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-400" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
        
        {/* Back link */}
        <div className="absolute top-32 left-6 z-10">
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="text-white/60 text-sm hover:text-white transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.back}
          </Link>
        </div>
        
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
              {apartment.title}
            </h1>
            <p className="text-white/60 text-lg">
              {apartment.area} m² · {apartment.rooms} {t.rooms.toLowerCase()}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16">
            
            {/* Main content */}
            <div className="lg:col-span-2 space-y-16">
              
              {/* Description */}
              <div>
                <p className="text-lg text-navy/70 leading-relaxed">
                  {apartment.description || 'Luxusní apartmán s výhledem na hory. Plně vybavený pro komfortní pobyt v Krkonoších.'}
                </p>
              </div>

              {/* Specs - as metadata, not table */}
              <div className="grid grid-cols-3 gap-8 py-8 border-t border-b border-navy/10">
                <div>
                  <p className="text-sm text-navy/40 mb-2">{t.area}</p>
                  <p className="text-2xl font-light text-navy">{apartment.area} m²</p>
                </div>
                <div>
                  <p className="text-sm text-navy/40 mb-2">{t.rooms}</p>
                  <p className="text-2xl font-light text-navy">{apartment.rooms}</p>
                </div>
                <div>
                  <p className="text-sm text-navy/40 mb-2">{t.capacity}</p>
                  <p className="text-2xl font-light text-navy">{apartment.capacity || 4} {t.persons}</p>
                </div>
              </div>

              {/* Amenities - simple list */}
              {apartment.amenities && apartment.amenities.length > 0 && (
                <div>
                  <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.amenities}</h2>
                  <div className="flex flex-wrap gap-3">
                    {apartment.amenities.map((amenity, i) => (
                      <span key={i} className="px-4 py-2 bg-stone text-navy/70 text-sm">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - CTA */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-white p-8 border border-navy/10">
                <div className="mb-8">
                  <p className="text-sm text-navy/40 mb-2">{t.priceFrom}</p>
                  <p className="text-3xl font-light text-navy">
                    {apartment.priceFrom?.toLocaleString()} Kč
                    <span className="text-lg text-navy/50 ml-2">{t.perNight}</span>
                  </p>
                </div>
                
                <Link 
                  href={`/kontakt?apartment=${apartment.slug}`}
                  className="block w-full py-4 bg-gold text-navy text-center text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors mb-4"
                >
                  {t.cta}
                </Link>
                
                <p className="text-sm text-navy/40 text-center">
                  {t.ctaSubtext}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
