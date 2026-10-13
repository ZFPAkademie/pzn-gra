/**
 * O projektu - Design 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return {
      title: 'About the project | Pod Zlatým návrším',
      description: 'A residential project in the heart of the Krkonoše (Giant Mountains). Luxury apartments for rent and for sale in Špindlerův Mlýn.',
    };
  }
  return {
    title: 'O projektu | Pod Zlatým návrším',
    description: 'Rezidenční projekt v srdci Krkonoš. Luxusní apartmány k pronájmu a prodeji ve Špindlerově Mlýně.',
  };
}

export default async function AboutPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'O projektu',
    title: 'Pod Zlatým návrším',
    subtitle: 'Rezidenční projekt zasazený do malebné krajiny Krkonoš',
    
    sections: [
      {
        title: 'Vize',
        text: 'Vytvořit místo, kde se spojuje moderní komfort s úctou k horské krajině. Místo pro odpočinek, zhodnocení a návrat k tomu, co je důležité. Pod Zlatým návrším není jen nemovitost – je to životní styl.',
      },
      {
        title: 'Lokalita',
        text: 'Špindlerův Mlýn je nejvyhledávanější horskou destinací v České republice. Celoroční turistický ruch, skvělá dostupnost z Prahy a unikátní přírodní prostředí v srdci Krkonošského národního parku.',
      },
      {
        title: 'Architektura',
        text: 'Moderní alpská architektura v harmonii s okolní přírodou. Velké prosklené plochy, přírodní materiály a promyšlené dispozice maximalizující výhledy na hory.',
      },
      {
        title: 'Kvalita',
        text: 'Každý apartmán je navržen s důrazem na detail. Kvalitní materiály, prémiové vybavení a nadčasový design, který bude aktuální i za 20 let.',
      },
    ],
    
    stats: [
      { value: '6', label: 'apartmánů' },
      { value: '2023', label: 'rok dokončení' },
      { value: '45–65', label: 'm² plocha' },
    ],
    
    cta: 'Prohlédnout apartmány',
  } : {
    tagline: 'About the project',
    title: 'Pod Zlatým návrším',
    subtitle: 'A residential project set in the picturesque landscape of the Krkonoše (Giant Mountains)',
    
    sections: [
      {
        title: 'Vision',
        text: 'To create a place where modern comfort meets respect for the mountain landscape. A place for rest, appreciation and a return to what matters. Pod Zlatým návrším is not just a property – it is a way of life.',
      },
      {
        title: 'Location',
        text: 'Špindlerův Mlýn is the most sought-after mountain destination in the Czech Republic. Year-round tourism, excellent access from Prague and a unique natural environment in the heart of the Krkonoše National Park.',
      },
      {
        title: 'Architecture',
        text: 'Modern alpine architecture in harmony with the surrounding nature. Large glazed surfaces, natural materials and carefully considered layouts that make the most of the mountain views.',
      },
      {
        title: 'Quality',
        text: 'Every apartment is designed with attention to detail. Quality materials, premium furnishings and a timeless design that will still feel current in 20 years.',
      },
    ],
    
    stats: [
      { value: '6', label: 'apartments' },
      { value: '2023', label: 'completion year' },
      { value: '45–65', label: 'm² area' },
    ],
    
    cta: 'View apartments',
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

      {/* Sections */}
      <section className="bg-cream">
        <div className="max-w-5xl mx-auto">
          {t.sections.map((section, i) => (
            <div key={i} className="py-20 px-6 border-b border-navy/10 last:border-0">
              <div className="grid md:grid-cols-3 gap-12 items-start">
                <div>
                  <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                  <h2 className="text-2xl font-light text-navy mt-2">{section.title}</h2>
                </div>
                <p className="md:col-span-2 text-navy/60 leading-relaxed">{section.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-block px-12 py-5 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors"
          >
            {t.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
