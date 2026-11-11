/**
 * Družstevní podíl — společný obsah stránek /podil a /podil/[available] (11. 11. 2026)
 *
 * Stejná kostra a jazyk jako prezentace apartmánu na prodej /suites/[slug]
 * (vzor Vibekodex „vyber-prezentace“): úvod s cenou → čísla → pro koho → výhody
 * s upozorněním → postup → video → apartmán (galerie po kapitolách, členění ploch) →
 * podíly → poptávka a kontakty. Texty beze změny v texts.tsx (regulatorně citlivé).
 * Číslo apartmánu se nikde neuvádí (DEC-009) — proto galerie bez kapitoly Půdorysy,
 * na výkresech je číslo bytu vidět.
 */

import Image from 'next/image';
import Link from 'next/link';
import { getApartmentImages } from '@/data/apartment-images';
import { AlpineOrnament, SectionLabel } from '@/components/ui/ornaments';
import { getGalleryChapters, type GalleryCategory } from '@/lib/sale-presentation';
import { findChapterPhoto, parseArea } from '@/lib/sale-format';
import { getSaleTexts } from '../suites/[slug]/texts';
import { ChapterGallery } from '../suites/[slug]/chapter-gallery';
import { ShareRequestForm } from './client';
import { PodilContacts } from './contacts';
import {
  getPodilTexts,
  getPodilApartment,
  getPodilApartmentView,
  PODIL_APARTMENT_SLUG,
  PODIL_TOTAL_SHARES,
} from './texts';

/** Úvodní fotka: domy pod sjezdovkou za soumraku (migrace 022); bez ní hlavní fotka apartmánu. */
const HERO_PHOTO = 'zima/chaty-art.jpg';

/** Kapitoly galerie na /podil — bez půdorysů (číslo bytu) a bez nezařazených fotek. */
const GALLERY_CHAPTERS: GalleryCategory[] = ['interior', 'winter', 'exterior'];

// Ikony výhod — texty v texts.tsx (stejné pořadí)
const benefitIcons = [
  // výnos
  <g key="coins">
    <ellipse cx="16" cy="24" rx="10" ry="6" />
    <path d="M26 24v-4c0-3.3-4.5-6-10-6s-10 2.7-10 6v4" />
    <ellipse cx="16" cy="14" rx="10" ry="6" />
  </g>,
  // růst hodnoty
  <g key="mountain">
    <path d="M4 32L14 12l6 10 4-6 12 16H4z" strokeLinejoin="round" />
    <circle cx="30" cy="10" r="4" />
  </g>,
  // žádné starosti
  <g key="home">
    <path d="M6 18L20 6l14 12v16a2 2 0 01-2 2H8a2 2 0 01-2-2V18z" />
    <path d="M16 36V24h8v12" />
  </g>,
  // jednoduchost a diskrétnost
  <g key="shield">
    <path d="M20 4L6 10v10c0 9 6 15 14 18 8-3 14-9 14-18V10L20 4z" />
    <path d="M20 12v16M14 18h12" strokeLinecap="round" />
  </g>,
  // sleva
  <g key="percent">
    <circle cx="12" cy="12" r="5" />
    <circle cx="28" cy="28" r="5" />
    <path d="M32 8L8 32" strokeLinecap="round" />
  </g>,
  // portfolio
  <g key="layers">
    <path d="M20 4L4 12l16 8 16-8L20 4z" />
    <path d="M4 20l16 8 16-8" />
    <path d="M4 28l16 8 16-8" />
  </g>,
];

/** Číslo se od „%“ a „Kč“ nesmí na konci řádku odtrhnout (texty v texts.tsx mají běžnou mezeru) */
const nb = (text: string) => text.replace(/(\d) (%|Kč)/g, '$1\u00a0$2');

function Arrow({ className = 'w-4 h-4 ml-2' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
    </svg>
  );
}

