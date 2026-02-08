/**
 * Apartmány k pronájmu
 * Production v1: Rental catalog
 * 
 * URL: /apartmany-spindleruv-mlyn-pronajem (SEO Critical)
 * 
 * Design Rules:
 * - Premium, quiet tone
 * - Gold/bronze accent (5-10% max)
 * - No "brzy" or disabled states
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { 
  getRentApartments, 
  formatAreaDisplay, 
  formatPriceDisplay,
  getApartmentDisplayName,
  getCTALabel,
} from '@/lib/apartments';

export const metadata: Metadata = {
  title: 'Apartmány k pronájmu | Špindlerův Mlýn | Pod Zlatým návrším',
  description: 'Luxusní apartmány k pronájmu ve Špindlerově Mlýně. Krátkodobé pobyty v plně vybavených apartmánech v Krkonoších.',
  keywords: 'apartmány Špindl, apartmány Špindlerův Mlýn, pronájem apartmánů, ubytování Krkonoše, Golden Ridge',
};

export default async function RentApartmentsPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const apartments = getRentApartments();

  const t = locale === 'cs' ? {
    badge: 'Pronájem',
    title: 'Apartmány k pronájmu',
    subtitle: 'Špindlerův Mlýn · Krkonoše',
    description: 'Vyberte si z nabídky plně vybavených apartmánů pro váš pobyt v srdci Krkonoš.',
    count: `${apartments.length} apartmánů`,
    noApartments: 'Momentálně nejsou k dispozici žádné apartmány k pronájmu.',
    viewDetail: 'Zobrazit detail',
    rooms: 'místnosti',
    contactTitle: 'Nenašli jste, co hledáte?',
    contactText: 'Kontaktujte nás a rádi vám pomůžeme s výběrem ideálního apartmánu.',
    contactCta: 'Kontaktovat nás',
  } : {
    badge: 'Rent',
    title: 'Apartments for rent',
    subtitle: 'Špindlerův Mlýn · Giant Mountains',
    description: 'Choose from our selection of fully equipped apartments for your stay in the heart of the Giant Mountains.',
    count: `${apartments.length} apartments`,
    noApartments: 'No apartments are currently available for rent.',
    viewDetail: 'View details',
    rooms: 'rooms',
    contactTitle: "Didn't find what you're looking for?",
    contactText: 'Contact us and we will be happy to help you choose the perfect apartment.',
    contactCta: 'Contact us',
  };

  return (
    <>
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-amber-400 font-medium mb-4">{t.subtitle}</p>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            {t.description}
          </p>
        </div>
      </section>

      {/* Apartments Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-slate-500 mb-8">{t.count}</p>
          
          {apartments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {apartments.map((apt) => (
                <article 
                  key={apt.slug}
                  className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all"
                >
                  {/* Image placeholder */}
                  <div className="aspect-[4/3] bg-slate-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
                      </svg>
                    </div>
                    {/* Mode badge */}
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium px-2.5 py-1 rounded">
                      {t.badge}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-lg font-medium text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {getApartmentDisplayName(apt, locale)}
                    </h2>
                    
                    <p className="text-sm text-slate-600 mb-4">
                      {formatAreaDisplay(apt.m2.total)} · {apt.m2.breakdown.length} {t.rooms} · {apt.building}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="font-medium text-slate-900">
                        {formatPriceDisplay(apt, locale)}
                      </span>
                      <Link
                        href={`/golden-ridge-apartments/apartman/${apt.slug}`}
                        className="text-sm text-slate-600 hover:text-amber-600 font-medium transition-colors"
                      >
                        {t.viewDetail} →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500">{t.noApartments}</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4">
            {t.contactTitle}
          </h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            {t.contactText}
          </p>
          <Link 
            href="/kontakt"
            className="inline-block px-6 py-3 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors"
          >
            {t.contactCta}
          </Link>
        </div>
      </section>
    </>
  );
}
