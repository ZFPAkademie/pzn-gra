/**
 * Apartmán na prodej - Detail page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getApartmentBySlugDB, getSalesManager, localizeApartment, layoutLabel } from '@/lib/apartments';
import { getRequestLocale } from '@/lib/i18n-server';
import { getApartmentImages } from '@/data/apartment-images';
import { ApartmentGallery } from '@/components/features/apartment-gallery';
import { SaleInfoBoxes, RealEstateProductBadge } from '@/components/features/sale-info-boxes';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getRequestLocale();
  const raw = await getApartmentBySlugDB(params.slug);
  if (!raw) return { title: locale === 'en' ? 'Apartment not found' : 'Apartmán nenalezen' };
  const apt = localizeApartment(raw, locale);

  return {
    title: `${apt.title} | ${locale === 'en' ? 'For sale' : 'Na prodej'} | Pod Zlatým návrším`,
    description: apt.description ?? undefined,
  };
}

/** Podlaží: CZ „2. NP“, EN britsky (1. NP = ground floor, 2. NP = 1st floor) */
function floorLabel(floor: number, locale: 'cs' | 'en'): string {
  if (locale !== 'en') return `${floor}. NP`;
  if (floor === 1) return 'Ground floor';
  const n = floor - 1;
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix} floor`;
}

export default async function SaleApartmentDetailPage({ params }: Props) {
  const locale = getRequestLocale();
  const en = locale === 'en';
  const raw = await getApartmentBySlugDB(params.slug);
  const manager = getSalesManager();
  const images = await getApartmentImages(params.slug);

  if (!raw || !raw.for_sale) {
    notFound();
  }

  const apt = localizeApartment(raw, locale);
  const totalArea = apt.area_m2 ? apt.area_m2.toLocaleString(en ? 'en-GB' : 'cs-CZ') + ' m²' : '—';
  // Plochy místností jsou v DB jako text „6,25 m²“ — pro EN desetinná tečka
  const roomArea = (v: string) => (en ? v.replace(/(\d),(\d)/g, '$1.$2') : v);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/suites"
            className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {en ? 'Back to overview' : 'Zpět na přehled'}
          </Link>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-4 py-2 bg-gold text-navy text-xs uppercase tracking-widest">
              {en ? 'For sale' : 'Na prodej'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            {apt.title}
          </h1>
          <p className="text-xl text-white/50">{apt.subtitle}</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16">

            {/* Left: Details */}
            <div className="lg:col-span-2">
              {/* Gallery */}
              <div className="mb-16">
                <ApartmentGallery images={images} title={apt.title ?? ''} />
              </div>

              {/* Info Boxes - Standards & Investment */}
              <SaleInfoBoxes showRealEstateProduct={false} locale={locale} />

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Total area' : 'Celková plocha'}</p>
                  <p className="text-2xl font-light text-navy">{totalArea}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Layout' : 'Dispozice'}</p>
                  <p className="text-2xl font-light text-navy">{apt.layout != null ? layoutLabel(apt.layout, locale) : '—'}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Floor' : 'Patro'}</p>
                  <p className="text-2xl font-light text-navy">{apt.floor != null ? floorLabel(apt.floor, locale) : '—'}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Aspect' : 'Orientace'}</p>
                  <p className="text-2xl font-light text-navy">{apt.orientation ?? '—'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-16">
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{en ? 'About the apartment' : 'O apartmánu'}</h2>
                <p className="text-navy/70 leading-relaxed text-lg whitespace-pre-line">
                  {apt.description}
                </p>
              </div>

              {/* Room breakdown */}
              {apt.rooms && (
                <div className="mb-16">
                  <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{en ? 'Room breakdown' : 'Členění'}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone p-6">
                      <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Entrance hall' : 'Vstupní hala'}</p>
                      <p className="text-xl text-navy">{roomArea(apt.rooms.hall)}</p>
                    </div>
                    <div className="bg-stone p-6">
                      <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Bathroom' : 'Koupelna'}</p>
                      <p className="text-xl text-navy">{roomArea(apt.rooms.bathroom)}</p>
                    </div>
                    {apt.rooms.bedroom && (
                      <div className="bg-stone p-6">
                        <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Bedroom' : 'Ložnice'}</p>
                        <p className="text-xl text-navy">{roomArea(apt.rooms.bedroom)}</p>
                      </div>
                    )}
                    <div className="bg-stone p-6">
                      <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{en ? 'Living room with kitchen' : 'Pokoj s kuchyní'}</p>
                      <p className="text-xl text-navy">{roomArea(apt.rooms.livingKitchen)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              {apt.features && apt.features.length > 0 && (
                <div>
                  <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{en ? 'Features' : 'Vybavení'}</h2>
                  <div className="flex flex-wrap gap-3">
                    {apt.features.map((feature, i) => (
                      <span key={i} className="px-4 py-2 bg-stone text-navy text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Contact Card */}
            <div className="lg:col-span-1">
              <div className="bg-navy p-8 sticky top-28">
                <p className="text-gold text-sm tracking-widest uppercase mb-4">{en ? 'Price' : 'Cena'}</p>
                <p className="text-3xl font-light text-white mb-8">{en ? 'On request' : 'Na dotaz'}</p>

                <div className="border-t border-white/10 pt-8 mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                      <Image
                        src={manager.photo}
                        alt={manager.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium">{manager.name}</p>
                      <p className="text-white/50 text-sm">{en ? 'Sales Manager' : manager.title}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <a
                      href={`tel:${manager.phone.replace(/\s/g, '')}`}
                      className="flex items-center justify-center w-full py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {manager.phone}
                    </a>
                    <a
                      href={`mailto:${manager.email}?subject=${en ? 'Enquiry about' : 'Zájem o'} ${apt.title}`}
                      className="flex items-center justify-center w-full py-4 border border-white/20 text-white text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      {en ? 'Send an email' : 'Napsat e-mail'}
                    </a>
                  </div>
                </div>

                <p className="text-white/30 text-xs text-center">
                  {en ? 'We will be happy to answer all your questions and arrange a viewing.' : 'Rádi vám zodpovíme všechny dotazy a domluvíme prohlídku.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other apartments */}
      <section className="py-16 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">
            {en ? 'Take a look at the other available apartments' : 'Prohlédněte si další dostupné apartmány'}
          </p>
          <Link
            href="/suites"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            {en ? 'All apartments for sale' : 'Všechny apartmány na prodej'}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
