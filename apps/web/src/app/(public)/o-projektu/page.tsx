/**
 * O projektu - Design Checklist 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'O projektu | Pod Zlatým návrším',
  description: 'Rezidenční projekt v srdci Krkonoš.',
};

export default async function AboutPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'O projektu',
    title: 'Pod Zlatým návrším',
    subtitle: 'Rezidenční projekt zasazený do malebné krajiny Krkonoš',
    
    vision: 'Vize',
    visionText: 'Vytvořit místo, kde se spojuje moderní komfort s úctou k horské krajině. Místo pro odpočinek, zhodnocení a návrat k tomu, co je důležité.',
    
    location: 'Lokalita',
    locationText: 'Špindlerův Mlýn je nejvyhledávanější horskou destinací v České republice. Celoroční turistický ruch, skvělá dostupnost z Prahy a unikátní přírodní prostředí.',
    
    quality: 'Kvalita',
    qualityText: 'Každý apartmán je navržen s důrazem na detail. Kvalitní materiály, promyšlené dispozice a nadčasový design.',
    
    cta: 'Prohlédnout apartmány',
  } : {
    tagline: 'About',
    title: 'Pod Zlatým návrším',
    subtitle: 'Residential project set in the picturesque Giant Mountains landscape',
    
    vision: 'Vision',
    visionText: 'To create a place where modern comfort meets respect for the mountain landscape. A place for relaxation, appreciation, and return to what matters.',
    
    location: 'Location',
    locationText: 'Špindlerův Mlýn is the most sought-after mountain destination in the Czech Republic. Year-round tourism, excellent accessibility from Prague, and unique natural environment.',
    
    quality: 'Quality',
    qualityText: 'Every apartment is designed with attention to detail. Quality materials, thoughtful layouts, and timeless design.',
    
    cta: 'View apartments',
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

      {/* Content */}
      <section className="bg-cream">
        <div className="max-w-5xl mx-auto">
          
          <div className="py-20 px-6 border-b border-navy/10">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <h2 className="text-2xl font-light text-navy">{t.vision}</h2>
              <p className="text-navy/60 leading-relaxed">{t.visionText}</p>
            </div>
          </div>
          
          <div className="py-20 px-6 border-b border-navy/10">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <h2 className="text-2xl font-light text-navy">{t.location}</h2>
              <p className="text-navy/60 leading-relaxed">{t.locationText}</p>
            </div>
          </div>
          
          <div className="py-20 px-6">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <h2 className="text-2xl font-light text-navy">{t.quality}</h2>
              <p className="text-navy/60 leading-relaxed">{t.qualityText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-block px-12 py-5 bg-navy text-white text-sm tracking-widest uppercase hover:bg-navy-700 transition-colors"
          >
            {t.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
