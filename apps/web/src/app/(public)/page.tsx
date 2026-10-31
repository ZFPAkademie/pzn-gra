/**
 * Homepage - Alpine Quiet Luxury Design
 * Content from XLSX: "Homepage" - preserved exactly
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getRequestLocale } from '@/lib/i18n-server';
import Link from 'next/link';
import Image from 'next/image';
import { getLocaleFromCookie, toBaseLocale } from '@/lib/i18n';
import { AlpineOrnament, MountainSilhouette, Stat, SectionLabel } from '@/components/ui/ornaments';
import { getRentalApartmentsDB, getSaleApartmentsDB, getSalesManager, localizeApartment, layoutLabel } from '@/lib/apartments';
import { getHeroImagesBySlugs } from '@/data/apartment-images';
import { getFdmPriceFromMany } from '@/lib/booking-engine/pricing';
import { formatMoney } from '@/lib/booking-engine/money';

import { ApartmentTitle } from '@/components/features/apartment-title';
import { DateSearchBar } from '@/components/features/date-search';
import { GUEST_RATING, formatScore } from '@/data/stay-info';
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return {
      title: 'Apartments for rent in Špindlerův Mlýn by the chairlift | Pod Zlatým návrším',
      description: 'Design apartments for rent in Špindlerův Mlýn, 50 metres from the Labská chairlift. Book online. The last apartments are also for sale.',
    };
  }
  return {
    title: 'Apartmány Špindlerův Mlýn k pronájmu u lanovky | Pod Zlatým návrším',
    description: 'Designové apartmány k pronájmu ve Špindlerově Mlýně, 50 metrů od lanovky Labská. Rezervace online. Poslední apartmány také na prodej.',
  };
}

export default async function HomePage() {
  const cookieStore = cookies();
  const locale = toBaseLocale(getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value));

  // Pronájem je od 13. 10. 2026 hlavní téma úvodní stránky; počty a ceny z DB / Front Desk Master
  const [rentalApartmentsRaw, saleApartments] = await Promise.all([getRentalApartmentsDB(), getSaleApartmentsDB()]);
  const rentalApartments = rentalApartmentsRaw.map((a) => localizeApartment(a, locale));
  const [heroImages, fdmPrices] = await Promise.all([
    getHeroImagesBySlugs(rentalApartments.map((a) => a.slug)),
    getFdmPriceFromMany(rentalApartments.filter((a) => a.fdm_room_use_id).map((a) => a.id)),
  ]);
  const rentalCount = rentalApartments.length;
  const saleCount = saleApartments.length;
  const manager = getSalesManager();
  const aptWord = (n: number) =>
    locale === 'cs' ? (n === 1 ? 'apartmán' : n >= 2 && n <= 4 ? 'apartmány' : 'apartmánů') : n === 1 ? 'apartment' : 'apartments';

  const t = locale === 'cs' ? {
    // Hero — pronájem
    heroClaim: 'Ubytování u lanovky Labská',
    heroTitle1: 'Apartmány k pronájmu ve',
    heroTitle2: 'Špindlerově Mlýně',
    heroText: 'Na kopci nad Labskou přehradou, obklopené stromy, světlem a tichem. Plně vybavené apartmány na víkend i delší pobyt, 50 metrů od lanovky.',
    cta: 'Rezervovat pobyt',
    ctaSecondary: 'Apartmány na prodej',

    // Prodej — původní hero, přesunuto do sekce Prodej
    saleClaim: 'Dokonalá kombinace relaxace na horách a investiční jistoty.',
    saleTitle1: `Poslední ${saleCount} rezidenční ${aptWord(saleCount)} ve`,
    saleTitle2: 'Špindlerově Mlýně',
    saleText: `Na kopci nad Labskou přehradou, obklopené stromy, světlem a tichem, čekají už jen poslední ${saleCount} ${aptWord(saleCount)} na své majitele.`,
    saleCta: 'Prohlédnout apartmány na prodej',
    saleAbout: 'O projektu',
    saleContactLabel: 'Prodej apartmánů',

    section1Title: 'Apartmány ve Špindlu na pár nocí?',
    section1Text: `Naše apartmány patří k tomu nejlepšímu, co ve Špindlerově Mlýně najdete. K pronájmu na víkend nebo pár nocí máme ${rentalCount} ${aptWord(rentalCount)}. Plně vybavené, navržené ve spolupráci s KARE Design.`,
    priceFrom: 'od',
    perNight: 'za noc',
    priceOnRequest: 'Cena na dotaz',
    guests: 'hostů',
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
      apartments: 'Apartmánů k pronájmu',
      distance: 'Od lanovky',
      slope: 'Délka sjezdovky',
      completed: 'Kolaudováno',
      rating: `Hodnocení hostů · ${GUEST_RATING.source}`,
    },

    labelRental: '01 · Pronájem',
    labelLocation: '02 · Lokalita',
    labelSale: '03 · Prodej',
    labelInvestment: '04 · Investiční příležitost',
    altHero: 'Pod Zlatým návrším - Krkonoše',
    altBuilding: 'Apartmány Pod Zlatým návrším',
    altLift: 'Apartmány u lanovky',
  } : {
    // Hero — rental
    heroClaim: 'Stay by the Labská chairlift',
    heroTitle1: 'Apartments for rent in',
    heroTitle2: 'Špindlerův Mlýn',
    heroText: 'On a hill above the Labská dam, surrounded by trees, light and silence. Fully equipped apartments for a weekend or a longer stay, 50 metres from the chairlift.',
    cta: 'Book a stay',
    ctaSecondary: 'Apartments for sale',

    // Sale — former hero, moved to the Sale section
    saleClaim: 'The perfect combination of mountain relaxation and investment security.',
    saleTitle1: `Last ${saleCount} residential ${aptWord(saleCount)} in`,
    saleTitle2: 'Špindlerův Mlýn',
    saleText: `On a hill above the Labská dam, surrounded by trees, light and silence, the last ${saleCount} ${aptWord(saleCount)} await their owners.`,
    saleCta: 'View apartments for sale',
    saleAbout: 'About the project',
    saleContactLabel: 'Apartment sales',

    section1Title: 'Apartments in Špindl for a few nights?',
    section1Text: `Our apartments are among the best you can find in Špindlerův Mlýn. We have ${rentalCount} ${aptWord(rentalCount)} for weekend or short-term rental. Fully equipped, designed in collaboration with KARE Design.`,
    priceFrom: 'from',
    perNight: 'per night',
    priceOnRequest: 'Price on request',
    guests: 'guests',
    section1Link: 'View rental apartments',
    
    section2Title: 'Long-term investment and a quick return',
    section2Text: 'This year inflation will be around 2.5%. Interest rates around 4%. Property prices in the Krkonoše (Giant Mountains) are rising by as much as 10% a year. Because the available apartments are furnished, they can be used and rented out straight away – no waiting, no hassle.',
    section2Link: 'Investment calculator',
    
    section3Title: 'A paradise for skiers and hikers',
    section3Text: 'The apartment buildings are located 50 metres from the Labská chairlift and the red Labská slope, which is 1,770 metres long. The whole ski area will be linked with Hromovka and Svatý Petr.',
    section3Link: 'About the location',
    
    section4Title: 'Choose the purpose of your purchase',
    section4Text: 'Pod Zlatým návrším is a unique investment opportunity that will not be repeated. Secure a stable return, the certainty of a beautiful holiday, or both.',
    
    investiceTitle: 'Investment',
    investiceBenefits: [
      'The investment earns even while you are away',
      'Rental income covers at least the regular fees',
      'We help with both rental and service',
      'A great investment for companies as an employee benefit',
      'You will not find many similar projects in Krkonoše',
    ],
    investiceLink: 'Calculate returns',
    
    rekreaceTitle: 'Recreation',
    rekreaceBenefits: [
      'The operator takes care of service and cleaning',
      'Krkonoše offers both active and restful leisure',
      'Ideal for a large family',
      'Relaxing in the mountains whenever you like',
      'An investment in you and your family',
    ],
    rekreaceLink: 'View apartments',
    
    stats: {
      apartments: 'Apartments for rent',
      distance: 'From the lift',
      slope: 'Slope length',
      completed: 'Completed',
      rating: `Guest rating · ${GUEST_RATING.source}`,
    },

    labelRental: '01 · Rentals',
    labelLocation: '02 · Location',
    labelSale: '03 · Sales',
    labelInvestment: '04 · Investment opportunity',
    altHero: 'Pod Zlatým návrším - the Krkonoše (Giant Mountains)',
    altBuilding: 'Pod Zlatým návrším apartments',
    altLift: 'Apartments by the chairlift',
  };

  return (
    <>
      {/* HERO */}
      {/* pt-20 = výška fixní hlavičky, jinak obsah zajíždí pod ni; svh = skutečná výška na mobilu */}
      <section className="relative min-h-screen min-h-[100svh] pt-20 flex flex-col">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt={t.altHero}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy/80" />
        </div>
        
        <div className="relative z-10 py-4 border-b border-white/10">
          <AlpineOrnament variant="horizontal" className="w-full max-w-md mx-auto h-5 text-gold/40" />
        </div>
        
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10 md:py-0">
          {/* Na mobilu je panel hned pod nadpisem, aby byl vidět bez posouvání */}
          <div className="max-w-5xl mx-auto text-center flex flex-col">
            <p className="text-xs md:text-sm tracking-[0.25em] md:tracking-[0.4em] uppercase text-gold mb-6 md:mb-8">
              {t.heroClaim}
            </p>
            
            <h1 className="mb-6 md:mb-8">
              <span className="block text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-wide leading-[1.15]">
                {t.heroTitle1}
              </span>
              <span className="block text-4xl md:text-5xl lg:text-6xl font-light text-gold italic tracking-wide mt-2">
                {t.heroTitle2}
              </span>
            </h1>
            
            <div className="hidden md:flex md:order-1 items-center justify-center gap-6 my-10">
              <div className="w-20 h-px bg-gradient-to-r from-transparent to-gold/40" />
              <AlpineOrnament variant="diamond" className="w-5 h-5 text-gold/60" />
              <div className="w-20 h-px bg-gradient-to-l from-transparent to-gold/40" />
            </div>
            
            <p className="order-2 text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mt-8 md:mt-0 mb-10 font-light leading-relaxed">
              {t.heroText}
            </p>

            <div className="order-1 md:order-3 w-full max-w-3xl mx-auto md:mb-6">
              <DateSearchBar />
            </div>
            
            <div className="order-3 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="inline-block px-10 py-4 border border-white/30 text-white text-sm tracking-[0.2em] uppercase hover:bg-white/10 hover:border-gold transition-all duration-500"
              >
                {t.cta}
              </Link>
              <Link 
                href="/suites"
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
        
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 hidden [@media(min-width:768px)_and_(min-height:1080px)]:flex flex-col items-center gap-3">
          <span className="text-xs tracking-[0.3em] uppercase text-white/40">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
        </div>
        
        <div className="absolute top-20 left-6 w-16 h-16 text-gold/20 hidden md:block">
          <AlpineOrnament variant="corner" className="w-full h-full" />
        </div>
        <div className="absolute top-20 right-6 w-16 h-16 text-gold/20 rotate-90 hidden md:block">
          <AlpineOrnament variant="corner" className="w-full h-full" />
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-16 bg-cream border-b border-navy/10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <Stat value={String(rentalCount)} label={t.stats.apartments} />
            <Stat value="50" unit="m" label={t.stats.distance} />
            <Stat value={locale === 'en' ? '1,770' : '1 770'} unit="m" label={t.stats.slope} />
            <Stat value={formatScore(GUEST_RATING.score, locale)} unit="/10" label={t.stats.rating} />
          </div>
        </div>
      </section>

      {/* SECTION 1 - Pronájem */}
      <section className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 text-gold/30">
                <AlpineOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 text-gold/30 rotate-180">
                <AlpineOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/building-front.jpg"
                  alt={t.altBuilding}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <div>
              <SectionLabel>{t.labelRental}</SectionLabel>
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

      {/* PRONÁJEM — karty apartmánů s cenou z Front Desk Master */}
      <section className="pb-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentalApartments.map((apt) => {
              const img = heroImages[apt.slug] ?? null;
              const price = fdmPrices[apt.id];
              return (
                <Link
                  key={apt.slug}
                  href={`/apartmany-spindleruv-mlyn-pronajem/${apt.slug}`}
                  className="group block bg-white border border-navy/5"
                >
                  <div className="relative aspect-[4/3] bg-stone overflow-hidden">
                    {img ? (
                      <Image
                        src={img}
                        alt={apt.title ?? ''}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-navy/10" />
                    )}
                  </div>
                  <div className="p-5 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-light text-navy group-hover:text-gold transition-colors"><ApartmentTitle title={apt.title} /></h3>
                      <p className="text-xs text-navy/50 mt-1">
                        {layoutLabel(apt.layout, locale)}
                        {apt.area_m2 ? ` · ${Number(apt.area_m2).toLocaleString(locale === 'en' ? 'en-GB' : 'cs-CZ')} m²` : ''}
                        {apt.max_guests ? ` · ${apt.max_guests} ${t.guests}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {price ? (
                        <>
                          <p className="text-lg font-light text-navy">
                            {t.priceFrom} {formatMoney(price.cents, price.currency, locale)}
                          </p>
                          <p className="text-[11px] text-navy/40">{t.perNight}</p>
                        </>
                      ) : (
                        <p className="text-xs text-navy/50">{t.priceOnRequest}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/apartmany-spindleruv-mlyn-pronajem"
              className="inline-block px-10 py-4 bg-navy text-white text-sm tracking-[0.2em] uppercase hover:bg-gold hover:text-navy transition-colors duration-500"
            >
              {t.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3 - Lokalita */}
      <section className="py-32 bg-navy text-white relative overflow-hidden">
        <MountainSilhouette className="absolute bottom-0 left-0 right-0 h-48 text-white/5" />
        
        <div className="absolute top-8 left-8 w-16 h-16 text-gold/20 hidden md:block">
          <AlpineOrnament variant="corner" className="w-full h-full" />
        </div>
        <div className="absolute bottom-8 right-8 w-16 h-16 text-gold/20 rotate-180 hidden md:block">
          <AlpineOrnament variant="corner" className="w-full h-full" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <SectionLabel light>{t.labelLocation}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light mt-4 mb-6 tracking-wide">
            {t.section3Title}
          </h2>
          <p className="text-white/60 leading-relaxed mb-10 text-lg max-w-2xl mx-auto">
            {t.section3Text}
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/30" />
            <AlpineOrnament variant="diamond" className="w-4 h-4 text-gold/50" />
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

      {/* PRODEJ — původní hero (poslední apartmány na prodej) + kontakt prodeje */}
      <section className="py-32 bg-stone border-t border-navy/10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <SectionLabel>{t.labelSale}</SectionLabel>
          <p className="text-sm tracking-[0.3em] uppercase text-gold mt-6 mb-6">
            {t.saleClaim}
          </p>
          <h2 className="mb-8">
            <span className="block text-3xl md:text-4xl font-light text-navy tracking-wide leading-[1.2]">
              {t.saleTitle1}
            </span>
            <span className="block text-3xl md:text-4xl font-light text-gold italic tracking-wide mt-2">
              {t.saleTitle2}
            </span>
          </h2>
          <p className="text-lg text-navy/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.saleText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              href="/suites"
              className="inline-block px-10 py-4 bg-navy text-white text-sm tracking-[0.2em] uppercase hover:bg-gold hover:text-navy transition-colors duration-500"
            >
              {t.saleCta}
            </Link>
            <Link
              href="/o-projektu"
              className="inline-block px-10 py-4 border border-navy/30 text-navy text-sm tracking-[0.2em] uppercase hover:border-gold hover:text-gold transition-colors duration-500"
            >
              {t.saleAbout}
            </Link>
          </div>
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm text-navy/60">
            <span className="text-xs uppercase tracking-widest text-navy/40">{t.saleContactLabel}</span>
            <span className="text-navy">{manager.name}</span>
            <a href={`tel:${manager.phone.replace(/\s/g, '')}`} className="hover:text-gold transition-colors">{manager.phone}</a>
            <a href={`mailto:${manager.email}`} className="hover:text-gold transition-colors">{manager.email}</a>
          </div>
        </div>
      </section>

      {/* SECTION 2 - Investice */}
      <section className="py-32 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <SectionLabel>{t.labelInvestment}</SectionLabel>
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
                <AlpineOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 text-gold/30 -rotate-90">
                <AlpineOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/building-lift.jpg"
                  alt={t.altLift}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - Účel koupě */}
      <section className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <AlpineOrnament variant="simple" className="w-32 h-3 text-gold/40 mx-auto mb-8" />
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
                <AlpineOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute bottom-0 right-0 w-12 h-12 text-gold/20 rotate-180">
                <AlpineOrnament variant="corner" className="w-full h-full" />
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
                <AlpineOrnament variant="corner" className="w-full h-full" />
              </div>
              <div className="absolute bottom-0 right-0 w-12 h-12 text-navy/10 group-hover:text-gold/30 rotate-180 transition-colors">
                <AlpineOrnament variant="corner" className="w-full h-full" />
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
