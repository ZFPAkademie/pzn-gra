/**
 * Investiční příležitost
 * Production v1: Investment landing page
 * 
 * URL: /investicni-prilezitost
 * 
 * CTA: "Kontaktovat investiční tým"
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { InvestmentCTA } from './client';

export const metadata: Metadata = {
  title: 'Investiční příležitost | Pod Zlatým návrším',
  description: 'Investujte do luxusních apartmánů v Krkonoších. Stabilní zhodnocení s možností vlastního využití.',
  keywords: 'investice apartmány, investiční nemovitost, Krkonoše, pasivní příjem, zhodnocení',
};

export default async function InvestmentPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    subtitle: 'Pod Zlatým návrším',
    title: 'Investiční příležitost',
    description: 'Investujte do nemovitosti v nejžádanější horské destinaci České republiky. Kombinace luxusního bydlení, stabilního zhodnocení a možnosti vlastního využití.',
    
    whyTitle: 'Proč investovat do apartmánu v Krkonoších',
    whyItems: [
      {
        icon: '🏔️',
        title: 'Prémiová lokalita',
        desc: 'Špindlerův Mlýn je nejnavštěvovanější horské středisko v ČR s celoroční atraktivitou.',
      },
      {
        icon: '📈',
        title: 'Růst hodnoty',
        desc: 'Nemovitosti v horských oblastech dlouhodobě rostou na hodnotě rychleji než průměr.',
      },
      {
        icon: '💰',
        title: 'Výnosy z pronájmu',
        desc: 'Vysoká obsazenost díky celoroční poptávce — lyžování v zimě, turistika v létě.',
      },
      {
        icon: '🏠',
        title: 'Vlastní využití',
        desc: 'Užijte si vlastní apartmán kdykoliv během roku, zbytek pronajímejte.',
      },
      {
        icon: '🛎️',
        title: 'Profesionální správa',
        desc: 'O vše se postaráme — marketing, rezervace, úklid, údržba.',
      },
      {
        icon: '📋',
        title: 'Bez starostí',
        desc: 'Pasivní příjem bez nutnosti aktivní správy nemovitosti.',
      },
    ],
    
    numbersTitle: 'Proč právě teď',
    numbers: [
      { value: '2M+', label: 'návštěvníků Krkonoš ročně' },
      { value: '85%', label: 'průměrná obsazenost' },
      { value: '7%+', label: 'očekávaný roční výnos' },
    ],
    
    processTitle: 'Jak to funguje',
    processSteps: [
      { step: '01', title: 'Konzultace', desc: 'Probereme vaše požadavky a představíme možnosti.' },
      { step: '02', title: 'Výběr apartmánu', desc: 'Pomůžeme vám vybrat ideální jednotku.' },
      { step: '03', title: 'Nákup', desc: 'Zajistíme hladký průběh celé transakce.' },
      { step: '04', title: 'Správa', desc: 'Převezmeme kompletní správu a pronájem.' },
    ],
    
    ctaTitle: 'Začněte investovat',
    ctaText: 'Kontaktujte náš investiční tým pro nezávaznou konzultaci a podrobné informace o dostupných jednotkách a očekávaných výnosech.',
    ctaButton: 'Kontaktovat investiční tým',
    
    disclaimerTitle: 'Důležité upozornění',
    disclaimer: 'Uvedené výnosy jsou orientační a vycházejí z historických dat. Skutečné výnosy se mohou lišit v závislosti na tržních podmínkách a obsazenosti.',
  } : {
    subtitle: 'Pod Zlatým návrším',
    title: 'Investment opportunity',
    description: 'Invest in real estate in the most sought-after mountain destination in the Czech Republic. A combination of luxury living, stable appreciation, and personal use options.',
    
    whyTitle: 'Why invest in an apartment in the Giant Mountains',
    whyItems: [
      {
        icon: '🏔️',
        title: 'Premium location',
        desc: 'Špindlerův Mlýn is the most visited mountain resort in the Czech Republic with year-round appeal.',
      },
      {
        icon: '📈',
        title: 'Value growth',
        desc: 'Real estate in mountain areas appreciates faster than average in the long term.',
      },
      {
        icon: '💰',
        title: 'Rental income',
        desc: 'High occupancy due to year-round demand — skiing in winter, hiking in summer.',
      },
      {
        icon: '🏠',
        title: 'Personal use',
        desc: 'Enjoy your own apartment anytime during the year, rent out the rest.',
      },
      {
        icon: '🛎️',
        title: 'Professional management',
        desc: 'We take care of everything — marketing, reservations, cleaning, maintenance.',
      },
      {
        icon: '📋',
        title: 'Hassle-free',
        desc: 'Passive income without the need for active property management.',
      },
    ],
    
    numbersTitle: 'Why now',
    numbers: [
      { value: '2M+', label: 'visitors to the Giant Mountains annually' },
      { value: '85%', label: 'average occupancy' },
      { value: '7%+', label: 'expected annual return' },
    ],
    
    processTitle: 'How it works',
    processSteps: [
      { step: '01', title: 'Consultation', desc: 'We discuss your requirements and present options.' },
      { step: '02', title: 'Selection', desc: 'We help you choose the ideal unit.' },
      { step: '03', title: 'Purchase', desc: 'We ensure a smooth transaction process.' },
      { step: '04', title: 'Management', desc: 'We take over complete management and rental.' },
    ],
    
    ctaTitle: 'Start investing',
    ctaText: 'Contact our investment team for a non-binding consultation and detailed information about available units and expected returns.',
    ctaButton: 'Contact investment team',
    
    disclaimerTitle: 'Important notice',
    disclaimer: 'Stated returns are indicative and based on historical data. Actual returns may vary depending on market conditions and occupancy.',
  };

  return (
    <>
      {/* Header */}
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-amber-400 font-medium mb-4">{t.subtitle}</p>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            {t.description}
          </p>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-12 text-center">
            {t.whyTitle}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.whyItems.map((item, index) => (
              <div key={index} className="p-6 bg-slate-50 rounded-lg">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-12 text-center">
            {t.numbersTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {t.numbers.map((item, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-light text-amber-400 mb-2">
                  {item.value}
                </div>
                <div className="text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-12 text-center">
            {t.processTitle}
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {t.processSteps.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-light text-amber-500 mb-4">{item.step}</div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-slate-600 mb-8">
            {t.ctaText}
          </p>
          <InvestmentCTA label={t.ctaButton} locale={locale} />
        </div>
      </section>

      {/* Link to Nemovitostní produkt */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-slate-600 mb-4">
            {locale === 'cs' 
              ? 'Nechcete kupovat celý apartmán? Zvažte koupi podílu.' 
              : 'Don\'t want to buy a whole apartment? Consider buying a share.'}
          </p>
          <Link 
            href="/nemovitostni-produkt" 
            className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-2"
          >
            {locale === 'cs' ? 'Zjistit více o nemovitostním produktu' : 'Learn more about real estate shares'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-500">{t.disclaimerTitle}:</strong> {t.disclaimer}
          </p>
        </div>
      </section>
    </>
  );
}
