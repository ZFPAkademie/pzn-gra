/**
 * Apartment Detail (Sale) - Design Checklist 2030
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
    title: `${apartment.title} | Prodej | Pod Zlatým návrším`,
    description: apartment.description,
  };
}

export default async function SaleApartmentDetailPage({ params }: PageProps) {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  
  const apartment = getApartmentBySlug(params.slug);
  if (!apartment || apartment.mode !== 'sale') notFound();

  const t = locale === 'cs' ? {
    back: 'Zpět na přehled',
    area: 'Plocha',
    rooms: 'Místnosti',
    floor: 'Podlaží',
    price: 'Cena',
    priceOnRequest: 'Na vyžádání',
    amenities: 'Vybavení',
    cta: 'Nezávazně poptat',
    ctaSubtext: 'Diskrétní jednání zaručeno',
    benefits: 'Výhody vlastnictví',
    benefit1: 'Vlastní využití kdykoliv',
    benefit2: 'Možnost pronájmu',
    benefit3: 'Stabilní zhodnocení',
  } : {
    back: 'Back to overview',
    area: 'Area',
    rooms: 'Rooms',
    floor: 'Floor',
    price: 'Price',
    priceOnRequest: 'On request',
    amenities: 'Amenities',
    cta: 'Inquire',
    ctaSubtext: 'Discretion guaranteed',
    benefits: 'Ownership benefits',
    benefit1: 'Personal use anytime',
    benefit2: 'Rental opportunity',
    benefit3: 'Stable appreciation',
  };

  return (
    <>
      {/* Hero Image */}
      <section className="relative h-[70vh] bg-navy">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-400" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
        
        <div className="absolute top-32 left-6 z-10">
          <Link 
            href="/apartmany-prodej"
            className="text-white/60 text-sm hover:text-white transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.back}
          </Link>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-4">
              {locale === 'cs' ? 'Na prodej' : 'For sale'}
            </p>
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
            
            <div className="lg:col-span-2 space-y-16">
              
              <div>
                <p className="text-lg text-navy/70 leading-relaxed">
                  {apartment.description || 'Exkluzivní investiční příležitost v prémiové horské lokalitě. Apartmán s vysokým standardem vybavení a potenciálem stabilního zhodnocení.'}
                </p>
              </div>

              {/* Specs */}
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
                  <p className="text-sm text-navy/40 mb-2">{t.price}</p>
                  <p className="text-2xl font-light text-navy">{t.priceOnRequest}</p>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-8">{t.benefits}</h2>
                <div className="space-y-4">
                  {[t.benefit1, t.benefit2, t.benefit3].map((benefit, i) => (
                    <div key={i} className="flex items-center text-navy/70">
                      <span className="w-8 h-px bg-gold mr-4" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-navy p-8">
                <p className="text-white/50 text-sm mb-8">
                  {locale === 'cs' 
                    ? 'Cena a podmínky prodeje na vyžádání. Zajistíme diskrétní jednání.'
                    : 'Price and terms available on request. We ensure discreet negotiations.'}
                </p>
                
                <Link 
                  href={`/kontakt?apartment=${apartment.slug}&type=sale`}
                  className="block w-full py-4 bg-gold text-navy text-center text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors mb-4"
                >
                  {t.cta}
                </Link>
                
                <p className="text-sm text-white/30 text-center">
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
