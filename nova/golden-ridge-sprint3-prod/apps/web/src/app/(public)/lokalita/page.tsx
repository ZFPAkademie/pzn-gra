/**
 * Lokalita - Design 2030
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
    
    intro: 'Pod Zlatým návrším se nachází v srdci Špindlerova Mlýna, v těsné blízkosti lyžařských areálů a turistických tras. Ideální výchozí bod pro zimní i letní aktivity.',
    
    stats: [
      { value: '1.5h', label: 'z Prahy' },
      { value: '2h', label: 'z Berlína' },
      { value: '765m', label: 'n.m.' },
    ],
    
    sections: [
      {
        title: 'Zima',
        items: [
          'Nejlepší lyžařské středisko v ČR',
          'Sjezdovky pro všechny úrovně',
          'Moderní lanovky a vleky',
          'Sezóna: prosinec – duben',
          'Večerní lyžování',
          'Ski areál Svatý Petr 400m',
        ],
      },
      {
        title: 'Léto',
        items: [
          'Stovky km turistických tras',
          'Cyklistické stezky',
          'Krkonošský národní park',
          'Vodopády a rozhledny',
          'Golfové hřiště v okolí',
          'Wellness a relaxace',
        ],
      },
    ],
    
    nearby: 'V okolí',
    nearbyItems: [
      { name: 'Ski areál Svatý Petr', distance: '400 m' },
      { name: 'Centrum města', distance: '500 m' },
      { name: 'Restaurace a obchody', distance: '300 m' },
      { name: 'Labská bouda', distance: '8 km' },
      { name: 'Sněžka', distance: '12 km' },
    ],
    
    cta: 'Kontaktovat nás',
  } : {
    tagline: 'Špindlerův Mlýn',
    title: 'Location',
    subtitle: 'The most sought-after mountain destination in the Czech Republic',
    
    intro: 'Pod Zlatým návrším is located in the heart of Špindlerův Mlýn, close to ski resorts and hiking trails. An ideal starting point for winter and summer activities.',
    
    stats: [
      { value: '1.5h', label: 'from Prague' },
      { value: '2h', label: 'from Berlin' },
      { value: '765m', label: 'altitude' },
    ],
    
    sections: [
      {
        title: 'Winter',
        items: [
          'Best ski resort in Czech Republic',
          'Slopes for all levels',
          'Modern lifts',
          'Season: December – April',
          'Night skiing',
          'Ski area Svatý Petr 400m',
        ],
      },
      {
        title: 'Summer',
        items: [
          'Hundreds of km of hiking trails',
          'Cycling paths',
          'Krkonoše National Park',
          'Waterfalls and lookouts',
          'Golf courses nearby',
          'Wellness and relaxation',
        ],
      },
    ],
    
    nearby: 'Nearby',
    nearbyItems: [
      { name: 'Ski area Svatý Petr', distance: '400 m' },
      { name: 'Town center', distance: '500 m' },
      { name: 'Restaurants and shops', distance: '300 m' },
      { name: 'Labská bouda', distance: '8 km' },
      { name: 'Sněžka peak', distance: '12 km' },
    ],
    
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
      <section className="py-16 bg-gold">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {t.stats.map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-light text-navy mb-2">{stat.value}</p>
                <p className="text-sm text-navy/60 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xl text-navy/70 leading-relaxed text-center">
            {t.intro}
          </p>
        </div>
      </section>

      {/* Seasons */}
      <section className="py-24 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {t.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-2xl font-light text-navy mb-8">{section.title}</h2>
                <ul className="space-y-4">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-center text-navy/60">
                      <span className="w-6 h-px bg-gold mr-4" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby */}
      <section className="py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-12">
            {t.nearby}
          </h2>
          <div className="max-w-2xl mx-auto">
            {t.nearbyItems.map((item, i) => (
              <div key={i} className="flex justify-between py-4 border-b border-navy/10">
                <span className="text-navy">{item.name}</span>
                <span className="text-navy/40">{item.distance}</span>
              </div>
            ))}
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
