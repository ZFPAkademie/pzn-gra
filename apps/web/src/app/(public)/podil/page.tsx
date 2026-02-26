/**
 * Družstevní podíl - Apartmán č. 7
 * Single apartment presentation with share ownership
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { getLocaleFromCookie } from '@/lib/i18n';
import { getSaleApartmentBySlug } from '@/lib/apartments';
import { getApartmentImages, getApartmentHeroImage } from '@/data/apartment-images';
import { JurkovicOrnament, SectionLabel } from '@/components/ui/ornaments';
import { ShareRequestForm } from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Družstevní podíl na apartmánu | Pod Zlatým návrším',
  description: 'Získejte družstevní podíl na horském apartmánu č. 7 ve Špindlerově Mlýně. Podíl na výnosech z pronájmu, možnost vlastního využití se slevou.',
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

// Benefits data
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

// Share availability - EDIT THIS to update available shares
const TOTAL_SHARES = 50;
const AVAILABLE_SHARES = 50; // Change this number as shares are sold

export default async function PodilPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  
  // Get apartment 7 data
  const apartment = getSaleApartmentBySlug('chata-1-suite-7');
  const heroImage = getApartmentHeroImage('chata-1-suite-7');
  const allImages = getApartmentImages('chata-1-suite-7');
  
  // Filter out hero image from carousel
  const carouselImages = allImages.filter(img => img !== heroImage).slice(0, 6);

  if (!apartment) {
    return <div>Apartmán nenalezen</div>;
  }

  const soldShares = TOTAL_SHARES - AVAILABLE_SHARES;
  const soldPercentage = (soldShares / TOTAL_SHARES) * 100;

  return (
    <>
      {/* Hero with apartment photo */}
      <section className="relative min-h-[70vh] flex items-end">
        {heroImage && (
          <>
            <Image
              src={heroImage}
              alt={apartment.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
          </>
        )}
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-16 w-full">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-4">
            Družstevní podíl
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            {apartment.title}
          </h1>
          <p className="text-xl text-white/60">
            {apartment.subtitle}
          </p>
        </div>
      </section>

      {/* Photo carousel */}
      <section className="py-8 bg-navy">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {carouselImages.map((img, index) => (
              <div key={index} className="relative aspect-square overflow-hidden">
                <Image
                  src={img}
                  alt={`${apartment.title} - foto ${index + 1}`}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apartment info */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Left - Description */}
            <div>
              <SectionLabel>O apartmánu</SectionLabel>
              <h2 className="text-3xl font-light text-navy mt-4 mb-6">
                {apartment.title}
              </h2>
              <p className="text-navy/60 leading-relaxed mb-8">
                {apartment.description}
              </p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {apartment.features.map((feature, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 bg-navy/5 text-navy text-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Right - Specs */}
            <div className="bg-white p-8 border border-navy/10">
              <h3 className="text-sm text-navy/40 uppercase tracking-widest mb-6">
                Specifikace
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-navy/10">
                  <span className="text-navy/60">Dispozice</span>
                  <span className="text-navy font-medium">{apartment.layout}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-navy/10">
                  <span className="text-navy/60">Celková plocha</span>
                  <span className="text-navy font-medium">{apartment.totalArea}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-navy/10">
                  <span className="text-navy/60">Patro</span>
                  <span className="text-navy font-medium">{apartment.floor}. NP</span>
                </div>
                <div className="flex justify-between py-3 border-b border-navy/10">
                  <span className="text-navy/60">Orientace</span>
                  <span className="text-navy font-medium">{apartment.orientation}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-navy/10">
                  <span className="text-navy/60">Předsíň</span>
                  <span className="text-navy font-medium">{apartment.rooms.hall}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-navy/10">
                  <span className="text-navy/60">Koupelna</span>
                  <span className="text-navy font-medium">{apartment.rooms.bathroom}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-navy/60">Obývací pokoj s kuchyní</span>
                  <span className="text-navy font-medium">{apartment.rooms.livingKitchen}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <JurkovicOrnament variant="simple" className="w-32 h-3 text-gold/40 mx-auto mb-8" />
            <h2 className="text-3xl font-light text-navy mb-4">
              Výhody družstevního podílu
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {icons[benefit.icon as keyof typeof icons]}
                </div>
                <h3 className="text-navy font-medium mb-2">{benefit.title}</h3>
                <p className="text-sm text-navy/50">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Share availability */}
      <section className="py-20 bg-navy">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            Dostupnost podílů
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-8">
            Tento apartmán je nabízen v rámci družstevního vlastnictví
          </h2>
          <p className="text-white/60 mb-12 max-w-2xl mx-auto">
            Můžete si koupit jeden podíl nebo celých {TOTAL_SHARES}. Každý podíl představuje 
            {' '}{(100 / TOTAL_SHARES).toFixed(0)} % vlastnictví apartmánu a odpovídající podíl na výnosech z pronájmu.
          </p>
          
          {/* Share indicator */}
          <div className="bg-white/10 backdrop-blur border border-white/20 p-8 max-w-md mx-auto">
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
              <span className="text-2xl font-light text-white">{AVAILABLE_SHARES}</span>
            </div>
            
            <p className="text-white/40 text-sm mt-4">
              z celkových {TOTAL_SHARES} podílů
            </p>
          </div>
        </div>
      </section>

      {/* Contact form */}
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

      {/* Legal note */}
      <section className="py-8 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-navy/40 text-center max-w-3xl mx-auto">
            Uvedené výnosy a zhodnocení jsou orientační a mohou se lišit v závislosti na obsazenosti 
            a tržních podmínkách. Družstevní podíl nezakládá přímé vlastnictví nemovitosti.
          </p>
        </div>
      </section>
    </>
  );
}
