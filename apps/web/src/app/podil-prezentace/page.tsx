/**
 * /podil-prezentace — prezentace družstevního podílu pro prodejce (schůzka s klientem)
 *
 * Skrytý odkaz: noindex, mimo menu a sitemapu. Jen česky (prodejní síť ZFP).
 * Texty výhod, kroků, ceny a varování ze sdíleného podil/texts.tsx — prezentace,
 * /podil a mailing do sítě říkají totéž. Číslo apartmánu se nikde neuvádí (DEC-009).
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import Image from 'next/image';
import QRCode from 'qrcode';
import { getApartmentImages } from '@/data/apartment-images';
import { AlpineOrnament } from '@/components/ui/ornaments';
import {
  getPodilTexts,
  getPodilApartment,
  getPodilApartmentView,
  getPodilAvailableShares,
  PODIL_APARTMENT_SLUG,
  PODIL_PRICE_CZK,
  PODIL_TOTAL_SHARES,
} from '../(public)/podil/texts';
import { Deck, Gallery } from './deck';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Prezentace družstevního podílu | Pod Zlatým návrším',
  robots: { index: false, follow: false },
};

// Kontakt družstva — shodně s mailingem do sítě ZFP (11/2026)
const CONTACT = {
  role: 'Koordinátorka projektu',
  name: 'Leona Hellingerová',
  email: 'druzstvo@zfpakademie.cz',
};

function SlideFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-full flex flex-col justify-center px-6 sm:px-12 lg:px-20 pt-12 pb-28 ${className}`}>
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </div>
  );
}

function SlideHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-8 lg:mb-12">
      <p className="text-gold text-xs sm:text-sm tracking-[0.25em] uppercase mb-4">{label}</p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light leading-tight">{title}</h2>
    </div>
  );
}

/** České číslování podlaží: 1. NP = přízemí, 3. NP = 2. patro. */
function floorLabel(floor: number | null): string {
  if (floor == null) return '—';
  if (floor <= 1) return `${floor}. NP (přízemí)`;
  return `${floor}. NP (${floor - 1}. patro)`;
}

