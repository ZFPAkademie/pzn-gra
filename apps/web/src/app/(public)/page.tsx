/**
 * Homepage
 * Design Checklist 2030 — Pod Zlatým návrším
 * 
 * Pravidla:
 * - Hero = emoce, ne informace
 * - Jedna silná věta + jedno CTA
 * - ŽÁDNÉ ikony (Heroicons zakázány)
 * - Sekce oddělené rytmem, ne boxy
 * - Luxus = prostor a ticho
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pod Zlatým návrším | Apartmány Špindlerův Mlýn',
  description: 'Luxusní apartmány v srdci Krkonoš. Pronájem, prodej a investiční příležitosti ve Špindlerově Mlýně.',
};

export default async function HomePage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    // Hero - jedna věta, emoce
    headline: 'Kde hory potkávají ticho',
    cta: 'Objevit apartmány',
    
    // Sekce - minimalistické
    rentTitle: 'Pronájem',
    rentDesc: 'Krátkodobé pobyty v plně vybavených apartmánech',
    
    saleTitle: 'Vlastnictví',
    saleDesc: 'Prémiový apartmán v nejžádanější horské lokalitě',
    
    investTitle: 'Investice',
    investDesc: 'Stabilní zhodnocení s možností vlastního využití',
    
    more: 'Více',
    
    // Kontakt
    contactTitle: 'Máte zájem?',
    contactCta: 'Kontaktovat',
  } : {
    headline: 'Where mountains meet silence',
    cta: 'Discover apartments',
    
    rentTitle: 'Rent',
    rentDesc: 'Short-term stays in fully equipped apartments',
    
    saleTitle: 'Ownership',
    saleDesc: 'Premium apartment in the most sought-after mountain location',
    
    investTitle: 'Investment',
    investDesc: 'Stable returns with personal use options',
    
    more: 'More',
    
    contactTitle: 'Interested?',
    contactCta: 'Contact',
  };

  return (
    <>
      {/* HERO — Emoce, ne informace. Jedna věta. */}
      <section className="relative bg-navy min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy/50 to-navy" />
        
        <div className="relative text-center px-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-none mb-16">
            {t.headline}
          </h1>
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-block px-12 py-5 bg-gold text-navy text-sm font-medium tracking-widest uppercase hover:bg-gold-400 transition-colors"
          >
            {t.cta}
          </Link>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-px h-16 bg-white/20" />
        </div>
      </section>

      {/* SEKCE — Pronájem / Prodej / Investice */}
      {/* Oddělené rytmem a prostorem, ne boxy. Žádné ikony. */}
      <section className="bg-cream">
        <div className="max-w-5xl mx-auto">
          
          {/* Pronájem */}
          <div className="py-32 px-6 border-b border-navy/10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-gold text-sm tracking-widest uppercase mb-4 block">01</span>
                <h2 className="text-3xl md:text-4xl font-light text-navy mb-6">
                  {t.rentTitle}
                </h2>
                <p className="text-navy/50 text-lg leading-relaxed mb-8">
                  {t.rentDesc}
                </p>
                <Link 
                  href="/apartmany-spindleruv-mlyn-pronajem"
                  className="text-navy text-sm tracking-widest uppercase border-b border-navy pb-1 hover:text-gold hover:border-gold transition-colors"
                >
                  {t.more}
                </Link>
              </div>
              <div className="aspect-[4/3] bg-stone" />
            </div>
          </div>
          
          {/* Prodej */}
          <div className="py-32 px-6 border-b border-navy/10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="md:order-2">
                <span className="text-gold text-sm tracking-widest uppercase mb-4 block">02</span>
                <h2 className="text-3xl md:text-4xl font-light text-navy mb-6">
                  {t.saleTitle}
                </h2>
                <p className="text-navy/50 text-lg leading-relaxed mb-8">
                  {t.saleDesc}
                </p>
                <Link 
                  href="/apartmany-prodej"
                  className="text-navy text-sm tracking-widest uppercase border-b border-navy pb-1 hover:text-gold hover:border-gold transition-colors"
                >
                  {t.more}
                </Link>
              </div>
              <div className="aspect-[4/3] bg-stone md:order-1" />
            </div>
          </div>
          
          {/* Investice */}
          <div className="py-32 px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-gold text-sm tracking-widest uppercase mb-4 block">03</span>
                <h2 className="text-3xl md:text-4xl font-light text-navy mb-6">
                  {t.investTitle}
                </h2>
                <p className="text-navy/50 text-lg leading-relaxed mb-8">
                  {t.investDesc}
                </p>
                <Link 
                  href="/investicni-prilezitost"
                  className="text-navy text-sm tracking-widest uppercase border-b border-navy pb-1 hover:text-gold hover:border-gold transition-colors"
                >
                  {t.more}
                </Link>
              </div>
              <div className="aspect-[4/3] bg-stone" />
            </div>
          </div>
          
        </div>
      </section>

      {/* KONTAKT CTA — Diskrétní */}
      <section className="py-40 bg-navy">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-12">
            {t.contactTitle}
          </h2>
          <Link 
            href="/kontakt"
            className="inline-block px-12 py-5 border border-white/30 text-white text-sm tracking-widest uppercase hover:bg-white hover:text-navy transition-colors"
          >
            {t.contactCta}
          </Link>
        </div>
      </section>
    </>
  );
}
