/**
 * Družstevní podíl - Dynamic share count
 * URL: /podil/45 = 45 dostupných podílů (5 prodáno)
 * Kombinace původního obsahu + nové prvky
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocaleFromCookie } from '@/lib/i18n';
import { getSaleApartmentBySlug } from '@/lib/apartments';
import { getApartmentImages, getApartmentHeroImage } from '@/data/apartment-images';
import { JurkovicOrnament } from '@/components/ui/ornaments';
import { ShareRequestForm } from '../client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Družstevní podíl na apartmánu | Pod Zlatým návrším',
  description: 'Získejte družstevní podíl na horském apartmánu ve Špindlerově Mlýně.',
};

const TOTAL_SHARES = 50;

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

const benefits = [
  { icon: 'shield', title: 'Anonymita vlastnictví', description: 'Registr vlastníků družstevních podílů není veřejný.' },
  { icon: 'scroll', title: 'Jednoduchost a rychlost', description: 'Podpis jedné smlouvy' },
  { icon: 'coins', title: 'Výnos z nájmu', description: 'Orientačně 2–5 % ročně s potenciálem růstu v čase, vypláceno pololetně' },
  { icon: 'grid', title: '50 podílů na apartmán', description: 'Možnost koupě libovolného počtu' },
  { icon: 'mountain', title: 'Růst hodnoty nemovitostí', description: 'Historický růst cen nemovitostí ve Špindlerově Mlýně 8–12 % ročně' },
  { icon: 'percent', title: 'Podíl na zisku', description: 'Z turistického pronájmu' },
  { icon: 'home', title: '20% sleva na ubytování', description: 'Pro držitele podílu' },
  { icon: 'layers', title: 'Diverzifikace majetku', description: 'O podíl na reálné nemovitosti' },
];

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

interface PageProps {
  params: { available: string };
}

export default async function PodilDynamicPage({ params }: PageProps) {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  
  // Parse available shares from URL
  const availableShares = parseInt(params.available, 10);
  
  // Validate: must be number between 0 and 50
  if (isNaN(availableShares) || availableShares < 0 || availableShares > TOTAL_SHARES) {
    notFound();
  }
  
  const soldShares = TOTAL_SHARES - availableShares;
  const soldPercentage = (soldShares / TOTAL_SHARES) * 100;
  
  // Get apartment data (but don't mention the number)
  const apartment = getSaleApartmentBySlug('chata-1-suite-7');
  const heroImage = getApartmentHeroImage('chata-1-suite-7');
  const allImages = getApartmentImages('chata-1-suite-7');
  const carouselImages = allImages.filter(img => img !== heroImage).slice(0, 6);

  if (!apartment) {
    return <div>Apartmán nenalezen</div>;
  }

  return (
    <>
      {/* HERO */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            Družstevní podíl
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
        </div>
      </section>

      {/* VIDEO */}
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

      {/* PRO KOHO */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-12">
            Pro koho je tento produkt
          </h2>
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {/* Investoři */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 48 48" className="w-12 h-12 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="24" cy="24" r="18" />
                  <path d="M24 14v20M18 20c0-3.3 2.7-6 6-6s6 2.7 6 6c0 4-6 4-6 8" strokeLinecap="round" />
                  <circle cx="24" cy="36" r="2" fill="currentColor" />
                </svg>
              </div>
              <p className="text-navy/70 leading-relaxed">
                Pro investory hledající <strong className="text-navy">nemovitostní expozici</strong> bez nutnosti koupě celé jednotky.
              </p>
            </div>
            {/* Diverzifikace */}
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
            {/* Využití */}
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

      {/* HLAVNÍ VÝHODY */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            Hlavní výhody
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
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

      {/* JAK TO FUNGUJE */}
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

      {/* APARTMÁN */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-4">
              Nabízený apartmán
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-white">
              Apartmán ve Špindlerově Mlýně
            </h2>
          </div>

          {/* Hero image */}
          <div className="relative aspect-[16/9] mb-4 overflow-hidden">
            {heroImage && (
              <Image
                src={heroImage}
                alt="Apartmán ve Špindlerově Mlýně"
                fill
                className="object-cover"
                sizes="100vw"
              />
            )}
          </div>

          {/* Carousel */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-12">
            {carouselImages.map((img, index) => (
              <div key={index} className="relative aspect-square overflow-hidden">
                <Image
                  src={img}
                  alt={`Apartmán - foto ${index + 1}`}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
              </div>
            ))}
          </div>

          {/* Info grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 p-8">
              <h3 className="text-white font-medium mb-4">O apartmánu</h3>
              <p className="text-white/60 leading-relaxed mb-6">
                {apartment.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {apartment.features.map((feature, index) => (
                  <span key={index} className="px-3 py-1 bg-white/10 text-white/80 text-sm">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur border border-white/10 p-8">
              <h3 className="text-white font-medium mb-4">Specifikace</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/50">Dispozice</span>
                  <span className="text-white">{apartment.layout}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/50">Celková plocha</span>
                  <span className="text-white">{apartment.totalArea}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/50">Patro</span>
                  <span className="text-white">{apartment.floor}. NP</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/50">Orientace</span>
                  <span className="text-white">{apartment.orientation}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/50">Předsíň</span>
                  <span className="text-white">{apartment.rooms.hall}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/50">Koupelna</span>
                  <span className="text-white">{apartment.rooms.bathroom}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/50">Obývací pokoj s kuchyní</span>
                  <span className="text-white">{apartment.rooms.livingKitchen}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOSTUPNOST PODÍLŮ - DYNAMIC */}
      <section className="py-20 bg-gold">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-light text-navy mb-6">
            Tento apartmán je nabízen v rámci družstevního vlastnictví
          </h2>
          <p className="text-navy/70 mb-10 max-w-2xl mx-auto">
            Můžete si koupit jeden podíl nebo celých {TOTAL_SHARES}. Každý podíl představuje
            {' '}{(100 / TOTAL_SHARES).toFixed(0)} % vlastnictví apartmánu a odpovídající podíl na výnosech z pronájmu.
          </p>
          
          {/* Share indicator */}
          <div className="bg-navy p-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-white/60 mb-3">
              <span>Prodáno</span>
              <span>Dostupných</span>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-4 bg-white/20 rounded-full overflow-hidden mb-3">
              <div 
                className="absolute inset-y-0 left-0 bg-gold rounded-full transition-all duration-1000"
                style={{ width: `${soldPercentage}%` }}
              />
            </div>
            
            <div className="flex justify-between">
              <span className="text-2xl font-light text-gold">{soldShares}</span>
              <span className="text-2xl font-light text-white">{availableShares}</span>
            </div>
            
            <p className="text-white/40 text-sm mt-4">
              z celkových {TOTAL_SHARES} podílů
            </p>
          </div>
        </div>
      </section>

      {/* KONTAKTNÍ FORMULÁŘ */}
      <section className="py-24 bg-cream">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <JurkovicOrnament variant="diamond" className="w-6 h-6 text-gold/40 mx-auto mb-6" />
            <h2 className="text-3xl font-light text-navy mb-4">
              Máte zájem o družstevní podíl?
            </h2>
            <p className="text-navy/60">
              Zanechte nám kontakt a připravíme vám nezávaznou nabídku.
            </p>
          </div>
          <ShareRequestForm locale={locale} />
        </div>
      </section>

      {/* LEGAL NOTE */}
      <section className="py-8 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-navy/40 text-center max-w-3xl mx-auto">
            Uvedené výnosy a zhodnocení jsou orientační a mohou se lišit v závislosti na obsazenosti a tržních podmínkách.
            Družstevní podíl nezakládá přímé vlastnictví nemovitosti.
          </p>
        </div>
      </section>

      {/* LINK TO SUITES */}
      <section className="py-16 bg-cream border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">
            Máte zájem o koupi celého apartmánu?
          </p>
          <Link 
            href="/suites"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            Zobrazit apartmány k prodeji
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
