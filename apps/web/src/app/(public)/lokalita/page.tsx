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
import { withSeo } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return withSeo({
      title: 'Location | Labská, Špindlerův Mlýn | Pod Zlatým návrším',
      description: 'Apartments 50 metres from the Labská chairlift in the quiet Labská part of Špindlerův Mlýn. Free parking, ski bus to the centre, hiking from the door.',
    }, '/lokalita');
  }
  return withSeo({
    title: 'Lokalita | Labská, Špindlerův Mlýn | Pod Zlatým návrším',
    description: 'Apartmány 50 metrů od lanovky Labská v klidné části Špindlerova Mlýna. Parkování zdarma, skibus do centra, turistika přímo od domu.',
  }, '/lokalita');
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
          'Lyžařská škola SKOL MAX necelých 100 m od domu',
          'Uzamykatelná lyžárna v domě, parkování zdarma',
        ],
      },
      {
        title: 'Léto',
        items: [
          'Turistika přímo od domu: Labská přehrada, Zlaté návrší a Vrbatova bouda, pramen Labe, Labská bouda, Sněžka',
          'Z centra Špindlerova Mlýna začíná Harrachovská cesta, nejstarší turistická trasa Krkonoš',
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

    historyTitle: 'Zlaté návrší a historie místa',
    history: [
      'Zlaté návrší s výškou 1 411 m n. m. je jedním z nejhezčích míst Krkonoš. Jeho hřbet leží mezi Medvědínem a masivem Kotle (1 435 m n. m.), spolu s ním a Lysou horou tvoří nejvýraznější horskou trojici Krkonoš. Přibližně 400 m od vrcholu stojí v sedle Vrbatova bouda, odkud vedou trasy k prameni Labe a na Horní Mísečky. Odtud se po turistické trase a lanovkou Labská dostanete k domům Pod Zlatým návrším i do Špindlerova Mlýna.',
      'Svah u Labské byl poprvé osídlen na konci 16. století. V roce 1916 byla dokončena Labská přehrada, která zachytává většinu sněhových vod ve středních Krkonoších a dotváří krajinu v údolí řeky.',
      'Krkonoše zmínil už antický astronom a geograf Ptolemaios. Do hor lákalo lidi hlavně nerostné bohatství: kolonisté z různých koutů Evropy tu hledali zlato, stříbro, drahé kameny a rudy. Mezi 12. a 16. stoletím patřilo dolování a zpracování železných rud k nejčastější obživě místních a Krkonoše se staly nejvýznamnější hornickou oblastí českých zemí.',
      'Ve 14. a 15. století sem přicházeli Vlaši, hledači zlata a drahých kamenů z Benátek. Stopy po jejich činnosti zanikly, dochovaly se ale tajemné záznamy o cestách k pokladům, takzvané Vlašské knihy.',
    ],
    historyQuote: '„Italové, kteří cestují do sudetských hor, aby tam hledali zlato, vyplachují z potoků písek smíchaný se slídami a drahokamy ve dlouhém plochém korytě, vydlabaném z jednoho kusu kmene… Zrnka zlata a granáty, které se usadí společně s těžším pískem na dně, omývají v další nádobě, balí do kožených váčků a berou s sebou.“',
    historyQuoteSource: 'Georgius Agricola, De re metallica (1556)',

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
          'SKOL MAX ski school less than 100 m from the building',
          'Lockable ski room in the building, free parking',
        ],
      },
      {
        title: 'Summer',
        items: [
          'Hiking straight from the door: Labská dam, Zlaté návrší and Vrbatova bouda, the source of the Elbe, Labská bouda, Sněžka',
          'The Harrachov Trail, the oldest hiking route in the Krkonoše, starts in the centre of Špindlerův Mlýn',
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

    historyTitle: 'Zlaté návrší and the history of the area',
    history: [
      'At 1,411 m above sea level, Zlaté návrší is one of the most beautiful places in the Krkonoše. Its ridge lies between Medvědín and the Kotel massif (1,435 m); together with Lysá hora they form the most distinctive mountain trio of the Krkonoše. About 400 m from the summit, Vrbatova bouda stands in the saddle, with trails leading to the source of the Elbe and to Horní Mísečky. From there, a hiking trail and the Labská chairlift take you to the Pod Zlatým návrším houses and to Špindlerův Mlýn.',
      'The Labská slope was first settled at the end of the 16th century. In 1916 the Labská dam was completed; it collects most of the meltwater of the central Krkonoše and shapes the landscape of the river valley.',
      'The Krkonoše were already mentioned by the ancient astronomer and geographer Ptolemy. People were drawn to the mountains mainly by their mineral wealth: settlers from all over Europe searched here for gold, silver, precious stones and ore. Between the 12th and 16th centuries, mining and iron-ore processing were the most common livelihood, and the Krkonoše became the most important mining region in the Czech lands.',
      'In the 14th and 15th centuries, the Walen, gold and gem prospectors from Venice, came to the mountains. Traces of their work have disappeared, but their mysterious records of routes to hidden treasure, the so-called Walen Books, have survived.',
    ],
    historyQuote: '"The Italians who travel to the Sudeten mountains in search of gold wash the sand of the streams, mixed with mica and gems, in a long, flat trough hollowed out of a single tree trunk… The grains of gold and garnets that settle with the heavier sand at the bottom are washed in another vessel, packed into leather pouches and taken away."',
    historyQuoteSource: 'Georgius Agricola, De re metallica (1556)',

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

      {/* History */}
      <section className="py-24 bg-cream">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-light text-navy mb-10 text-center">{t.historyTitle}</h2>
          <div className="space-y-6 text-navy/70 leading-relaxed">
            {t.history.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <figure className="mt-12 border-l-2 border-gold pl-6">
            <blockquote className="text-navy/60 italic leading-relaxed">{t.historyQuote}</blockquote>
            <figcaption className="mt-3 text-xs text-navy/40 uppercase tracking-widest">{t.historyQuoteSource}</figcaption>
          </figure>
        </div>
      </section>

      {/* Transport */}
      <section className="py-24 bg-stone">
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
