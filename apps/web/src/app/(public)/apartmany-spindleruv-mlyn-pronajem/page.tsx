/**
 * Apartmány k pronájmu - Design Checklist 2030
 * 
 * Pravidla:
 * - Hero = emoce
 * - Karty bez ikon
 * - Prostor a ticho
 * - Premium feel
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { getRentApartments } from '@/lib/apartments';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apartmány k pronájmu | Špindlerův Mlýn | Pod Zlatým návrším',
  description: 'Luxusní apartmány k pronájmu ve Špindlerově Mlýně.',
};

export default async function RentApartmentsPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const apartments = getRentApartments();

  const t = locale === 'cs' ? {
    tagline: 'Špindlerův Mlýn · Krkonoše',
    title: 'Pronájem',
    subtitle: 'Vyberte si z nabídky plně vybavených apartmánů',
    rooms: 'místností',
    view: 'Zobrazit',
    price: 'od',
    perNight: '/ noc',
    contact: 'Kontaktovat nás',
    contactText: 'Potřebujete poradit s výběrem?',
  } : {
    tagline: 'Špindlerův Mlýn · Giant Mountains',
    title: 'Rent',
    subtitle: 'Choose from our selection of fully equipped apartments',
    rooms: 'rooms',
    view: 'View',
    price: 'from',
    perNight: '/ night',
    contact: 'Contact us',
    contactText: 'Need help choosing?',
  };

  return (
    <>
      {/* Hero - minimalist */}
      <section className="bg-navy pt-32 pb-20">
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

      {/* Apartments Grid */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Count - subtle */}
          <p className="text-sm text-navy/40 mb-16">
            {apartments.length} {locale === 'cs' ? 'apartmánů' : 'apartments'}
          </p>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {apartments.map((apt) => (
              <Link 
                key={apt.slug} 
                href={`/golden-ridge-apartments/apartman/${apt.slug}`}
                className="group block"
              >
                {/* Image placeholder */}
                <div className="aspect-[4/3] bg-stone mb-8 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 group-hover:scale-105 transition-transform duration-700" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-light text-navy group-hover:text-gold transition-colors mb-3">
                  {apt.title}
                </h3>
                
                <p className="text-sm text-navy/40 mb-4">
                  {apt.area} m² · {apt.rooms} {t.rooms}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-navy/10">
                  <span className="text-navy/60">
                    {t.price} <span className="text-navy font-medium">{apt.priceFrom?.toLocaleString()} Kč</span> {t.perNight}
                  </span>
                  <span className="text-sm text-navy/40 group-hover:text-gold transition-colors">
                    {t.view} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">{t.contactText}</p>
          <Link 
            href="/kontakt"
            className="inline-block px-10 py-4 border border-navy/20 text-navy text-sm tracking-widest uppercase hover:bg-navy hover:text-white transition-colors"
          >
            {t.contact}
          </Link>
        </div>
      </section>
    </>
  );
}
