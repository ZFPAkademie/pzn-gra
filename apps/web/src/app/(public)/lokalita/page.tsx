/**
 * Lokalita - Design 2030
 *
 * Údaje o vzdálenostech 1. 11. 2026 opraveny podle skutečnosti (část Labská, ne centrum):
 * lanovka Labská 50 m, centrum 2,2 km. Vzdálenosti a mapa z `@/data/stay-info`.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getRequestLocale } from '@/lib/i18n-server';
import { GuestRatingBadge, LocationMap, NearbyList } from '@/components/features/guest-info';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return {
      title: 'Location | Labská, Špindlerův Mlýn | Pod Zlatým návrším',
      description: 'Apartments 50 metres from the Labská chairlift in the quiet Labská part of Špindlerův Mlýn. Free parking, ski bus to the centre, hiking from the door.',
    };
  }
  return {
    title: 'Lokalita | Labská, Špindlerův Mlýn | Pod Zlatým návrším',
    description: 'Apartmány 50 metrů od lanovky Labská v klidné části Špindlerova Mlýna. Parkování zdarma, skibus do centra, turistika přímo od domu.',
  };
}

export default async function LocationPage() {
  const locale = getRequestLocale();

  const t = locale === 'cs' ? {
    tagline: 'Špindlerův Mlýn · Labská',
    title: 'Lokalita',
    subtitle: 'Klidná část Špindlerova Mlýna, 50 metrů od lanovky',

    intro: 'Apartmánové domy Pod Zlatým návrším stojí v Labské, klidné části Špindlerova Mlýna nad Labskou přehradou. Přímo pod domem je sedačková lanovka Labská s 1 770 m dlouhou červenou sjezdovkou, centrum města je 2,2 km. Místo pro ty, kdo chtějí lyžovat od dveří a večer mít ticho.',

    stats: [
      { value: '50 m', label: 'k lanovce Labská' },
      { value: '2,2 km', label: 'do centra' },
      { value: '2 h', label: 'autem z Prahy' },
    ],

    sections: [
      {
        title: 'Zima',
        items: [
          'Lanovka a sjezdovka Labská (1 770 m) 50 m od domu, dojedete k ní na lyžích',
          'Skiareál Špindlerův Mlýn: Svatý Petr, Medvědín, Hromovka a Labská na jeden skipas',
          'Skibus zastavuje u lanovky Labská a vozí do centra a k dalším areálům',
          'Běžecké tratě na Zlatém návrší a Horních Mísečkách',
          'Večerní lyžování ve Svatém Petru',
          'Uzamykatelná lyžárna v domě, parkování zdarma',
        ],
      },
      {
        title: 'Léto',
        items: [
          'Turistika přímo od domu: Labská přehrada, pramen Labe, Labská bouda, Sněžka',
          'Lanovka Labská jezdí i v létě, nahoře začínají hřebenové trasy',
          'Cyklotrasy a trailové stezky v Krkonošském národním parku',
          'Aquapark a bobová dráha ve Špindlerově Mlýně',
          'Golf u Vrchlabí a v Mladých Bukách',
          'Večer klid, výhled na hory a hvězdy bez světel města',
        ],
      },
    ],

    transportTitle: 'Doprava',
    transport: [
      { name: 'Autem z Prahy', value: 'cca 2 h (150 km), dálnice D11 do Jaroměře, dále Vrchlabí' },
      { name: 'Autem z Hradce Králové', value: 'cca 1 h' },
      { name: 'Autem z Wrocławi', value: 'cca 2,5 h' },
      { name: 'Autem z Berlína', value: 'cca 4 h' },
      { name: 'Autobusem', value: 'linky Praha – Špindlerův Mlýn, autobusové nádraží 2,2 km od domu' },
      { name: 'Vlakem', value: 'do Vrchlabí, dále autobusem nebo taxi (15 km)' },
      { name: 'Parkování', value: 'soukromé parkoviště u domu zdarma, bez rezervace' },
      { name: 'Příjezd k domu', value: 'do kopce, v zimě počítejte se zimní výbavou auta' },
    ],

    cta: 'Zobrazit apartmány k pronájmu',
    ctaSecondary: 'Kontaktovat nás',
  } : {
    tagline: 'Špindlerův Mlýn · Labská',
    title: 'Location',
    subtitle: 'The quiet part of Špindlerův Mlýn, 50 metres from the chairlift',

    intro: 'The Pod Zlatým návrším apartment buildings stand in Labská, a quiet part of Špindlerův Mlýn above the Labská dam. Right below the building is the Labská chairlift with its 1,770 m red slope, and the town centre is 2.2 km away. A place for those who want to ski from the door and have peace and quiet in the evening.',

    stats: [
      { value: '50 m', label: 'to the Labská chairlift' },
      { value: '2.2 km', label: 'to the centre' },
      { value: '2 h', label: 'by car from Prague' },
    ],

    sections: [
      {
        title: 'Winter',
        items: [
          'Labská chairlift and slope (1,770 m) 50 m from the building, ski-in access',
          'Špindlerův Mlýn ski resort: Svatý Petr, Medvědín, Hromovka and Labská on one ski pass',
          'The ski bus stops at the Labská chairlift and runs to the centre and the other ski areas',
          'Cross-country trails on Zlaté návrší and Horní Mísečky',
          'Night skiing in Svatý Petr',
          'Lockable ski room in the building, free parking',
        ],
      },
      {
        title: 'Summer',
        items: [
          'Hiking straight from the door: Labská dam, the source of the Elbe, Labská bouda, Sněžka',
          'The Labská chairlift also runs in summer, with ridge trails starting at the top',
          'Cycle routes and trails in the Krkonoše (Giant Mountains) National Park',
          'Aquapark and bobsleigh track in Špindlerův Mlýn',
          'Golf near Vrchlabí and in Mladé Buky',
          'Quiet evenings, mountain views and stars without city lights',
        ],
      },
    ],

    transportTitle: 'Getting here',
    transport: [
      { name: 'By car from Prague', value: 'about 2 h (150 km), D11 motorway to Jaroměř, then Vrchlabí' },
      { name: 'By car from Hradec Králové', value: 'about 1 h' },
      { name: 'By car from Wrocław', value: 'about 2.5 h' },
      { name: 'By car from Berlin', value: 'about 4 h' },
      { name: 'By bus', value: 'Prague to Špindlerův Mlýn services, bus station 2.2 km from the building' },
      { name: 'By train', value: 'to Vrchlabí, then bus or taxi (15 km)' },
      { name: 'Parking', value: 'free private car park by the building, no reservation needed' },
      { name: 'Access road', value: 'uphill, winter equipment for your car is needed in winter' },
    ],

    cta: 'View apartments for rent',
    ctaSecondary: 'Contact us',
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
          <p className="text-xl text-white/50 max-w-xl mb-8">
            {t.subtitle}
          </p>
          <GuestRatingBadge locale={locale} light />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gold">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {t.stats.map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-light text-navy mb-2">{stat.value}</p>
                <p className="text-xs md:text-sm text-navy/60 uppercase tracking-widest">{stat.label}</p>
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

      {/* Map + nearby */}
      <section className="pb-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <LocationMap locale={locale} />
            </div>
            <div className="lg:col-span-2">
              <NearbyList locale={locale} />
            </div>
          </div>
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
                    <li key={j} className="flex items-start text-navy/60">
                      <span className="w-6 h-px bg-gold mr-4 mt-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transport */}
      <section className="py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-12">
            {t.transportTitle}
          </h2>
          <div className="max-w-3xl mx-auto">
            {t.transport.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-8 py-4 border-b border-navy/10">
                <span className="text-navy shrink-0">{item.name}</span>
                <span className="text-navy/50 sm:text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apartmany-spindleruv-mlyn-pronajem"
              className="inline-block px-12 py-5 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors"
            >
              {t.cta}
            </Link>
            <Link
              href="/kontakt"
              className="inline-block px-12 py-5 border border-white/30 text-white text-sm tracking-widest uppercase hover:border-gold transition-colors"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
