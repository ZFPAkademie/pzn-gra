/**
 * Investiční kalkulačka - Design 2030
 * Content from XLSX: "Investice - kalkulačka"
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { InvestmentCalculator } from './calculator';

export const metadata: Metadata = {
  title: 'Investice apartmány Krkonoše | Pod Zlatým návrším',
  description: 'Spočítejte si výnos z investice do apartmánu ve Špindlerově Mlýně. Interaktivní kalkulačka, DPH úspora, služba Rentier.',
};

export default function KalkulackaPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            Investiční příležitost
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            Investice do apartmánu v Krkonoších
          </h1>
          <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
            Dva apartmány z pěti jsme vybavili, zařídili a zalistovali ke krátkodobému pronájmu. 
            Kupujete apartmán, který už funguje – může vám začít vydělávat od prvního dne.
          </p>
        </div>
      </section>

      {/* Spojení rekreace a investice */}
      <section className="py-16 bg-gold">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-light text-navy mb-4">Spojení rekreace a investice</h2>
          <p className="text-navy/70 max-w-3xl">
            Díky krátkodobému pronájmu můžete mít výnos i ve chvílích, kdy apartmán nevyužíváte. 
            Jen 50 metrů od lanovky Labská, s výhledem na přehradu.
          </p>
        </div>
      </section>

      {/* Příklad výpočtu */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-6">
            Příklad výpočtu (50% obsazenost)
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center p-6 bg-white">
              <p className="text-3xl font-light text-gold mb-2">1 260 000</p>
              <p className="text-xs text-navy/50">Roční nájemné (100%)</p>
              <p className="text-xs text-navy/30">cca 3 500 Kč/noc</p>
            </div>
            <div className="text-center p-6 bg-white">
              <p className="text-3xl font-light text-gold mb-2">630 000</p>
              <p className="text-xs text-navy/50">Při 50% obsazenosti</p>
              <p className="text-xs text-navy/30">příjem Kč</p>
            </div>
            <div className="text-center p-6 bg-white">
              <p className="text-3xl font-light text-navy mb-2">200 000</p>
              <p className="text-xs text-navy/50">Náklady provozu</p>
              <p className="text-xs text-navy/30">služba Rentier</p>
            </div>
            <div className="text-center p-6 bg-navy">
              <p className="text-3xl font-light text-gold mb-2">430 000</p>
              <p className="text-xs text-white/50">Čistý výnos</p>
              <p className="text-xs text-white/30">Kč ročně</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interaktivní kalkulačka */}
      <section className="py-24 bg-stone">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-light text-navy text-center mb-12">
            Spočítejte si výnos ze své investice
          </h2>
          <InvestmentCalculator />
        </div>
      </section>

      {/* DPH úspora */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">
                DPH úspora při koupi na firmu
              </h2>
              <p className="text-navy/70 mb-8 leading-relaxed">
                Při koupi prostřednictvím firmy můžete ušetřit 21 % DPH. 
                Významná úspora, která zlepší návratnost vaší investice.
              </p>
            </div>
            <div className="bg-navy p-8">
              <p className="text-white/50 text-sm mb-2">Příklad: Apartmán</p>
              <p className="text-gold text-2xl font-light mb-4">8 790 000 Kč <span className="text-white/30 text-base">vč. DPH</span></p>
              <div className="border-t border-white/10 pt-4 mb-4">
                <p className="text-white/50 text-sm mb-2">Cena bez DPH</p>
                <p className="text-white text-xl">7 264 462 Kč</p>
              </div>
              <div className="bg-gold/20 p-4 -mx-4 -mb-4">
                <p className="text-gold text-sm mb-1">Úspora</p>
                <p className="text-gold text-3xl font-light">1 525 537 Kč</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Služba Rentier */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-gold uppercase tracking-widest text-center mb-4">
            Služba Rentier
          </h2>
          <p className="text-3xl font-light text-white text-center mb-16 max-w-2xl mx-auto">
            Komplexní péče o pronájem vašeho apartmánu
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { letter: 'a', title: 'Prezentace na webu', desc: 'podzlatymnavrsim.cz' },
              { letter: 'b', title: 'Prezentace na portálech', desc: 'booking.com, airbnb.com, expedia.com' },
              { letter: 'c', title: 'Komunikace s hosty', desc: 'Rezervace, dotazy, speciální požadavky' },
              { letter: 'd', title: 'Inkaso plateb', desc: 'Kauce, zálohy, vyúčtování' },
              { letter: 'e', title: 'Evidence hostů', desc: 'Splnění všech zákonných předpisů' },
              { letter: 'f', title: 'Úklid a příprava', desc: 'Praní, žehlení, příprava pro další hosty' },
            ].map((item) => (
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
            Máte zájem o koupi apartmánu?
          </p>
          <Link 
            href="/suites"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            Zobrazit dostupné apartmány
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
            Uvedené výpočty jsou orientační a vycházejí z modelových předpokladů. 
            Skutečný výnos závisí na obsazenosti, tržních podmínkách a provozních nákladech. 
            Nejde o zaručený výnos ani o investiční poradenství.
          </p>
        </div>
      </section>
    </>
  );
}
