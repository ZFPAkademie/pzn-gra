/**
 * Investiční kalkulačka - Design 2030
 * Content from XLSX: "Investice - kalkulačka"
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getRequestLocale } from '@/lib/i18n-server';
import { InvestmentCalculator } from './calculator';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getRequestLocale();
  return locale === 'cs'
    ? {
        title: 'Investice apartmány Krkonoše | Pod Zlatým návrším',
        description: 'Spočítejte si výnos z investice do apartmánu ve Špindlerově Mlýně. Interaktivní kalkulačka, DPH úspora, služba Rentier.',
      }
    : {
        title: 'Apartment investment in the Krkonoše | Pod Zlatým návrším',
        description: 'Calculate the return on an investment in an apartment in Špindlerův Mlýn. Interactive calculator, VAT savings, the Rentier service.',
      };
}

export default function KalkulackaPage() {
  const locale = getRequestLocale();
  const t = locale === 'cs' ? {
    heroLabel: 'Investiční příležitost',
    heroTitle: 'Investice do apartmánu v Krkonoších',
    heroText: 'Dva apartmány z pěti jsme vybavili, zařídili a zalistovali ke krátkodobému pronájmu. Kupujete apartmán, který už funguje – může vám začít vydělávat od prvního dne.',
    comboTitle: 'Spojení rekreace a investice',
    comboText: 'Díky krátkodobému pronájmu můžete mít výnos i ve chvílích, kdy apartmán nevyužíváte. Jen 50 metrů od lanovky Labská, s výhledem na přehradu.',
    exampleTitle: 'Příklad výpočtu (50% obsazenost)',
    ex1Value: '1 260 000',
    ex1Label: 'Roční nájemné (100%)',
    ex1Note: 'cca 3 500 Kč/noc',
    ex2Value: '630 000',
    ex2Label: 'Při 50% obsazenosti',
    ex2Note: 'příjem Kč',
    ex3Value: '200 000',
    ex3Label: 'Náklady provozu',
    ex3Note: 'služba Rentier',
    ex4Value: '430 000',
    ex4Label: 'Čistý výnos',
    ex4Note: 'Kč ročně',
    calcTitle: 'Spočítejte si výnos ze své investice',
    vatTitle: 'DPH úspora při koupi na firmu',
    vatText: 'Při koupi prostřednictvím firmy můžete ušetřit 21 % DPH. Významná úspora, která zlepší návratnost vaší investice.',
    vatExample: 'Příklad: Apartmán',
    vatPrice: '8 790 000 Kč',
    vatIncl: 'vč. DPH',
    vatNetLabel: 'Cena bez DPH',
    vatNet: '7 264 462 Kč',
    vatSavingLabel: 'Úspora',
    vatSaving: '1 525 537 Kč',
    rentierLabel: 'Služba Rentier',
    rentierTitle: 'Komplexní péče o pronájem vašeho apartmánu',
    rentierItems: [
      { letter: 'a', title: 'Prezentace na webu', desc: 'podzlatymnavrsim.cz' },
      { letter: 'b', title: 'Prezentace na portálech', desc: 'booking.com, airbnb.com, expedia.com' },
      { letter: 'c', title: 'Komunikace s hosty', desc: 'Rezervace, dotazy, speciální požadavky' },
      { letter: 'd', title: 'Inkaso plateb', desc: 'Kauce, zálohy, vyúčtování' },
      { letter: 'e', title: 'Evidence hostů', desc: 'Splnění všech zákonných předpisů' },
      { letter: 'f', title: 'Úklid a příprava', desc: 'Praní, žehlení, příprava pro další hosty' },
    ],
    ctaText: 'Máte zájem o koupi apartmánu?',
    ctaLink: 'Zobrazit dostupné apartmány',
    disclaimer: 'Uvedené výpočty jsou orientační a vycházejí z modelových předpokladů. Skutečný výnos závisí na obsazenosti, tržních podmínkách a provozních nákladech. Nejde o zaručený výnos ani o investiční poradenství.',
  } : {
    heroLabel: 'Investment opportunity',
    heroTitle: 'Investing in an apartment in the Krkonoše (Giant Mountains)',
    heroText: 'We have equipped, furnished and listed two of the five apartments for short-term rental. You are buying an apartment that is already up and running – it can start earning for you from day one.',
    comboTitle: 'Combining recreation and investment',
    comboText: 'Thanks to short-term rental, you can earn a return even when you are not using the apartment. Just 50 metres from the Labská chairlift, overlooking the dam.',
    exampleTitle: 'Example calculation (50% occupancy)',
    ex1Value: '1,260,000',
    ex1Label: 'Annual rent (100%)',
    ex1Note: 'approx. CZK 3,500/night',
    ex2Value: '630,000',
    ex2Label: 'At 50% occupancy',
    ex2Note: 'income, CZK',
    ex3Value: '200,000',
    ex3Label: 'Operating costs',
    ex3Note: 'Rentier service',
    ex4Value: '430,000',
    ex4Label: 'Net return',
    ex4Note: 'CZK per year',
    calcTitle: 'Calculate the return on your investment',
    vatTitle: 'VAT savings when buying through a company',
    vatText: 'When buying through a company, you can save 21% VAT. A significant saving that improves the payback of your investment.',
    vatExample: 'Example: Apartment',
    vatPrice: 'CZK 8,790,000',
    vatIncl: 'incl. VAT',
    vatNetLabel: 'Price excl. VAT',
    vatNet: 'CZK 7,264,462',
    vatSavingLabel: 'Saving',
    vatSaving: 'CZK 1,525,537',
    rentierLabel: 'Rentier service',
    rentierTitle: 'Comprehensive care for the rental of your apartment',
    rentierItems: [
      { letter: 'a', title: 'Presentation on the website', desc: 'podzlatymnavrsim.cz' },
      { letter: 'b', title: 'Presentation on booking portals', desc: 'booking.com, airbnb.com, expedia.com' },
      { letter: 'c', title: 'Guest communication', desc: 'Reservations, enquiries, special requests' },
      { letter: 'd', title: 'Payment collection', desc: 'Security deposits, advance payments, final settlement' },
      { letter: 'e', title: 'Guest registration', desc: 'Compliance with all legal requirements' },
      { letter: 'f', title: 'Cleaning and preparation', desc: 'Laundry, ironing, preparation for the next guests' },
    ],
    ctaText: 'Interested in buying an apartment?',
    ctaLink: 'View available apartments',
    disclaimer: 'The calculations shown are indicative and based on model assumptions. The actual return depends on occupancy, market conditions and operating costs. This is neither a guaranteed return nor investment advice.',
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            {t.heroLabel}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
            {t.heroText}
          </p>
        </div>
      </section>

      {/* Spojení rekreace a investice */}
      <section className="py-16 bg-gold">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-light text-navy mb-4">{t.comboTitle}</h2>
          <p className="text-navy/70 max-w-3xl">
            {t.comboText}
          </p>
        </div>
      </section>

      {/* Příklad výpočtu */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-6">
            {t.exampleTitle}
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center p-6 bg-white">
              <p className="text-3xl font-light text-gold mb-2">{t.ex1Value}</p>
              <p className="text-xs text-navy/50">{t.ex1Label}</p>
              <p className="text-xs text-navy/30">{t.ex1Note}</p>
            </div>
            <div className="text-center p-6 bg-white">
              <p className="text-3xl font-light text-gold mb-2">{t.ex2Value}</p>
              <p className="text-xs text-navy/50">{t.ex2Label}</p>
              <p className="text-xs text-navy/30">{t.ex2Note}</p>
            </div>
            <div className="text-center p-6 bg-white">
              <p className="text-3xl font-light text-navy mb-2">{t.ex3Value}</p>
              <p className="text-xs text-navy/50">{t.ex3Label}</p>
              <p className="text-xs text-navy/30">{t.ex3Note}</p>
            </div>
            <div className="text-center p-6 bg-navy">
              <p className="text-3xl font-light text-gold mb-2">{t.ex4Value}</p>
              <p className="text-xs text-white/50">{t.ex4Label}</p>
              <p className="text-xs text-white/30">{t.ex4Note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interaktivní kalkulačka */}
      <section className="py-24 bg-stone">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-light text-navy text-center mb-12">
            {t.calcTitle}
          </h2>
          <InvestmentCalculator locale={locale} />
        </div>
      </section>

      {/* DPH úspora */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">
                {t.vatTitle}
              </h2>
              <p className="text-navy/70 mb-8 leading-relaxed">
                {t.vatText}
              </p>
            </div>
            <div className="bg-navy p-8">
              <p className="text-white/50 text-sm mb-2">{t.vatExample}</p>
              <p className="text-gold text-2xl font-light mb-4">{t.vatPrice} <span className="text-white/30 text-base">{t.vatIncl}</span></p>
              <div className="border-t border-white/10 pt-4 mb-4">
                <p className="text-white/50 text-sm mb-2">{t.vatNetLabel}</p>
                <p className="text-white text-xl">{t.vatNet}</p>
              </div>
              <div className="bg-gold/20 p-4 -mx-4 -mb-4">
                <p className="text-gold text-sm mb-1">{t.vatSavingLabel}</p>
                <p className="text-gold text-3xl font-light">{t.vatSaving}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Služba Rentier */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-gold uppercase tracking-widest text-center mb-4">
            {t.rentierLabel}
          </h2>
          <p className="text-3xl font-light text-white text-center mb-16 max-w-2xl mx-auto">
            {t.rentierTitle}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.rentierItems.map((item) => (
              <div key={item.letter} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-medium">{item.letter}</span>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">{item.title}</p>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-cream">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">
            {t.ctaText}
          </p>
          <Link 
            href="/suites"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            {t.ctaLink}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-navy/40 text-center max-w-3xl mx-auto">
            {t.disclaimer}
          </p>
        </div>
      </section>
    </>
  );
}
