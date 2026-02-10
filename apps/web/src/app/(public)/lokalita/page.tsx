/**
 * Lokalita - Design Checklist 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lokalita | Pod Zlatým návrším',
  description: 'Špindlerův Mlýn - nejžádanější horská destinace České republiky.',
};

export default async function LocationPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Špindlerův Mlýn',
    title: 'Lokalita',
    subtitle: 'Nejžádanější horská destinace České republiky',
    
    stats: [
      { value: '1.5h', label: 'z Prahy' },
      { value: '2h', label: 'z Berlína' },
      { value: '365', label: 'dní v roce' },
    ],
    
    winterTitle: 'Zima',
    winterText: 'Nejlepší lyžařské středisko v Česku. Sjezdovky pro všechny úrovně, moderní lanovky a skvělé podmínky od prosince do dubna.',
    
    summerTitle: 'Léto',
    summerText: 'Ideální zázemí pro turistiku, cyklistiku a odpočinek. Stovky kilometrů značených tras v Krkonošském národním parku.',
    
    cta: 'Kontaktovat nás',
  } : {
    tagline: 'Špindlerův Mlýn',
    title: 'Location',
    subtitle: 'The most sought-after mountain destination in the Czech Republic',
    
    stats: [
      { value: '1.5h', label: 'from Prague' },
      { value: '2h', label: 'from Berlin' },
      { value: '365', label: 'days a year' },
    ],
    
    winterTitle: 'Winter',
    winterText: 'The best ski resort in the Czech Republic. Slopes for all levels, modern lifts, and excellent conditions from December to April.',
    
    summerTitle: 'Summer',
    summerText: 'Ideal base for hiking, cycling, and relaxation. Hundreds of kilometers of marked trails in Krkonoše National Park.',
    
    cta: 'Contact us',
  };

  return (
    <>
      {/* Hero */}
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

      {/* Stats */}
      <section className="py-16 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {t.stats.map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-light text-navy mb-2">{stat.value}</p>
                <p className="text-sm text-navy/40 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasons */}
      <section className="bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="py-20 px-6 border-b border-navy/10">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <h2 className="text-2xl font-light text-navy">{t.winterTitle}</h2>
              <p className="text-navy/60 leading-relaxed">{t.winterText}</p>
            </div>
          </div>
          
          <div className="py-20 px-6">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <h2 className="text-2xl font-light text-navy">{t.summerTitle}</h2>
              <p className="text-navy/60 leading-relaxed">{t.summerText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/kontakt"
            className="inline-block px-12 py-5 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors"
          >
            {t.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
