/**
 * Nemovitostní produkt - Design 2030
 * Updated content + Jurkovič-inspired icons
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

// Jurkovič-inspired SVG icons
const icons = {
  shield: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 4L6 10v10c0 9 6 15 14 18 8-3 14-9 14-18V10L20 4z" />
      <path d="M20 12v16M14 18h12" strokeLinecap="round" />
    </svg>
  ),
  scroll: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 8c0-2 2-4 4-4h16c2 0 4 2 4 4v24c0 2-2 4-4 4H12c-2 0-4-2-4-4V8z" />
      <path d="M14 12h12M14 18h12M14 24h8" strokeLinecap="round" />
    </svg>
  ),
  growth: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 34L16 24l6 6 12-16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 14h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  coins: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="16" cy="24" rx="10" ry="6" />
      <path d="M26 24v-4c0-3.3-4.5-6-10-6s-10 2.7-10 6v4" />
      <ellipse cx="16" cy="14" rx="10" ry="6" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="22" y="6" width="12" height="12" rx="2" />
      <rect x="6" y="22" width="12" height="12" rx="2" />
      <rect x="22" y="22" width="12" height="12" rx="2" />
    </svg>
  ),
  mountain: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 32L14 12l6 10 4-6 12 16H4z" strokeLinejoin="round" />
      <circle cx="30" cy="10" r="4" />
    </svg>
  ),
  percent: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="5" />
      <circle cx="28" cy="28" r="5" />
      <path d="M32 8L8 32" strokeLinecap="round" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 18L20 6l14 12v16a2 2 0 01-2 2H8a2 2 0 01-2-2V18z" />
      <path d="M16 36V24h8v12" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 40 40" className="w-10 h-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 4L4 12l16 8 16-8L20 4z" />
      <path d="M4 20l16 8 16-8" />
      <path d="M4 28l16 8 16-8" />
    </svg>
  ),
};

// Benefits data - updated content
const benefits = [
  { icon: 'shield', title: 'Anonymita vlastnictví', description: 'Registr vlastníků družstevních podílů není veřejný.' },
  { icon: 'scroll', title: 'Jednoduchost a rychlost', description: 'Podpis jedné smlouvy' },
  { icon: 'growth', title: 'Zhodnocení podílu', description: 'Orientačně 5–10 % ročně' },
  { icon: 'coins', title: 'Výnos z nájmu', description: 'Orientačně 2–5 % ročně s potenciálem růstu v čase, vypláceno pololetně' },
  { icon: 'grid', title: '50 podílů na apartmán', description: 'Možnost koupě libovolného počtu' },
  { icon: 'mountain', title: 'Růst hodnoty nemovitostí', description: 'Historický růst cen nemovitostí ve Špindlerově Mlýně 8–12 % ročně' },
  { icon: 'percent', title: 'Podíl na zisku', description: 'Z turistického pronájmu' },
  { icon: 'home', title: '20% sleva na ubytování', description: 'Pro držitele podílu' },
  { icon: 'layers', title: 'Diverzifikace majetku', description: 'O podíl na reálné nemovitosti' },
];

// Process steps - updated
const steps = [
  { 
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="24" cy="24" r="20" />
        <path d="M24 14v10l7 7" strokeLinecap="round" />
      </svg>
    ),
    title: 'Nezávazná konzultace', 
    description: 'Zjistíte vše potřebné o produktu a odpovíme na vaše dotazy.' 
  },
  { 
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="32" height="32" rx="4" />
        <path d="M16 16h16M16 24h16M16 32h8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Výběr počtu podílů', 
    description: 'Vyberete si konkrétní počet podílů, které chcete získat.' 
  },
  { 
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 36V16a4 4 0 014-4h16a4 4 0 014 4v20" />
        <path d="M8 36h32" strokeLinecap="round" />
        <path d="M20 20l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Podpis jedné smlouvy', 
    description: 'Jednoduché smluvní řešení bez zbytečné administrativy.' 
  },
  { 
    icon: (
      <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="24" cy="20" r="12" />
        <path d="M24 14v12l6 6" strokeLinecap="round" />
        <path d="M12 38h24" strokeLinecap="round" />
        <path d="M16 42h16" strokeLinecap="round" />
      </svg>
    ),
    title: 'Správa a výplata výnosů', 
    description: 'O vše se postaráme. Výnosy vyplácíme pololetně.' 
  },
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

      {/* Video Section */}
      <section className="py-20 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-10">
            Prohlídka projektu
          </h2>
          <div className="relative aspect-video">
            <iframe
              src="https://www.youtube.com/embed/gJqA9imgAsQ"
              title="Pod Zlatým návrším"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
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
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="24" cy="24" r="18" />
                  <path d="M24 14v20M16 24h16" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-navy/70 leading-relaxed">
                Pro investory hledající <strong className="text-navy">nemovitostní expozici</strong> bez nutnosti koupě celé jednotky.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 38V18l16-12 16 12v20a2 2 0 01-2 2H10a2 2 0 01-2-2z" />
                  <rect x="18" y="26" width="12" height="14" />
                </svg>
              </div>
              <p className="text-navy/70 leading-relaxed">
                Pro zájemce o <strong className="text-navy">diverzifikaci portfolia</strong>.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 38l14-20 8 10 14-18" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="8" r="4" />
                </svg>
              </div>
              <p className="text-navy/70 leading-relaxed">
                Pro ty, kteří chtějí hory nejen vlastnit, ale i <strong className="text-navy">využívat</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hlavní výhody - with Jurkovič icons */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            Hlavní výhody
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="py-6 border-b border-navy/10">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {icons[benefit.icon as keyof typeof icons]}
                  </div>
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

      {/* Jak to funguje - with Jurkovič icons */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            Jak to funguje
          </h2>
          <div className="grid md:grid-cols-4 gap-12 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-6">
                  {step.icon}
                </div>
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
