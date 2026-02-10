/**
 * Homepage - Design 2030 with real photos
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pod Zlatým návrším | Luxusní apartmány Špindlerův Mlýn',
  description: 'Luxusní apartmány k pronájmu a prodeji ve Špindlerově Mlýně, přímo u lanovky.',
};

export default async function HomePage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    heroTitle: 'Kde hory potkávají ticho',
    cta: 'Objevit apartmány',
    
    section1Num: '01',
    section1Title: 'Pronájem',
    section1Text: 'Luxusní apartmány pro váš horský pobyt. Plně vybavené, s výhledem na sjezdovku.',
    section1Link: 'Zobrazit apartmány',
    
    section2Num: '02',
    section2Title: 'Prodej',
    section2Text: 'Poslední příležitost vlastnit apartmán přímo u lanovky ve Špindlerově Mlýně.',
    section2Link: 'Investiční příležitost',
    
    section3Num: '03',
    section3Title: 'Lokalita',
    section3Text: 'Přímo u nástupní stanice lanovky. 1,5 hodiny z Prahy, v srdci Krkonoš.',
    section3Link: 'O lokalitě',
  } : {
    heroTitle: 'Where mountains meet silence',
    cta: 'Discover apartments',
    
    section1Num: '01',
    section1Title: 'Rental',
    section1Text: 'Luxury apartments for your mountain stay. Fully equipped, with ski slope views.',
    section1Link: 'View apartments',
    
    section2Num: '02',
    section2Title: 'Sale',
    section2Text: 'Last opportunity to own an apartment right by the lift in Špindlerův Mlýn.',
    section2Link: 'Investment opportunity',
    
    section3Num: '03',
    section3Title: 'Location',
    section3Text: 'Right at the lift station. 1.5 hours from Prague, in the heart of Krkonoše.',
    section3Link: 'About location',
  };

  return (
    <>
      {/* Hero with real photo */}
      <section className="relative min-h-screen flex items-center justify-center">
        <Image
          src="/images/hero.jpg"
          alt="Pod Zlatým návrším"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-navy/60" />
        
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-12 leading-[1.1]">
            {t.heroTitle}
          </h1>
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-block px-10 py-4 bg-gold text-navy text-sm tracking-[0.2em] uppercase hover:bg-gold-400 transition-colors"
          >
            {t.cta}
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-px h-16 bg-white/30" />
        </div>
      </section>

      {/* Section 1 - Pronájem */}
      <section className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/building-front.jpg"
                alt="Apartmány Pod Zlatým návrším"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-gold text-sm tracking-widest">{t.section1Num}</span>
              <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-6">{t.section1Title}</h2>
              <p className="text-navy/60 leading-relaxed mb-8">{t.section1Text}</p>
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
              >
                {t.section1Link}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Prodej */}
      <section className="py-32 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <span className="text-gold text-sm tracking-widest">{t.section2Num}</span>
              <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-6">{t.section2Title}</h2>
              <p className="text-navy/60 leading-relaxed mb-8">{t.section2Text}</p>
              <Link 
                href="/investicni-prilezitost"
                className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
              >
                {t.section2Link}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden order-1 md:order-2">
              <Image
                src="/images/building-lift.jpg"
                alt="Apartmány u lanovky"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Lokalita */}
      <section className="py-32 bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-gold text-sm tracking-widest">{t.section3Num}</span>
          <h2 className="text-3xl md:text-4xl font-light mt-4 mb-6">{t.section3Title}</h2>
          <p className="text-white/60 leading-relaxed mb-8 max-w-xl mx-auto">{t.section3Text}</p>
          <Link 
            href="/lokalita"
            className="inline-flex items-center text-white font-medium hover:text-gold transition-colors"
          >
            {t.section3Link}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