export default async function PodilPrezentacePage() {
  const t = getPodilTexts('cs');
  const [apartment, images, available] = await Promise.all([
    getPodilApartment('cs'),
    getApartmentImages(PODIL_APARTMENT_SLUG),
    getPodilAvailableShares(),
  ]);

  if (!apartment) return <div className="p-12">{t.notFound}</div>;

  const apt = getPodilApartmentView(apartment, 'cs');
  const reserved = PODIL_TOTAL_SHARES - available;
  const percent = (100 / PODIL_TOTAL_SHARES).toFixed(0);
  const price = PODIL_PRICE_CZK.toLocaleString('cs-CZ');

  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'pzn-gra.vercel.app';
  const podilUrl = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}/podil`;
  const qr = await QRCode.toDataURL(podilUrl, {
    width: 320,
    margin: 1,
    color: { dark: '#0B1626', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });

  const slides: { title: string; content: ReactNode }[] = [
    // ── 1. Titul ─────────────────────────────────────────────
    {
      title: 'Úvod',
      content: (
        <div className="relative min-h-full flex flex-col">
          <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
          <SlideFrame className="relative flex-1">
            <p className="text-sm tracking-wide mb-16">
              <span className="font-medium">Pod Zlatým</span>
              <span className="font-light text-white/70 ml-1">návrším</span>
            </p>
            <p className="text-gold text-xs sm:text-sm tracking-[0.25em] uppercase mb-6">{t.heroLabel}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light leading-[1.05] max-w-4xl mb-8">
              {t.heroTitle}
            </h1>
            <AlpineOrnament className="w-40 text-gold/60 mb-8" />
            <p className="text-lg sm:text-xl lg:text-2xl text-white/70 font-light max-w-3xl leading-relaxed mb-14">
              {t.heroText}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 max-w-3xl border-t border-white/15 pt-8">
              {[
                { value: String(PODIL_TOTAL_SHARES), label: 'družstevních podílů' },
                { value: `${price} Kč`, label: 'cena jednoho podílu' },
                { value: '20 %', label: 'sleva na vlastní pobyt' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl sm:text-4xl font-light text-gold mb-2 whitespace-nowrap">{s.value}</p>
                  <p className="text-xs sm:text-sm text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </SlideFrame>
        </div>
      ),
    },

    // ── 2. Lokalita ──────────────────────────────────────────
    {
      title: 'Lokalita',
      content: (
        <SlideFrame>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/building-lift.jpg"
                alt="Lanovka Labská a apartmánové domy Pod Zlatým návrším"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <SlideHeading label="Lokalita" title="Přímo u sjezdovky Labská" />
              <ul className="space-y-5">
                {[
                  'Sedačková lanovka a červená sjezdovka Labská (1 770 m) hned za domem',
                  'Špindlerův Mlýn, jedna z nejoblíbenějších horských destinací v Česku',
                  'Turisté sem jezdí po celý rok: v zimě lyžovat, v létě na turistiku do Krkonoš',
                  'Dům v alpském stylu, dokončený v roce 2023',
                ].map((item) => (
                  <li key={item} className="flex gap-4 text-lg text-white/75 leading-relaxed">
                    <AlpineOrnament variant="diamond" className="w-4 h-4 mt-1.5 flex-shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SlideFrame>
      ),
    },

    // ── 3. Apartmán — galerie ────────────────────────────────
    {
      title: 'Apartmán',
      content: (
        <SlideFrame>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-12">
            <div className="h-[55vh] lg:h-[68vh] min-w-0">
              <Gallery images={images} alt={t.heroImageAlt} />
            </div>
            <div className="flex flex-col justify-center">
              <SlideHeading label="Apartmán" title="Zařízený apartmán s výhledem na svah" />
              <p className="text-white/70 leading-relaxed mb-6">{t.apartmentIntro}</p>
              <p className="text-white/50 text-sm leading-relaxed">{apt.description}</p>
            </div>
          </div>
        </SlideFrame>
      ),
    },

    // ── 4. Dispozice a rozměry ───────────────────────────────
    {
      title: 'Dispozice',
      content: (
        <SlideFrame>
          <SlideHeading label="Dispozice a rozměry" title={`${apt.layout}, ${apt.totalArea}`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 mb-10">
            {[
              { label: t.specLayout, value: apt.layout },
              { label: t.specTotalArea, value: apt.totalArea },
              { label: t.specFloor, value: floorLabel(apartment.floor) },
              { label: t.specOrientation, value: apt.orientation },
            ].map((s) => (
              <div key={s.label} className="bg-navy p-6 lg:p-8">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">{s.label}</p>
                <p className="text-2xl lg:text-3xl font-light text-white">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h3 className="text-gold text-sm uppercase tracking-widest mb-4">Místnosti</h3>
              {[
                { label: t.specHall, value: apt.hall },
                { label: t.specBathroom, value: apt.bathroom },
                { label: t.specLivingKitchen, value: apt.livingKitchen },
              ].map((r) => (
                <div key={r.label} className="flex justify-between py-3 border-b border-white/10 text-lg">
                  <span className="text-white/60">{r.label}</span>
                  <span className="font-light">{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 text-lg">
                <span className="text-white/60">Celkem</span>
                <span className="text-gold">{apt.totalArea}</span>
              </div>
            </div>
            <div>
              <h3 className="text-gold text-sm uppercase tracking-widest mb-4">Vybavení</h3>
              <div className="flex flex-wrap gap-3">
                {apt.features.map((f) => (
                  <span key={f} className="px-4 py-2 border border-white/15 text-white/80">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SlideFrame>
      ),
    },

    // ── 5. Jak funguje podíl ─────────────────────────────────
    {
      title: 'Podíl',
      content: (
        <SlideFrame>
          <SlideHeading label="Družstevní podíl" title="Jak funguje podíl" />
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {[
              { value: String(PODIL_TOTAL_SHARES), label: 'družstevních podílů na apartmán' },
              { value: `${percent} %`, label: 'apartmánu odpovídá jednomu podílu' },
              { value: `${price} Kč`, label: 'cena jednoho podílu' },
            ].map((s) => (
              <div key={s.label} className="border-t border-gold/50 pt-6">
                <p className="text-5xl lg:text-6xl font-light text-gold mb-3 whitespace-nowrap">{s.value}</p>
                <p className="text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xl text-white/75 font-light leading-relaxed max-w-3xl mb-10">
            {t.sharesText(PODIL_TOTAL_SHARES, percent)}
          </p>
          <div className="bg-white/5 border border-white/10 p-6 lg:p-8 max-w-xl">
            <div className="flex justify-between text-sm text-white/60 mb-3">
              <span>{t.sold}</span>
              <span>{t.available}</span>
            </div>
            <div className="relative h-3 bg-white/15 rounded-full overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 bg-gold rounded-full"
                style={{ width: `${(reserved / PODIL_TOTAL_SHARES) * 100}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-2xl font-light text-gold">{reserved}</span>
              <span className="text-2xl font-light">{available}</span>
            </div>
            <p className="text-white/40 text-sm mt-3">{t.ofTotal(PODIL_TOTAL_SHARES)}</p>
          </div>
        </SlideFrame>
      ),
    },

    // ── 6. Proč družstevní podíl ─────────────────────────────
    {
      title: 'Výhody',
      content: (
        <SlideFrame>
          <SlideHeading label="Výhody" title={t.benefitsTitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
            {t.benefits.map((b, i) => (
              <div key={b.title} className="flex gap-5">
                <span className="text-3xl font-light text-gold/70 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-xl font-light mb-2">{b.title}</h3>
                  <p className="text-white/55 leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/40 mt-12">¹ Zdroj a upozornění k údajům o výnosu a cenách na dalším slidu.</p>
        </SlideFrame>
      ),
    },

    // ── 7. Výnos a vývoj cen + varování ──────────────────────
    {
      title: 'Výnos a ceny',
      content: (
        <SlideFrame>
          <SlideHeading label="Výnos a vývoj cen" title="Orientační výnos a minulý vývoj cen" />
          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            <div className="border border-white/10 p-6 lg:p-8">
              <p className="text-4xl lg:text-5xl font-light text-gold mb-4">2–5 % ročně</p>
              <p className="text-white/70 leading-relaxed">
                Orientační výnos z pronájmu, vyplácený dvakrát ročně. Závisí na obsazenosti
                a tržních podmínkách.
              </p>
            </div>
            <div className="border border-white/10 p-6 lg:p-8">
              <p className="text-4xl lg:text-5xl font-light text-gold mb-4">11 % ročně</p>
              <p className="text-white/70 leading-relaxed">
                Průměrný růst cen bytů v Královéhradeckém kraji v letech 2015–2025. V roce 2023
                ceny meziročně klesly.¹
              </p>
            </div>
          </div>
          <div className="border-l-2 border-gold pl-6 space-y-3 max-w-5xl">
            <p className="text-white/75 leading-relaxed">{t.legalNote}</p>
            <p className="text-sm text-white/55 leading-relaxed">{t.sourceNote}</p>
          </div>
        </SlideFrame>
      ),
    },

    // ── 8. Jak to probíhá ────────────────────────────────────
    {
      title: 'Postup',
      content: (
        <SlideFrame>
          <SlideHeading label="Postup" title={t.stepsTitle} />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {t.steps.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-14 w-14 flex-shrink-0 flex items-center justify-center border border-gold text-gold text-xl font-light">
                    {i + 1}
                  </span>
                  {i < t.steps.length - 1 && <span className="hidden lg:block h-px flex-1 bg-gold/30" />}
                </div>
                <h3 className="text-xl font-light mb-3">{s.title}</h3>
                <p className="text-white/55 leading-relaxed">{s.description}</p>
              </li>
            ))}
          </ol>
        </SlideFrame>
      ),
    },

    // ── 9. Další krok ────────────────────────────────────────
    {
      title: 'Další krok',
      content: (
        <SlideFrame>
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
            <div>
              <SlideHeading label="Další krok" title="Nezávazná konzultace" />
              <p className="text-xl text-white/70 font-light leading-relaxed max-w-2xl mb-10">
                Projdeme s vámi podmínky, vybereme počet podílů a odpovíme na vaše dotazy.
                Podrobnosti o apartmánu i aktuální počet volných podílů najdete na webu.
              </p>
              <div className="border-t border-white/15 pt-6">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-2">{CONTACT.role}</p>
                <p className="text-2xl font-light mb-1">{CONTACT.name}</p>
                <a href={`mailto:${CONTACT.email}`} className="text-gold hover:underline">
                  {CONTACT.email}
                </a>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`QR kód: ${podilUrl}`} width={220} height={220} />
              </div>
              <p className="text-sm text-white/50 mt-4">Naskenujte a otevřete stránku podílu</p>
              <p className="text-sm text-white/70 mt-1">{podilUrl.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>
        </SlideFrame>
      ),
    },
  ];

  return <Deck slides={slides.map((s) => s.content)} titles={slides.map((s) => s.title)} />;
}
