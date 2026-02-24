/**
 * Homepage - Design 2030 with real photos
 * Content from XLSX: "Homepage"
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apartmány na prodej Špindlerův Mlýn | Pod Zlatým návrším',
  description: 'Poslední 3 rezidenční apartmány ve Špindlerově Mlýně. Dokonalá kombinace relaxace na horách a investiční jistoty.',
};

export default async function HomePage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    heroClaim: 'Dokonalá kombinace relaxace na horách a investiční jistoty.',
    heroTitle: 'Poslední 3 rezidenční apartmány ve Špindlerově Mlýně',
    heroText: 'Na kopci nad Labskou přehradou, obklopené stromy, světlem a tichem, čekají už jen poslední 3 apartmány na své majitele.',
    cta: 'Prohlédnout apartmány',
    
    section1Num: '01',
    section1Title: 'Apartmány ve Špindlu na pár nocí?',
    section1Text: 'Naše apartmány patří k tomu nejlepšímu, co ve Špindlerově Mlýně najdete. K pronájmu na víkend nebo pár nocí máme 7 apartmánů. Plně vybavené, navržené ve spolupráci s KARE Design.',
    section1Link: 'Zobrazit apartmány k pronájmu',
    
    section2Num: '02',
    section2Title: 'Dlouhodobá investice i rychlý výnos',
    section2Text: 'Letos bude inflace kolem 2,5 %. Úrokové sazby okolo 4 %. Ceny nemovitostí v Krkonoších rostou i o 10 % ročně. Díky tomu, že jsou dostupné apartmány vybavené, dají se využívat i pronajímat hned – bez čekání, bez starostí.',
    section2Link: 'Investiční kalkulačka',
    
    section3Num: '03',
    section3Title: 'Ráj pro lyžaře i turisty',
    section3Text: 'Apartmánové domy se nacházejí 50 metrů od sedačkové lanovky a červené sjezdovky Labská s délkou 1 770 metrů. Celý lyžařský areál bude propojen s Hromovkou a Svatým Petrem.',
    section3Link: 'O lokalitě',
  } : {
    heroClaim: 'The perfect combination of mountain relaxation and investment security.',
    heroTitle: 'Last 3 residential apartments in Špindlerův Mlýn',
    heroText: 'On a hill above the Labská dam, surrounded by trees, light and silence, the last 3 apartments await their owners.',
    cta: 'View apartments',
    
    section1Num: '01',
    section1Title: 'Apartments in Špindl for a few nights?',
    section1Text: 'Our apartments are among the best you can find in Špindlerův Mlýn. We have 7 apartments for weekend or short-term rental. Fully equipped, designed in collaboration with KARE Design.',
    section1Link: 'View rental apartments',
    
    section2Num: '02',
    section2Title: 'Long-term investment & quick returns',
    section2Text: 'This year inflation will be around 2.5%. Interest rates around 4%. Real estate prices in Krkonoše are growing by up to 10% annually. Since the available apartments are furnished, they can be used and rented immediately.',
    section2Link: 'Investment calculator',
    
    section3Num: '03',
    section3Title: 'Paradise for skiers and hikers',
    section3Text: 'The apartment buildings are located 50 meters from the chairlift and the red Labská ski slope with a length of 1,770 meters.',
    section3Link: 'About location',
  };

  return (
    <>
      {/* Hero with real photo */}
      <section className="relative min-h-screen flex items-center justify-center">
        <Image
          src="/images/hero.jpg"
          alt="Pod Zlatým návrším"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-navy/60" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <p className="text-gold text-sm md:text-base tracking-widest uppercase mb-6">
            {t.heroClaim}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-8 leading-[1.15]">
            {t.heroTitle}
          </h1>
          <p className="text-white/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            {t.heroText}
          </p>
          <Link 
            href="/suites"
            className="inline-block px-10 py-4 bg-gold text-navy text-sm tracking-[0.2em] uppercase hover:bg-gold-400 transition-colors"
          >
            {t.cta}
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-px h-16 bg-white/30" />
        </div>
      </section>

      {/* Section 1 - Pronájem */}
      <section className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/building-front.jpg"
                alt="Apartmány Pod Zlatým návrším"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-gold text-sm tracking-widest">{t.section1Num}</span>
              <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-6">{t.section1Title}</h2>
              <p className="text-navy/60 leading-relaxed mb-8">{t.section1Text}</p>
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
              >
                {t.section1Link}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Investice */}
      <section className="py-32 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <span className="text-gold text-sm tracking-widest">{t.section2Num}</span>
              <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-6">{t.section2Title}</h2>
              <p className="text-navy/60 leading-relaxed mb-8">{t.section2Text}</p>
              <Link 
                href="/kalkulacka"
                className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
              >
                {t.section2Link}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden order-1 md:order-2">
              <Image
                src="/images/building-lift.jpg"
                alt="Apartmány u lanovky"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Lokalita */}
      <section className="py-32 bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-gold text-sm tracking-widest">{t.section3Num}</span>
          <h2 className="text-3xl md:text-4xl font-light mt-4 mb-6">{t.section3Title}</h2>
          <p className="text-white/60 leading-relaxed mb-8 max-w-xl mx-auto">{t.section3Text}</p>
          <Link 
            href="/lokalita"
            className="inline-flex items-center text-white font-medium hover:text-gold transition-colors"
          >
            {t.section3Link}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Section 4 - Vyberte účel koupě */}
      <section className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-navy mb-6">
              Vyberte účel koupě
            </h2>
            <p className="text-navy/60 max-w-2xl mx-auto">
              Projekt Pod Zlatým návrším je unikátní investiční příležitost, která se nebude opakovat. 
              Zajistěte si stabilní výnos, jistotu krásné dovolené, nebo obojí.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Investice */}
            <div className="bg-navy p-10">
              <h3 className="text-gold text-sm tracking-widest uppercase mb-6">Investice</h3>
              <ul className="space-y-4 text-white/70">
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Investice vydělává i v době nepřítomnosti</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Pronájem pokryje min. běžné poplatky</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>S pronájmem i servisem pomůžeme</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Skvělá investice pro firmy jako benefit</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Podobných projektů v Krkonoších příliš nenajdete</span>
                </li>
              </ul>
              <Link 
                href="/kalkulacka"
                className="inline-flex items-center mt-8 text-gold hover:text-gold-400 transition-colors"
              >
                Spočítat výnos
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
            
            {/* Rekreace */}
            <div className="bg-stone p-10">
              <h3 className="text-gold text-sm tracking-widest uppercase mb-6">Rekreace</h3>
              <ul className="space-y-4 text-navy/70">
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Operátor zajistí servis i úklid</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Krkonoše nabízí aktivní i pasivní odpočinek</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Ideální pro velkou rodinu</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Relax na horách kdykoliv</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold mt-1">•</span>
                  <span>Investice do vás a vaší rodiny</span>
                </li>
              </ul>
              <Link 
                href="/suites"
                className="inline-flex items-center mt-8 text-navy hover:text-gold transition-colors"
              >
                Prohlédnout apartmány
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
