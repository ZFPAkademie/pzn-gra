/**
 * Kdo staví chaty - Design Checklist 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie, toBaseLocale } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return {
      title: 'Who is building | Pod Zlatým návrším',
      description: 'The experienced team behind the Pod Zlatým návrším project.',
    };
  }
  return {
    title: 'Kdo staví | Pod Zlatým návrším',
    description: 'Zkušený tým za projektem Pod Zlatým návrším.',
  };
}

export default async function BuilderPage() {
  const cookieStore = cookies();
  const locale = toBaseLocale(getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value));

  const t = locale === 'cs' ? {
    tagline: 'Za projektem',
    title: 'Kdo staví',
    subtitle: 'Zkušený tým s dlouholetou praxí v rezidenčním developmentu',
    
    intro: 'Projekt Pod Zlatým návrším vzniká pod vedením zkušeného týmu, který má za sebou desítky úspěšně realizovaných rezidenčních projektů.',
    
    values: [
      { title: 'Zkušenosti', desc: 'Více než 15 let v rezidenčním developmentu' },
      { title: 'Kvalita', desc: 'Důraz na materiály a zpracování' },
      { title: 'Transparentnost', desc: 'Otevřená komunikace s klienty' },
    ],
    
    cta: 'Kontaktovat nás',
  } : {
    tagline: 'Behind the project',
    title: 'Who is building',
    subtitle: 'An experienced team with many years of practice in residential development',
    
    intro: 'The Pod Zlatým návrším project is being developed under the leadership of an experienced team with dozens of successfully completed residential projects behind it.',
    
    values: [
      { title: 'Experience', desc: 'More than 15 years in residential development' },
      { title: 'Quality', desc: 'Emphasis on materials and craftsmanship' },
      { title: 'Transparency', desc: 'Open communication with clients' },
    ],
    
    cta: 'Contact us',
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

      {/* Values */}
      <section className="py-24 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {t.values.map((value, i) => (
              <div key={i} className="text-center">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <h3 className="text-xl font-light text-navy mt-4 mb-4">{value.title}</h3>
                <p className="text-navy/50">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/kontakt"
            className="inline-block px-12 py-5 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors"
          >
            {t.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
