/**
 * Homepage
 * Design System: Alpine Quiet Luxury 2030
 * 
 * Rules:
 * - Hero: 1 sentence + 1 short tagline + 1 CTA
 * - Line icons only (no emoji)
 * - Generous spacing
 * - navy/gold/cream palette
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

// Force dynamic rendering (uses cookies for locale)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pod Zlatým návrším | Apartmány Špindlerův Mlýn',
  description: 'Luxusní apartmány v srdci Krkonoš. Pronájem, prodej a investiční příležitosti ve Špindlerově Mlýně.',
};

export default async function HomePage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Špindlerův Mlýn · Krkonoše',
    headline: 'Apartmány v srdci Krkonoš',
    subheadline: 'Klid, hodnota a dlouhodobý smysl.',
    cta: 'Zobrazit apartmány',
    
    rentTitle: 'Pronájem',
    rentDesc: 'Krátkodobé pobyty v plně vybavených apartmánech s kompletním servisem.',
    rentCta: 'Prohlédnout nabídku',
    
    saleTitle: 'Prodej',
    saleDesc: 'Vlastnictví prémiového apartmánu v nejžádanější horské lokalitě.',
    saleCta: 'Zobrazit nabídku',
    
    investTitle: 'Investice',
    investDesc: 'Stabilní zhodnocení s možností vlastního využití a garantovaným výnosem.',
    investCta: 'Zjistit více',
    
    aboutTitle: 'O projektu',
    aboutText: 'Pod Zlatým návrším je rezidenční projekt zasazený do malebné krajiny Krkonoš. Kombinace moderní architektury, kvalitních materiálů a respektu k přírodě.',
    aboutCta: 'Více o projektu',
    
    contactTitle: 'Máte zájem?',
    contactText: 'Rádi vám zodpovíme vaše dotazy.',
    contactCta: 'Kontaktovat nás',
  } : {
    tagline: 'Špindlerův Mlýn · Giant Mountains',
    headline: 'Apartments in the Heart of the Mountains',
    subheadline: 'Peace, value and lasting purpose.',
    cta: 'View apartments',
    
    rentTitle: 'Rent',
    rentDesc: 'Short-term stays in fully equipped apartments with complete service.',
    rentCta: 'Browse listings',
    
    saleTitle: 'Sale',
    saleDesc: 'Own a premium apartment in the most sought-after mountain location.',
    saleCta: 'View listings',
    
    investTitle: 'Investment',
    investDesc: 'Stable returns with personal use options and guaranteed yield.',
    investCta: 'Learn more',
    
    aboutTitle: 'About',
    aboutText: 'Pod Zlatým návrším is a residential project set in the picturesque Giant Mountains landscape. Modern architecture, quality materials, and respect for nature.',
    aboutCta: 'Learn more',
    
    contactTitle: 'Interested?',
    contactText: 'We are happy to answer your questions.',
    contactCta: 'Contact us',
  };

  return (
    <>
      {/* Hero Section - Alpine Quiet Luxury */}
      <section className="relative bg-navy text-white min-h-[75vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-forest/30" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <p className="text-gold font-medium tracking-[0.2em] uppercase text-sm mb-8">
              {t.tagline}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[1.1]">
              {t.headline}
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-light mb-12">
              {t.subheadline}
            </p>
            <Link 
              href="/apartmany-spindleruv-mlyn-pronajem"
              className="inline-block px-10 py-4 bg-gold text-navy font-medium tracking-wide hover:bg-gold-400 transition-colors"
            >
              {t.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Mode Overview - cream background, line icons */}
      <section className="py-28 md:py-36 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-16 md:gap-20">
            
            {/* Rent */}
            <div className="group">
              <div className="w-16 h-16 border border-navy/15 rounded-full flex items-center justify-center mb-8">
                <svg className="w-7 h-7 text-navy/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <h2 className="text-2xl font-medium text-navy mb-4">
                {t.rentTitle}
              </h2>
              <p className="text-navy/50 leading-relaxed mb-6">
                {t.rentDesc}
              </p>
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="inline-flex items-center text-navy font-medium group-hover:text-gold transition-colors"
              >
                {t.rentCta}
                <svg className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Sale */}
            <div className="group">
              <div className="w-16 h-16 border border-navy/15 rounded-full flex items-center justify-center mb-8">
                <svg className="w-7 h-7 text-navy/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h2 className="text-2xl font-medium text-navy mb-4">
                {t.saleTitle}
              </h2>
              <p className="text-navy/50 leading-relaxed mb-6">
                {t.saleDesc}
              </p>
              <Link 
                href="/apartmany-prodej"
                className="inline-flex items-center text-navy font-medium group-hover:text-gold transition-colors"
              >
                {t.saleCta}
                <svg className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Investment */}
            <div className="group">
              <div className="w-16 h-16 border border-navy/15 rounded-full flex items-center justify-center mb-8">
                <svg className="w-7 h-7 text-navy/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h2 className="text-2xl font-medium text-navy mb-4">
                {t.investTitle}
              </h2>
              <p className="text-navy/50 leading-relaxed mb-6">
                {t.investDesc}
              </p>
              <Link 
                href="/investicni-prilezitost"
                className="inline-flex items-center text-navy font-medium group-hover:text-gold transition-colors"
              >
                {t.investCta}
                <svg className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-28 md:py-36 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-navy mb-8">
              {t.aboutTitle}
            </h2>
            <p className="text-lg text-navy/50 leading-relaxed mb-10">
              {t.aboutText}
            </p>
            <Link 
              href="/o-projektu"
              className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
            >
              {t.aboutCta}
              <svg className="w-4 h-4 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-28 md:py-36 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            {t.contactTitle}
          </h2>
          <p className="text-lg text-white/50 mb-12 max-w-md mx-auto">
            {t.contactText}
          </p>
          <Link 
            href="/kontakt"
            className="inline-block px-10 py-4 bg-gold text-navy font-medium tracking-wide hover:bg-gold-400 transition-colors"
          >
            {t.contactCta}
          </Link>
        </div>
      </section>
    </>
  );
}
