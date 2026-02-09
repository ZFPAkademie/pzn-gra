/**
 * Nemovitostní produkt - Landing Page
 * Sprint 4: Investment shares product
 * URL: /nemovitostni-produkt
 */

import { cookies } from 'next/headers';
import Link from 'next/link';
import { Container, Section } from '@/components/ui';
import { ShareRequestCTA } from './client';

export const metadata = {
  title: 'Nemovitostní produkt – Podíl na apartmánu | Pod Zlatým návrším',
  description: 'Získejte družstevní podíl na horském apartmánu ve Špindlerově Mlýně. Nemovitost v prémiové lokalitě, podíl na výnosech z pronájmu, možnost vlastního využití se slevou.',
};

// Benefits data - per brief
const benefits = [
  {
    title: 'Anonymita vlastnictví',
    description: 'Dle struktury družstevního podílu',
  },
  {
    title: 'Jednoduchost a rychlost sjednání',
    description: 'Podpis jedné smlouvy',
  },
  {
    title: 'Zhodnocení podílu v čase',
    description: 'Orientačně 5–10 % ročně',
  },
  {
    title: 'Výnos z nájmu',
    description: 'Orientačně 2–5 % ročně, vypláceno pololetně',
  },
  {
    title: '50 podílů na jeden apartmán',
    description: 'Možnost koupě libovolného počtu',
  },
  {
    title: 'Růst hodnoty nemovitostí',
    description: 'V lukrativních lokalitách',
  },
  {
    title: 'Podíl na zisku',
    description: 'Z turistického pronájmu',
  },
  {
    title: '20% sleva na ubytování',
    description: 'Pro držitele podílu',
  },
  {
    title: 'Diverzifikace majetku',
    description: 'O podíl na reálné nemovitosti',
  },
];

// Process steps - per brief
const steps = [
  {
    number: '01',
    title: 'Nezávazná konzultace',
    description: 'Zjistíte vše potřebné o produktu a odpovíme na vaše dotazy.',
  },
  {
    number: '02',
    title: 'Výběr apartmánu a počtu podílů',
    description: 'Vyberete si konkrétní apartmán a počet podílů, které chcete získat.',
  },
  {
    number: '03',
    title: 'Podpis jedné smlouvy',
    description: 'Jednoduché smluvní řešení bez zbytečné administrativy.',
  },
  {
    number: '04',
    title: 'Správa a výplata výnosů',
    description: 'O vše se postaráme. Výnosy vyplácíme pololetně.',
  },
];

export default async function NemovitostniProduktPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('locale')?.value || 'cs';

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <Section className="bg-navy text-white py-20 md:py-28">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight uppercase tracking-wide">
              Kupte si podíl na apartmánu ve Špindlu
            </h1>
            <p className="text-lg md:text-xl text-stone-400 leading-relaxed mb-8">
              Získejte <strong className="text-white">družstevní podíl</strong> na horském apartmánu 
              ve Špindlerově Mlýně. Nemovitost v prémiové lokalitě, <strong className="text-white">podíl 
              na výnosech z pronájmu</strong>, možnost <strong className="text-white">vlastního využití 
              se slevou</strong> a jednoduché smluvní řešení.
            </p>
            <ShareRequestCTA locale={locale} />
          </div>
        </Container>
      </Section>

      {/* Pro koho je tento produkt */}
      <Section className="py-16 md:py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4">
              Pro koho je tento produkt
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-700">
                Pro investory hledající <strong>nemovitostní expozici</strong> bez nutnosti koupě celé jednotky.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-700">
                Pro zájemce o <strong>diverzifikaci portfolia</strong>.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-slate-700">
                Pro ty, kteří chtějí hory nejen vlastnit, ale i <strong>využívat</strong>.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Hlavní výhody */}
      <Section className="py-16 md:py-20 bg-stone">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4">
              Hlavní výhody
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-stone-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy mb-1">{benefit.title}</h3>
                    <p className="text-sm text-stone-700">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Jak to funguje */}
      <Section className="py-16 md:py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4">
              Jak to funguje
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gold mb-4">{step.number}</div>
                <h3 className="font-semibold text-navy mb-2">{step.title}</h3>
                <p className="text-sm text-stone-700">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section className="py-16 md:py-20 bg-navy text-white">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Máte zájem o podíl na apartmánu?
            </h2>
            <p className="text-stone-400 mb-8">
              Zanechte nám kontakt a my vám připravíme nezávaznou nabídku.
            </p>
            <ShareRequestCTA locale={locale} variant="light" />
          </div>
        </Container>
      </Section>

      {/* Legal Note */}
      <Section className="py-8 bg-stone">
        <Container>
          <p className="text-xs text-slate-500 text-center max-w-3xl mx-auto">
            Uvedené výnosy a zhodnocení jsou orientační a mohou se lišit v závislosti na obsazenosti a tržních podmínkách.
          </p>
        </Container>
      </Section>

      {/* Link to Investment */}
      <Section className="py-12 border-t border-stone-300">
        <Container>
          <div className="text-center">
            <p className="text-stone-700 mb-4">
              Máte zájem o koupi celého apartmánu?
            </p>
            <Link 
              href="/investicni-prilezitost" 
              className="text-gold hover:text-amber-700 font-medium inline-flex items-center gap-2"
            >
              Zobrazit investiční příležitost
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
