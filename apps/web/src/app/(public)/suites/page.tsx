/**
 * Suites - Design Checklist 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Suites | Pod Zlatým návrším',
  description: 'Prémiové apartmánové suity.',
};

export default async function SuitesPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Prémiová kategorie',
    title: 'Suites',
    subtitle: 'Výjimečné apartmány pro náročné hosty',
    
    intro: 'Naše suity představují vrchol nabídky Pod Zlatým návrším. Prostornější dispozice, luxusnější vybavení a výhledy, na které nezapomenete.',
    
    features: [
      'Prostornější dispozice od 60 m²',
      'Panoramatické výhledy na hory',
      'Prémiové vybavení a materiály',
      'Privátní sauna nebo vířivka',
    ],
    
    cta: 'Kontaktovat nás',
    ctaSubtext: 'Pro dostupnost a rezervace',
  } : {
    tagline: 'Premium category',
    title: 'Suites',
    subtitle: 'Exceptional apartments for discerning guests',
    
    intro: 'Our suites represent the pinnacle of Pod Zlatým návrším offering. More spacious layouts, luxurious amenities, and views you will never forget.',
    
    features: [
      'Spacious layouts from 60 m²',
      'Panoramic mountain views',
      'Premium amenities and materials',
      'Private sauna or hot tub',
    ],
    
    cta: 'Contact us',
    ctaSubtext: 'For availability and reservations',
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            {t.tagline}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6">
            {t.title}
          </h1>
          <p className="text-xl text-white/50 max-w-xl">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xl md:text-2xl text-navy/70 leading-relaxed text-center">
            {t.intro}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-stone">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-6">
            {t.features.map((feature, i) => (
              <div key={i} className="flex items-center text-navy/70 py-4 border-b border-navy/10">
                <span className="w-12 h-px bg-gold mr-6" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/kontakt?type=suites"
            className="inline-block px-12 py-5 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors mb-6"
          >
            {t.cta}
          </Link>
          <p className="text-white/40 text-sm">{t.ctaSubtext}</p>
        </div>
      </section>
    </>
  );
}
