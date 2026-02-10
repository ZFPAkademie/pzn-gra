/**
 * Nemovitostní produkt - Design 2030
 * Kompletní obsah + nový design
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { ShareRequestCTA } from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nemovitostní produkt – Podíl na apartmánu | Pod Zlatým návrším',
  description: 'Získejte družstevní podíl na horském apartmánu ve Špindlerově Mlýně. Nemovitost v prémiové lokalitě, podíl na výnosech z pronájmu, možnost vlastního využití se slevou.',
};

// Benefits data - kompletní původní obsah
const benefits = [
  { title: 'Anonymita vlastnictví', description: 'Dle struktury družstevního podílu' },
  { title: 'Jednoduchost a rychlost', description: 'Podpis jedné smlouvy' },
  { title: 'Zhodnocení podílu', description: 'Orientačně 5–10 % ročně' },
  { title: 'Výnos z nájmu', description: 'Orientačně 2–5 % ročně, vypláceno pololetně' },
  { title: '50 podílů na apartmán', description: 'Možnost koupě libovolného počtu' },
  { title: 'Růst hodnoty nemovitostí', description: 'V lukrativních lokalitách' },
  { title: 'Podíl na zisku', description: 'Z turistického pronájmu' },
  { title: '20% sleva na ubytování', description: 'Pro držitele podílu' },
  { title: 'Diverzifikace majetku', description: 'O podíl na reálné nemovitosti' },
];

// Process steps
const steps = [
  { number: '01', title: 'Nezávazná konzultace', description: 'Zjistíte vše potřebné o produktu a odpovíme na vaše dotazy.' },
  { number: '02', title: 'Výběr apartmánu a počtu podílů', description: 'Vyberete si konkrétní apartmán a počet podílů, které chcete získat.' },
  { number: '03', title: 'Podpis jedné smlouvy', description: 'Jednoduché smluvní řešení bez zbytečné administrativy.' },
  { number: '04', title: 'Správa a výplata výnosů', description: 'O vše se postaráme. Výnosy vyplácíme pololetně.' },
];

export default async function NemovitostniProduktPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            Nemovitostní produkt
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            Kupte si podíl na apartmánu ve Špindlu
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
            Získejte <strong className="text-white">družstevní podíl</strong> na horském apartmánu 
            ve Špindlerově Mlýně. Nemovitost v prémiové lokalitě, <strong className="text-white">podíl 
            na výnosech z pronájmu</strong>, možnost <strong className="text-white">vlastního využití 
            se slevou</strong> a jednoduché smluvní řešení.
          </p>
          <ShareRequestCTA locale={locale} />
        </div>
      </section>

      {/* Pro koho je tento produkt */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            Pro koho je tento produkt
          </h2>
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-navy/70 leading-relaxed">
                Pro investory hledající <strong className="text-navy">nemovitostní expozici</strong> bez nutnosti koupě celé jednotky.
              </p>
            </div>
            <div className="text-center">
              <p className="text-navy/70 leading-relaxed">
                Pro zájemce o <strong className="text-navy">diverzifikaci portfolia</strong>.
              </p>
            </div>
            <div className="text-center">
              <p className="text-navy/70 leading-relaxed">
                Pro ty, kteří chtějí hory nejen vlastnit, ale i <strong className="text-navy">využívat</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hlavní výhody - kompletní seznam */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            Hlavní výhody
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="py-6 border-b border-navy/10">
                <div className="flex items-start gap-4">
                  <span className="text-gold text-sm font-medium">0{index + 1}</span>
                  <div>
                    <h3 className="text-navy font-medium mb-2">{benefit.title}</h3>
                    <p className="text-sm text-navy/50">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to funguje - 4 kroky */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            Jak to funguje
          </h2>
          <div className="grid md:grid-cols-4 gap-12 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-light text-gold mb-6">{step.number}</div>
                <h3 className="text-navy font-medium mb-3">{step.title}</h3>
                <p className="text-sm text-navy/50 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Máte zájem o podíl na apartmánu?
          </h2>
          <p className="text-white/50 mb-10 max-w-md mx-auto">
            Zanechte nám kontakt a my vám připravíme nezávaznou nabídku.
          </p>
          <ShareRequestCTA locale={locale} variant="light" />
        </div>
      </section>

      {/* Legal Note */}
      <section className="py-8 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-navy/40 text-center max-w-3xl mx-auto">
            Uvedené výnosy a zhodnocení jsou orientační a mohou se lišit v závislosti na obsazenosti a tržních podmínkách.
          </p>
        </div>
      </section>

      {/* Link to Investment */}
      <section className="py-16 bg-cream border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">
            Máte zájem o koupi celého apartmánu?
          </p>
          <Link 
            href="/investicni-prilezitost"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            Zobrazit investiční příležitost
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
