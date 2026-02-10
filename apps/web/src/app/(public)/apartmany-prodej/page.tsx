/**
 * Apartmány na prodej - Design 2030 + Video
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { getLocaleFromCookie } from '@/lib/i18n';
import { getSaleApartments } from '@/lib/apartments';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apartmány na prodej | Pod Zlatým návrším',
  description: 'Luxusní apartmány na prodej v Krkonoších, přímo u lanovky.',
};

export default async function SaleApartmentsPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const apartments = getSaleApartments();

  const t = locale === 'cs' ? {
    tagline: 'Investiční příležitost',
    title: 'Apartmány na prodej',
    subtitle: 'Prémiové apartmány v nejžádanější horské lokalitě České republiky',
    rooms: 'místností',
    view: 'Nezávazná poptávka',
    priceOnRequest: 'Cena na vyžádání',
    videoTitle: 'Prohlídka projektu',
    contact: 'Kontaktovat nás',
    contactText: 'Máte zájem o více informací?',
  } : {
    tagline: 'Investment opportunity',
    title: 'Apartments for sale',
    subtitle: 'Premium apartments in the most sought-after mountain location in Czech Republic',
    rooms: 'rooms',
    view: 'Inquire',
    priceOnRequest: 'Price on request',
    videoTitle: 'Project tour',
    contact: 'Contact us',
    contactText: 'Interested in more information?',
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            {t.tagline}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6">
            {t.title}
          </h1>
          <p className="text-xl text-white/50 max-w-xl">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-10">
            {t.videoTitle}
          </h2>
          <div className="relative aspect-video">
            <iframe
              src="https://www.youtube.com/embed/gJqA9imgAsQ"
              title="Pod Zlatým návrším"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Apartments */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          
          <p className="text-sm text-navy/40 mb-16">
            {apartments.length} {locale === 'cs' ? 'apartmánů' : 'apartments'}
          </p>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-20">
            {apartments.map((apt) => (
              <Link 
                key={apt.slug} 
                href={`/apartmany-prodej/${apt.slug}`}
                className="group block"
              >
                <div className="aspect-[3/2] bg-stone mb-8 overflow-hidden relative">
                  <Image
                    src="/images/building-front.jpg"
                    alt={apt.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                
                <h3 className="text-2xl font-light text-navy group-hover:text-gold transition-colors mb-3">
                  {apt.title}
                </h3>
                
                <p className="text-sm text-navy/40 mb-6">
                  {apt.area} m² · {apt.rooms} {t.rooms}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-navy/50 text-sm">
                    {t.priceOnRequest}
                  </span>
                  <span className="text-sm text-navy border-b border-navy pb-1 group-hover:text-gold group-hover:border-gold transition-colors">
                    {t.view}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white/50 mb-8">{t.contactText}</p>
          <Link 
            href="/kontakt"
            className="inline-block px-10 py-4 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors"
          >
            {t.contact}
          </Link>
        </div>
      </section>
    </>
  );
}
