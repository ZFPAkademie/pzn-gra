/**
 * Standardy - Design Checklist 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie, toBaseLocale } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import { withSeo } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return withSeo({
      title: 'Standards | Pod Zlatým návrším',
      description: 'Standard fit-out of the apartments: ADLO doors, Princ parket floors, Atlas Concorde tiles, Laufen and Grohe bathrooms, Bosch kitchen appliances.',
    }, '/standardy');
  }
  return withSeo({
    title: 'Standardy | Pod Zlatým návrším',
    description: 'Standardní vybavení apartmánů: dveře ADLO, podlahy Princ parket, dlažba Atlas Concorde, koupelny Laufen a Grohe, kuchyně se spotřebiči Bosch.',
  }, '/standardy');
}

export default async function StandardsPage() {
  const cookieStore = cookies();
  const locale = toBaseLocale(getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value));

  const t = locale === 'cs' ? {
    tagline: 'Kvalita v detailu',
    title: 'Standardy',
    subtitle: 'Standardní vybavení apartmánů v domech Pod Zlatým návrším',
    
    standards: [
      { title: 'Dveře', desc: 'Vstupní bytové dveře ADLO v ocelové zárubni s protipožární odolností, kukátkem a kováním v provedení chrom. Vnitřní dveře plné La Venus (Itálie) nebo Prum (Německo), výška 210 cm, dekor dřeva, kování stříbrný mat.' },
      { title: 'Podlahy', desc: 'V pokojích a kuchyňských koutech dřevěná lamelová podlaha Princ parket, kolekce Volcano. V koupelnách a vstupních chodbách keramická dlažba Atlas Concorde 60 × 60 cm, na balkonech dlažba 30 × 30 cm. Podlahové vytápění.' },
      { title: 'Koupelna', desc: 'Keramické obklady Atlas Concorde v dekoru kamene a dřeva. Závěsné WC a keramické umyvadlo se skříňkou Laufen, zrcadlová skříňka, baterie Grohe v chromu, akrylátová vana Laufen nebo sprchový kout se skleněnou zástěnou.' },
      { title: 'Kuchyně', desc: 'Kuchyňská linka vyššího standardu se spotřebiči Bosch: elektrický sporák, trouba, mikrovlnná trouba a myčka nádobí.' },
      { title: 'Elektroinstalace', desc: 'V koupelnách kompletní svítidla, v ostatních místnostech bodová světla a příprava na lustr v obývacím pokoji. Zásuvky a vypínače ABB nebo Schneider, anténní zásuvka v obývacím pokoji.' },
      { title: 'Zázemí domu', desc: 'Sklepní kóje ke každému apartmánu, uzamykatelná lyžárna a kolárna, vnitřní i venkovní parkovací stání, Wi-Fi v celém domě.' },
    ],
    
    cta: 'Prohlédnout apartmány',
  } : {
    tagline: 'Quality in detail',
    title: 'Standards',
    subtitle: 'Standard fit-out of the apartments in the Pod Zlatým návrším houses',
    
    standards: [
      { title: 'Doors', desc: 'ADLO entrance doors in a steel frame with fire resistance, a peephole and chrome fittings. Solid interior doors by La Venus (Italy) or Prum (Germany), 210 cm high, wood finish, matt silver fittings.' },
      { title: 'Floors', desc: 'Princ parket wooden plank flooring (Volcano collection) in the rooms and kitchen areas. Atlas Concorde ceramic tiles, 60 × 60 cm, in bathrooms and entrance halls, 30 × 30 cm tiles on balconies. Underfloor heating.' },
      { title: 'Bathroom', desc: 'Atlas Concorde ceramic wall tiles in stone and wood finishes. Wall-hung WC and ceramic washbasin with vanity unit by Laufen, mirror cabinet, chrome Grohe taps, Laufen acrylic bath or shower with glass screen.' },
      { title: 'Kitchen', desc: 'Higher-standard fitted kitchen with Bosch appliances: electric cooker, oven, microwave and dishwasher.' },
      { title: 'Electrical', desc: 'Complete light fittings in bathrooms, spotlights in the other rooms and a ceiling light point in the living room. ABB or Schneider sockets and switches, TV aerial socket in the living room.' },
      { title: 'Building facilities', desc: 'A storage unit for every apartment, lockable ski and bike room, indoor and outdoor parking spaces, Wi-Fi throughout the building.' },
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

      {/* Standards */}
      <section className="py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {t.standards.map((item, i) => (
              <div key={i} className="py-8 border-b border-navy/10">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <h3 className="text-xl font-light text-navy mt-4 mb-4">{item.title}</h3>
                <p className="text-navy/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-block px-12 py-5 bg-navy text-white text-sm tracking-widest uppercase hover:bg-navy-700 transition-colors"
          >
            {t.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