export async function PodilView({ locale, availableShares }: { locale: 'cs' | 'en'; availableShares: number }) {
  const t = getPodilTexts(locale);
  const sale = getSaleTexts(locale);

  // Apartmán nabízený v podílech (číslo se na stránce neuvádí)
  const apartment = await getPodilApartment(locale);
  if (!apartment) {
    return <div className="pt-32 pb-24 text-center text-navy">{t.notFound}</div>;
  }
  const [allImages, allChapters] = await Promise.all([
    getApartmentImages(PODIL_APARTMENT_SLUG),
    getGalleryChapters(apartment.id),
  ]);
  const apt = getPodilApartmentView(apartment, locale);

  const heroImage = allImages[0] ?? null;
  const pageHero = findChapterPhoto(allChapters, HERO_PHOTO) ?? heroImage;
  // Galerie po kapitolách jen když jsou fotky zařazené (migrace 025); jinak původní mřížka náhledů
  const chapters = allChapters.some((c) => c.key === 'interior')
    ? allChapters.filter((c) => GALLERY_CHAPTERS.includes(c.key))
    : [];
  const fallbackImages = allImages.filter((img) => img !== heroImage).slice(0, 6);

  const total = PODIL_TOTAL_SHARES;
  const reserved = total - availableShares;
  const percent = (100 / total).toFixed(0);

  const stats: { label: string; value: string }[] = [
    { label: t.stats.price, value: t.price },
    { label: t.stats.shareSize, value: t.stats.shareSizeValue(percent) },
    { label: t.availableLabel, value: t.availableOf(availableShares, total) },
    { label: t.stats.discount, value: t.stats.discountValue },
    { label: t.stats.payout, value: t.stats.payoutValue },
    { label: t.stats.contract, value: t.stats.contractValue },
    { label: t.stats.area, value: apt.totalArea },
    { label: t.stats.completed, value: t.stats.completedValue },
  ];

  const audience = [t.audienceInvestors, t.audienceDiversification, t.audienceUse];

  const roomRows = [
    { label: t.specLivingKitchen, text: apt.livingKitchen },
    { label: t.specHall, text: apt.hall },
    { label: t.specBathroom, text: apt.bathroom },
  ]
    .filter((r) => r.text && r.text !== '—')
    .map((r) => ({ ...r, value: parseArea(r.text) }));
  const roomsTotal = roomRows.reduce((s, r) => s + (r.value ?? 0), 0);

  const specs = [
    { label: t.specLayout, value: apt.layout },
    { label: t.specTotalArea, value: apt.totalArea },
    { label: t.specFloor, value: apt.floor },
    { label: t.specOrientation, value: apt.orientation },
  ];

  return (
    <>
      {/* ── Úvod ─────────────────────────────────────────────── */}
      <section className="relative bg-navy pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden md:min-h-[46rem] md:flex md:flex-col md:justify-end">
        {pageHero && (
          <div className="absolute inset-0">
            <Image src={pageHero} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-3xl">
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">{t.heroLabel}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">{t.heroTitle}</h1>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-2xl mb-10">{t.heroText}</p>

            <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
              <div>
                <p className="text-gold text-xs tracking-widest uppercase mb-1">{t.priceLabel}</p>
                <p className="text-3xl font-light text-white whitespace-nowrap">{t.price}</p>
              </div>
              <div>
                <p className="text-gold text-xs tracking-widest uppercase mb-1">{t.availableLabel}</p>
                <p className="text-3xl font-light text-white whitespace-nowrap">{t.availableOf(availableShares, total)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#poptavka" className="px-6 py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors">
                  {t.ctaInterest}
                </a>
                <a href="#postup" className="px-6 py-4 border border-white/30 text-white text-sm uppercase tracking-widest hover:bg-white/10 transition-colors">
                  {t.stepsTitle}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Čísla ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.numbersLabel}</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 mt-8">
            {stats.map((s) => (
              <div key={s.label} className="border-b border-navy/10 pb-4">
                <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{s.label}</p>
                <p className="text-2xl md:text-3xl font-light text-navy">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pro koho ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.audienceLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-12 max-w-2xl">{t.audienceTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {audience.map((text, i) => (
              <div key={i} className="bg-white p-8">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <p className="text-lg font-light text-navy/70 leading-relaxed mt-3">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Výhody + upozornění ─────────────────────────────── */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.benefitsLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-12 max-w-2xl">{t.benefitsTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10 border border-navy/10">
            {t.benefits.map((benefit, index) => (
              <div key={benefit.title} className="bg-cream p-6 md:p-8">
                <svg viewBox="0 0 40 40" className="w-9 h-9 text-gold mb-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  {benefitIcons[index]}
                </svg>
                <h3 className="text-xl font-light text-navy mb-2">{benefit.title}</h3>
                <p className="text-navy/60 leading-relaxed">{nb(benefit.description)}</p>
              </div>
            ))}
          </div>

          {/* Právní upozornění a zdroj k růstu hodnoty nemovitostí (compliance 10/2026, DEC-030) — vždy u výhod */}
          <div className="mt-10 max-w-4xl border-l-2 border-gold pl-5">
            <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.noteLabel}</p>
            <p className="text-navy/70 text-sm leading-relaxed">{t.legalNote}</p>
            <p className="text-navy/50 text-xs leading-relaxed mt-3">{nb(t.sourceNote)}</p>
          </div>
        </div>
      </section>

      {/* ── Jak to probíhá ──────────────────────────────────── */}
      <section id="postup" className="py-16 md:py-24 bg-stone scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.stepsLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-12">{t.stepsTitle}</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.steps.map((step, i) => (
              <li key={step.title} className="bg-white p-6 md:p-8">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <h3 className="text-xl font-light text-navy mt-3 mb-2">{step.title}</h3>
                <p className="text-navy/60 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Video ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel light>{t.videoLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-white mt-4 mb-10">{t.videoTitle}</h2>
          <div className="relative aspect-video bg-black/30">
            <iframe
              src="https://www.youtube.com/embed/gJqA9imgAsQ"
              title="Pod Zlatým návrším"
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ── Nabízený apartmán ───────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.apartmentLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-4">{t.apartmentTitle}</h2>
          <p className="text-navy/60 leading-relaxed text-lg max-w-3xl mb-10">{t.apartmentIntro}</p>

          {chapters.length > 0 ? (
            <ChapterGallery
              chapters={chapters}
              title={t.heroImageAlt}
              labels={{ chapters: sale.chapters, close: sale.close, prev: sale.prev, next: sale.next }}
            />
          ) : (
            <>
              <div className="relative aspect-[16/9] mb-2 md:mb-3 overflow-hidden bg-stone">
                {heroImage && <Image src={heroImage} alt={t.heroImageAlt} fill className="object-cover" sizes="(max-width: 1152px) 100vw, 1104px" />}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                {fallbackImages.map((img, index) => (
                  <div key={img} className="relative aspect-square overflow-hidden bg-stone">
                    <Image src={img} alt={t.photoAlt(index + 1)} fill className="object-cover" sizes="(max-width: 768px) 33vw, 16vw" />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-16">
            <div>
              <h3 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.aboutTitle}</h3>
              <p className="text-navy/70 leading-relaxed text-lg whitespace-pre-line">{apt.description}</p>

              {apt.features.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.featuresTitle}</h3>
                  <div className="flex flex-wrap gap-3">
                    {apt.features.map((feature) => (
                      <span key={feature} className="px-4 py-2 bg-stone text-navy text-sm">{feature}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.specsTitle}</h3>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-6 pb-8 border-b border-navy/10">
                {specs.map((s) => (
                  <div key={s.label}>
                    <dt className="text-xs text-navy/40 uppercase tracking-widest mb-1">{s.label}</dt>
                    <dd className="text-xl font-light text-navy">{s.value}</dd>
                  </div>
                ))}
              </dl>

              {roomRows.length > 0 && (
                <>
                  <h3 className="text-sm text-navy/40 uppercase tracking-widest mt-8 mb-6">{t.roomsTitle}</h3>
                  <div className="space-y-5">
                    {roomRows.map((r) => (
                      <div key={r.label}>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-navy font-light">{r.label}</span>
                          <span className="text-navy tabular-nums">{r.text}</span>
                        </div>
                        <div className="h-2 bg-navy/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-navy/70 rounded-full"
                            style={{ width: `${roomsTotal && r.value ? Math.max(3, Math.round((r.value / roomsTotal) * 100)) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Podíly ──────────────────────────────────────────── */}
      <section id="podily" className="py-16 md:py-24 bg-navy scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel light>{t.sharesLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-white mt-4 mb-4 max-w-3xl">{t.sharesTitle}</h2>
          <p className="text-white/60 leading-relaxed max-w-3xl mb-12">{nb(t.sharesText(total, percent))}</p>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
              <div className="bg-navy p-6 md:p-8">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{t.available}</p>
                <p className="text-5xl md:text-6xl font-extralight text-white tabular-nums">{availableShares}</p>
              </div>
              <div className="bg-navy p-6 md:p-8">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{t.sold}</p>
                <p className="text-5xl md:text-6xl font-extralight text-gold tabular-nums">{reserved}</p>
              </div>
              <div className="bg-navy p-6 md:p-8">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{t.stats.price}</p>
                <p className="text-2xl md:text-3xl font-light text-white whitespace-nowrap">{t.price}</p>
              </div>
              <div className="bg-navy p-6 md:p-8">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{t.stats.shareSize}</p>
                <p className="text-2xl md:text-3xl font-light text-white">{t.stats.shareSizeValue(percent)}</p>
              </div>
            </div>

            {/* Každý čtverec = jeden podíl; zlaté jsou rezervované */}
            <div>
              <div
                className="grid grid-cols-10 gap-1.5 sm:gap-2 max-w-md"
                role="img"
                aria-label={t.sharesAria(reserved, availableShares, total)}
              >
                {Array.from({ length: total }, (_, i) => (
                  <span key={i} className={`aspect-square ${i < reserved ? 'bg-gold' : 'border border-white/25'}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 mt-5">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-gold" />
                  {t.sold}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border border-white/40" />
                  {t.available}
                </span>
                <span className="text-white/40">{t.ofTotal(total)}</span>
              </div>
            </div>
          </div>

          <a href="#poptavka" className="inline-flex items-center mt-12 px-6 py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors">
            {t.ctaInterest}
            <Arrow />
          </a>
        </div>
      </section>

      {/* ── Poptávka a kontakty ─────────────────────────────── */}
      <section id="poptavka" className="py-16 md:py-24 bg-cream scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[2fr_3fr] lg:grid-rows-[auto_1fr] gap-x-16 gap-y-10">
          <div className="lg:col-start-1 lg:row-start-1">
            <AlpineOrnament variant="diamond" className="w-6 h-6 text-gold/40 mb-6" />
            <SectionLabel>{t.formLabel}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-4">{t.formTitle}</h2>
            <p className="text-navy/60 leading-relaxed text-lg">{t.formText}</p>
          </div>

          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <ShareRequestForm locale={locale} />
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <PodilContacts locale={locale} />
          </div>
        </div>
      </section>

      {/* ── Celý apartmán ───────────────────────────────────── */}
      <section className="py-16 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/suites" className="group bg-white p-8 flex items-center justify-between gap-6 max-w-3xl mx-auto">
            <span>
              <span className="block text-navy/50 text-sm mb-1">{t.wholeApartmentText}</span>
              <span className="block text-xl font-light text-navy group-hover:text-gold transition-colors">{t.wholeApartmentLink}</span>
            </span>
            <Arrow className="w-5 h-5 shrink-0 text-gold group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </>
  );
}
