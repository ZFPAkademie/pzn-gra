/**
 * Homepage - Jurkovič-inspired Luxury Design
 * Content from XLSX: "Homepage" - preserved exactly
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { getLocaleFromCookie } from '@/lib/i18n';
import { JurkovicOrnament, MountainSilhouette, Stat, SectionLabel } from '@/components/ui/ornaments';

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
    heroTitle1: 'Poslední 3 rezidenční apartmány ve',
    heroTitle2: 'Špindlerově Mlýně',
    heroText: 'Na kopci nad Labskou přehradou, obklopené stromy, světlem a tichem, čekají už jen poslední 3 apartmány na své majitele.',
    cta: 'Prohlédnout apartmány',
    ctaSecondary: 'Rezervovat pobyt',
    
    section1Title: 'Apartmány ve Špindlu na pár nocí?',
    section1Text: 'Naše apartmány patří k tomu nejlepšímu, co ve Špindlerově Mlýně najdete. K pronájmu na víkend nebo pár nocí máme 7 apartmánů. Plně vybavené, navržené ve spolupráci s KARE Design.',
    section1Link: 'Zobrazit apartmány k pronájmu',
    
    section2Title: 'Dlouhodobá investice i rychlý výnos',
    section2Text: 'Letos bude inflace kolem 2,5 %. Úrokové sazby okolo 4 %. Ceny nemovitostí v Krkonoších rostou i o 10 % ročně. Díky tomu, že jsou dostupné apartmány vybavené, dají se využívat i pronajímat hned – bez čekání, bez starostí.',
    section2Link: 'Investiční kalkulačka',
    
    section3Title: 'Ráj pro lyžaře i turisty',
    section3Text: 'Apartmánové domy se nacházejí 50 metrů od sedačkové lanovky a červené sjezdovky Labská s délkou 1 770 metrů. Celý lyžařský areál bude propojen s Hromovkou a Svatým Petrem.',
    section3Link: 'O lokalitě',
    
    section4Title: 'Vyberte účel koupě',
    section4Text: 'Projekt Pod Zlatým návrším je unikátní investiční příležitost, která se nebude opakovat. Zajistěte si stabilní výnos, jistotu krásné dovolené, nebo obojí.',
    
    investiceTitle: 'Investice',
    investiceBenefits: [
      'Investice vydělává i v době nepřítomnosti',
      'Pronájem pokryje min. běžné poplatky',
      'S pronájmem i servisem pomůžeme',
      'Skvělá investice pro firmy jako benefit',
      'Podobných projektů v Krkonoších příliš nenajdete',
    ],
    investiceLink: 'Spočítat výnos',
    
    rekreaceTitle: 'Rekreace',
    rekreaceBenefits: [
      'Operátor zajistí servis i úklid',
      'Krkonoše nabízí aktivní i pasivní odpočinek',
      'Ideální pro velkou rodinu',
      'Relax na horách kdykoliv',
      'Investice do vás a vaší rodiny',
    ],
    rekreaceLink: 'Prohlédnout apartmány',
    
    stats: {
      apartments: 'Apartmány k prodeji',
      distance: 'Od lanovky',
      slope: 'Délka sjezdovky',
      completed: 'Kolaudováno',
    },
  } : {
    heroClaim: 'The perfect combination of mountain relaxation and investment security.',
    heroTitle1: 'Last 3 residential apartments in',
    heroTitle2: 'Špindlerův Mlýn',
    heroText: 'On a hill above the Labská dam, surrounded by trees, light and silence, the last 3 apartments await their owners.',
    cta: 'View apartments',
    ctaSecondary: 'Book a stay',
    
    section1Title: 'Apartments in Špindl for a few nights?',
    section1Text: 'Our apartments are among the best you can find in Špindlerův Mlýn. We have 7 apartments for weekend or short-term rental. Fully equipped, designed in collaboration with KARE Design.',
    section1Link: 'View rental apartments',
    
    section2Title: 'Long-term investment & quick returns',
    section2Text: 'This year inflation will be around 2.5%. Interest rates around 4%. Real estate prices in Krkonoše are growing by up to 10% annually. Since the available apartments are furnished, they can be used and rented immediately.',
    section2Link: 'Investment calculator',
    
    section3Title: 'Paradise for skiers and hikers',
    section3Text: 'The apartment buildings are located 50 meters from the chairlift and the red Labská ski slope with a length of 1,770 meters.',
    section3Link: 'About location',
    
    section4Title: 'Choose your purpose',
    section4Text: 'Pod Zlatým návrším is a unique investment opportunity that will not be repeated. Secure a stable return, the certainty of a beautiful vacation, or both.',
    
    investiceTitle: 'Investment',
    investiceBenefits: [
      'Investment earns even in your absence',
      'Rental covers at least regular fees',
      'We help with rental and service',
      'Great investment for companies as a benefit',
      'You won\'t find many similar projects in Krkonoše',
    ],
    investiceLink: 'Calculate returns',
    
    rekreaceTitle: 'Recreation',
    rekreaceBenefits: [
      'Operator provides service and cleaning',
      'Krkonoše offers active and passive relaxation',
      'Ideal for large families',
      'Mountain relaxation anytime',
      'Investment in you and your family',
    ],
    rekreaceLink: 'View apartments',
    
    stats: {
      apartments: 'Apartments for sale',
      distance: 'From the lift',
      slope: 'Slope length',
      completed: 'Completed',
    },
  };

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt="Pod Zlatým návrším - Krkonoše"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy/80" />
        </div>
        
        <div className="relative z-10 py-4 border-b border-white/10">
          <JurkovicOrnament variant="horizontal" className="w-full max-w-md mx-auto h-5 text-gold/40" />
        </div>
        
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-sm tracking-[0.4em] uppercase text-gold mb-8">
              {t.heroClaim}
            </p>
            
            <h1 className="mb-8">
              <span className="block text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-wide leading-[1.15]">
                {t.heroTitle1}
              </span>
              <span className="block text-4xl md:text-5xl lg:text-6xl font-light text-gold italic tracking-wide mt-2">
                {t.heroTitle2}
              </span>
            </h1>
            
            <div className="flex items-center justify-center gap-6 my-10">
              <div className="w-20 h-px bg-gradient-to-r from-transparent to-gold/40" />
              <JurkovicOrnament variant="diamond" className="w-5 h-5 text-gold/60" />
              <div className="w-20 h-px bg-gradient-to-l from-transparent to-gold/40" />
            </div>
            
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              {t.heroText}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/suites"
                className="inline-block px-10 py-4 bg-gold text-navy text-sm tracking-[0.2em] uppercase hover:bg-white transition-colors duration-500"
              >
                {t.cta}
              </Link>
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="inline-block px-10 py-4 border border-white/30 text-white text-sm tracking-[0.2em] uppercase hover:bg-white/10 hover:border-gold transition-all duration-500"
              >
                {t.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 mt-auto">
          <MountainSilhouette className="w-full h-24 text-cream" />
        </div>
        
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
          <span className="text-xs tracking-[0.3em] uppercase text-white/40">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
        </div>
        
        <div className="absolute top-20 left-6 w-16 h-16 text-gold/20 hidden md:block">
          <JurkovicOrnament variant="corner" className="w-full h-full" />
        </div>
        <div className="absolute top-20 right-6 w-16 h-16 text-gold/20 rotate-90 hidden md:block">
          <JurkovicOrnament variant="corner" className="w-full h-full" />
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-16 bg-cream border-b border-navy/10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <Stat value="3" label={t.stats.apartments} />
            <Stat value="50" unit="m" label={t.stats.distance} />
            <Stat value="1 770" unit="m" label={t.stats.slope} />
            <Stat value="XI/23" label={t.stats.completed} />
          </div>
        </div>
      </section>

      {/* SECTION 1 - Pronájem */}
      <section className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 text-gold/30">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 text-gold/30 rotate-180">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/building-front.jpg"
                  alt="Apartmány Pod Zlatým návrším"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <div>
              <SectionLabel>01 · Pronájem</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-6 tracking-wide">
                {t.section1Title}
              </h2>
              <p className="text-navy/60 leading-relaxed mb-8 text-lg">
                {t.section1Text}
              </p>
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="inline-flex items-center text-navy font-medium tracking-wide border-b border-navy pb-1 hover:text-gold hover:border-gold transition-colors"
              >
                {t.section1Link}
                <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - Investice */}
      <section className="py-32 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <SectionLabel>02 · Investice</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-6 tracking-wide">
                {t.section2Title}
              </h2>
              <p className="text-navy/60 leading-relaxed mb-8 text-lg">
                {t.section2Text}
              </p>
              <Link 
                href="/kalkulacka"
                className="inline-flex items-center text-navy font-medium tracking-wide border-b border-navy pb-1 hover:text-gold hover:border-gold transition-colors"
              >
                {t.section2Link}
                <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
            
            <div className="relative order-1 md:order-2">
              <div className="absolute -top-4 -right-4 w-12 h-12 text-gold/30 rotate-90">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 text-gold/30 -rotate-90">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/building-lift.jpg"
                  alt="Apartmány u lanovky"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - Lokalita */}
      <section className="py-32 bg-navy text-white relative overflow-hidden">
        <MountainSilhouette className="absolute bottom-0 left-0 right-0 h-48 text-white/5" />
        
        <div className="absolute top-8 left-8 w-16 h-16 text-gold/20 hidden md:block">
          <JurkovicOrnament variant="corner" className="w-full h-full" />
        </div>
        <div className="absolute bottom-8 right-8 w-16 h-16 text-gold/20 rotate-180 hidden md:block">
          <JurkovicOrnament variant="corner" className="w-full h-full" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <SectionLabel light>03 · Lokalita</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light mt-4 mb-6 tracking-wide">
            {t.section3Title}
          </h2>
          <p className="text-white/60 leading-relaxed mb-10 text-lg max-w-2xl mx-auto">
            {t.section3Text}
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/30" />
            <JurkovicOrnament variant="diamond" className="w-4 h-4 text-gold/50" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/30" />
          </div>
          
          <Link 
            href="/lokalita"
            className="inline-flex items-center text-gold font-medium tracking-wide border-b border-gold/50 pb-1 hover:border-gold transition-colors"
          >
            {t.section3Link}
            <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* SECTION 4 - Účel koupě */}
      <section className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <JurkovicOrnament variant="simple" className="w-32 h-3 text-gold/40 mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-light text-navy mb-6 tracking-wide">
              {t.section4Title}
            </h2>
            <p className="text-navy/60 max-w-2xl mx-auto text-lg leading-relaxed">
              {t.section4Text}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Investice */}
            <div className="group relative bg-navy p-10 md:p-12 overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 text-gold/20">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute bottom-0 right-0 w-12 h-12 text-gold/20 rotate-180">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              
              <div className="relative">
                <h3 className="text-gold text-sm tracking-[0.3em] uppercase mb-8">{t.investiceTitle}</h3>
                <ul className="space-y-4 mb-10">
                  {t.investiceBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-4 text-white/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 flex-shrink-0" />
                      <span className="leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/kalkulacka"
                  className="inline-flex items-center text-gold tracking-wide border-b border-gold/50 pb-1 hover:border-gold transition-colors"
                >
                  {t.investiceLink}
                  <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/0 to-transparent group-hover:via-gold transition-all duration-700" />
            </div>
            
            {/* Rekreace */}
            <div className="group relative bg-white border border-navy/10 p-10 md:p-12 overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 text-navy/10 group-hover:text-gold/30 transition-colors">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute bottom-0 right-0 w-12 h-12 text-navy/10 group-hover:text-gold/30 rotate-180 transition-colors">
                <JurkovicOrnament variant="corner" className="w-full h-full" />
              </div>
              
              <div className="relative">
                <h3 className="text-navy text-sm tracking-[0.3em] uppercase mb-8">{t.rekreaceTitle}</h3>
                <ul className="space-y-4 mb-10">
                  {t.rekreaceBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-4 text-navy/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 flex-shrink-0" />
                      <span className="leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/suites"
                  className="inline-flex items-center text-navy tracking-wide border-b border-navy/30 pb-1 hover:text-gold hover:border-gold transition-colors"
                >
                  {t.rekreaceLink}
                  <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </Link>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/0 to-transparent group-hover:via-gold transition-all duration-700" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
