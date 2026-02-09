/**
 * Homepage
 * Production v1: Hero + Mode Overview + CTAs
 * 
 * Design Rules:
 * - Dark navy/charcoal text
 * - White/off-white background
 * - Gold/bronze accent (5-10% max)
 * - Premium, quiet tone
 * - No exclamation marks in CTAs
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { getRentApartments, getSaleApartments } from '@/lib/apartments';

export const metadata: Metadata = {
  title: 'Pod Zlatým návrším | Apartmány Špindlerův Mlýn',
  description: 'Luxusní apartmány v srdci Krkonoš. Pronájem, prodej a investiční příležitosti ve Špindlerově Mlýně.',
};

export default async function HomePage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  
  const rentCount = getRentApartments().length;
  const saleCount = getSaleApartments().length;

  const t = locale === 'cs' ? {
    heroTitle: 'Pod Zlatým návrším',
    heroSubtitle: 'Luxusní apartmány v srdci Krkonoš',
    heroDescription: 'Objevte výjimečné bydlení ve Špindlerově Mlýně. Prémiové apartmány k pronájmu i prodeji v nejžádanější horské destinaci České republiky.',
    
    rentTitle: 'Pronájem',
    rentDesc: 'Krátkodobé pobyty v plně vybavených apartmánech',
    rentCta: 'Zobrazit apartmány',
    rentCount: `${rentCount} dostupných`,
    
    saleTitle: 'Prodej',
    saleDesc: 'Vlastnictví apartmánu v prémiové horské lokalitě',
    saleCta: 'Prohlédnout nabídku',
    saleCount: `${saleCount} k prodeji`,
    
    investTitle: 'Investice',
    investDesc: 'Stabilní zhodnocení s možností vlastního využití',
    investCta: 'Zjistit více',
    
    aboutTitle: 'O projektu',
    aboutText: 'Pod Zlatým návrším je rezidenční projekt zasazený do malebné krajiny Krkonoš. Kombinace moderní architektury, kvalitních materiálů a respektu k přírodě vytváří jedinečné místo pro odpočinek i život.',
    aboutCta: 'Více o projektu',
    
    contactTitle: 'Máte dotaz?',
    contactText: 'Rádi vám odpovíme na vaše otázky ohledně pronájmu, prodeje či investičních možností.',
    contactCta: 'Kontaktovat nás',
  } : {
    heroTitle: 'Pod Zlatým návrším',
    heroSubtitle: 'Luxury apartments in the heart of the Giant Mountains',
    heroDescription: 'Discover exceptional living in Špindlerův Mlýn. Premium apartments for rent and sale in the most sought-after mountain destination in the Czech Republic.',
    
    rentTitle: 'Rent',
    rentDesc: 'Short-term stays in fully equipped apartments',
    rentCta: 'View apartments',
    rentCount: `${rentCount} available`,
    
    saleTitle: 'Sale',
    saleDesc: 'Own an apartment in a premium mountain location',
    saleCta: 'Browse listings',
    saleCount: `${saleCount} for sale`,
    
    investTitle: 'Investment',
    investDesc: 'Stable returns with personal use options',
    investCta: 'Learn more',
    
    aboutTitle: 'About the project',
    aboutText: 'Pod Zlatým návrším is a residential project set in the picturesque landscape of the Giant Mountains. A combination of modern architecture, quality materials, and respect for nature creates a unique place for relaxation and living.',
    aboutCta: 'More about the project',
    
    contactTitle: 'Have a question?',
    contactText: 'We will be happy to answer your questions about rentals, sales, or investment opportunities.',
    contactCta: 'Contact us',
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-navy text-white">
        {/* Background overlay for future image */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 to-navy/95" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <p className="text-gold font-medium tracking-wide mb-4">
              Špindlerův Mlýn · Krkonoše
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-stone-400 font-light mb-4">
              {t.heroSubtitle}
            </p>
            <p className="text-lg text-stone-500 max-w-2xl mb-10">
              {t.heroDescription}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="px-6 py-3 bg-gold text-navy font-medium rounded hover:bg-gold-400 transition-colors"
              >
                {t.rentCta}
              </Link>
              <Link 
                href="/kontakt"
                className="px-6 py-3 border border-white/30 text-white font-medium rounded hover:bg-white/10 transition-colors"
              >
                {t.contactCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Overview Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Rent */}
            <div className="group">
              <div className="mb-6">
                <span className="inline-flex w-12 h-12 bg-stone rounded-full items-center justify-center text-2xl mb-4">
                  🏠
                </span>
                <h2 className="text-2xl font-medium text-navy mb-2">
                  {t.rentTitle}
                </h2>
                <p className="text-stone-700 mb-4">
                  {t.rentDesc}
                </p>
                <p className="text-sm text-gold font-medium">
                  {t.rentCount}
                </p>
              </div>
              <Link 
                href="/apartmany-spindleruv-mlyn-pronajem"
                className="inline-flex items-center text-navy font-medium group-hover:text-gold transition-colors"
              >
                {t.rentCta}
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Sale */}
            <div className="group">
              <div className="mb-6">
                <span className="inline-flex w-12 h-12 bg-stone rounded-full items-center justify-center text-2xl mb-4">
                  🔑
                </span>
                <h2 className="text-2xl font-medium text-navy mb-2">
                  {t.saleTitle}
                </h2>
                <p className="text-stone-700 mb-4">
                  {t.saleDesc}
                </p>
                <p className="text-sm text-gold font-medium">
                  {t.saleCount}
                </p>
              </div>
              <Link 
                href="/apartmany-prodej"
                className="inline-flex items-center text-navy font-medium group-hover:text-gold transition-colors"
              >
                {t.saleCta}
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Investment */}
            <div className="group">
              <div className="mb-6">
                <span className="inline-flex w-12 h-12 bg-stone rounded-full items-center justify-center text-2xl mb-4">
                  📈
                </span>
                <h2 className="text-2xl font-medium text-navy mb-2">
                  {t.investTitle}
                </h2>
                <p className="text-stone-700 mb-4">
                  {t.investDesc}
                </p>
              </div>
              <Link 
                href="/investicni-prilezitost"
                className="inline-flex items-center text-navy font-medium group-hover:text-gold transition-colors"
              >
                {t.investCta}
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 md:py-28 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light text-navy mb-6">
              {t.aboutTitle}
            </h2>
            <p className="text-lg text-stone-700 mb-8 leading-relaxed">
              {t.aboutText}
            </p>
            <Link 
              href="/o-projektu"
              className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
            >
              {t.aboutCta}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 md:py-28 bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            {t.contactTitle}
          </h2>
          <p className="text-lg text-stone-500 mb-8 max-w-2xl mx-auto">
            {t.contactText}
          </p>
          <Link 
            href="/kontakt"
            className="inline-block px-8 py-3 bg-gold text-navy font-medium rounded hover:bg-gold-400 transition-colors"
          >
            {t.contactCta}
          </Link>
        </div>
      </section>
    </>
  );
}
