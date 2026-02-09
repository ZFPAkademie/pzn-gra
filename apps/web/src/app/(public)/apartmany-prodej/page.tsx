/**
 * Apartmány na prodej
 * Production v1: Sale catalog
 * 
 * URL: /apartmany-prodej
 * 
 * Design Rules:
 * - sale → CENA SE NEZOBRAZUJE, vždy „Cena na dotaz"
 * - CTA: "Nezávazně poptat cenu"
 * - Premium, quiet tone
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { 
  getSaleApartments, 
  formatAreaDisplay, 
  getApartmentDisplayName,
} from '@/lib/apartments';

export const metadata: Metadata = {
  title: 'Apartmány na prodej | Krkonoše | Pod Zlatým návrším',
  description: 'Luxusní apartmány na prodej v Krkonoších. Investiční příležitost v prémiové horské lokalitě.',
  keywords: 'apartmány na prodej, investiční apartmány, Krkonoše, horský resort, Pod Zlatým Návrším',
};

export default async function SaleApartmentsPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const apartments = getSaleApartments();

  const t = locale === 'cs' ? {
    badge: 'Prodej',
    title: 'Apartmány na prodej',
    subtitle: 'Pod Zlatým návrším · Krkonoše',
    description: 'Staňte se vlastníkem luxusního apartmánu v srdci Krkonoš. Jedinečná příležitost v nejžádanější horské lokalitě.',
    count: `${apartments.length} apartmánů`,
    noApartments: 'Momentálně nejsou k dispozici žádné apartmány k prodeji.',
    priceOnRequest: 'Cena na dotaz',
    viewDetail: 'Zobrazit detail',
    rooms: 'místnosti',
    
    // Investment info
    investTitle: 'Proč investovat',
    investItems: [
      { icon: '📈', title: 'Růst hodnoty', desc: 'Nemovitosti v Krkonoších dlouhodobě rostou na hodnotě' },
      { icon: '🏠', title: 'Vlastní využití', desc: 'Možnost vlastního ubytování kdykoliv během roku' },
      { icon: '💰', title: 'Výnosy z pronájmu', desc: 'Generujte pasivní příjem z krátkodobého pronájmu' },
    ],
    
    contactTitle: 'Máte zájem o více informací?',
    contactText: 'Kontaktujte nás pro nezávaznou konzultaci a podrobnosti o dostupných jednotkách.',
    contactCta: 'Kontaktovat nás',
  } : {
    badge: 'Sale',
    title: 'Apartments for sale',
    subtitle: 'Pod Zlatým návrším · Giant Mountains',
    description: 'Become the owner of a luxury apartment in the heart of the Giant Mountains. A unique opportunity in the most sought-after mountain location.',
    count: `${apartments.length} apartments`,
    noApartments: 'No apartments are currently available for sale.',
    priceOnRequest: 'Price on request',
    viewDetail: 'View details',
    rooms: 'rooms',
    
    investTitle: 'Why invest',
    investItems: [
      { icon: '📈', title: 'Value growth', desc: 'Real estate in the Giant Mountains has long-term value appreciation' },
      { icon: '🏠', title: 'Personal use', desc: 'Option for personal accommodation anytime during the year' },
      { icon: '💰', title: 'Rental income', desc: 'Generate passive income from short-term rentals' },
    ],
    
    contactTitle: 'Interested in more information?',
    contactText: 'Contact us for a non-binding consultation and details about available units.',
    contactCta: 'Contact us',
  };

  return (
    <>
      {/* Header */}
      <section className="bg-navy text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold font-medium mb-4">{t.subtitle}</p>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-stone-500 max-w-2xl">
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
                  className="group bg-white border border-stone-300 rounded-lg overflow-hidden hover:border-stone-400 hover:shadow-lg transition-all"
                >
                  {/* Image placeholder */}
                  <div className="aspect-[4/3] bg-stone relative">
                    <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
                      </svg>
                    </div>
                    {/* Mode badge */}
                    <span className="absolute top-4 left-4 bg-gold text-navy text-xs font-medium px-2.5 py-1 rounded">
                      {t.badge}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-lg font-medium text-navy mb-2 group-hover:text-gold transition-colors">
                      {apt.title}
                    </h2>
                    
                    <p className="text-sm text-stone-700 mb-4">
                      {formatAreaDisplay(apt.m2.total)} · {apt.m2.breakdown.length} {t.rooms} · {apt.building}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="font-medium text-gold">
                        {t.priceOnRequest}
                      </span>
                      <Link
                        href={`/apartmany-prodej/${apt.slug}`}
                        className="text-sm text-stone-700 hover:text-gold font-medium transition-colors"
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

      {/* Investment Benefits */}
      <section className="py-16 md:py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-light text-navy mb-12 text-center">
            {t.investTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {t.investItems.map((item, index) => (
              <div key={index} className="text-center">
                <span className="inline-flex w-14 h-14 bg-white rounded-full items-center justify-center text-2xl mb-4 shadow-sm">
                  {item.icon}
                </span>
                <h3 className="text-lg font-medium text-navy mb-2">{item.title}</h3>
                <p className="text-stone-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            {t.contactTitle}
          </h2>
          <p className="text-stone-500 mb-8 max-w-xl mx-auto">
            {t.contactText}
          </p>
          <Link 
            href="/kontakt"
            className="inline-block px-6 py-3 bg-gold text-navy font-medium rounded hover:bg-gold-400 transition-colors"
          >
            {t.contactCta}
          </Link>
        </div>
      </section>
    </>
  );
}
