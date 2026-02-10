/**
 * Nemovitostní produkt - Design Checklist 2030
 * Družstevní podíl - institucionální jazyk
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nemovitostní produkt | Pod Zlatým návrším',
  description: 'Družstevní podíl na horském apartmánu ve Špindlerově Mlýně.',
};

export default async function RealEstateProductPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Alternativní forma vlastnictví',
    title: 'Nemovitostní produkt',
    subtitle: 'Družstevní podíl na horském apartmánu',
    
    intro: 'Pro ty, kteří hledají přístup k prémiové nemovitosti bez nutnosti plného vlastnictví. Družstevní podíl kombinuje výhody investice s flexibilitou využití.',
    
    benefits: [
      { title: 'Anonymita vlastnictví', desc: 'Dle struktury družstevního podílu' },
      { title: 'Nižší vstupní investice', desc: 'Zlomek ceny plného vlastnictví' },
      { title: 'Podíl na výnosech', desc: 'Participace na příjmech z pronájmu' },
      { title: 'Vlastní využití', desc: 'Možnost pobytu se slevou' },
    ],
    
    howItWorks: 'Jak to funguje',
    howItWorksText: 'Zakoupíte podíl na družstvu vlastnícím apartmán. Družstvo zajišťuje správu a pronájem. Vy jako podílník čerpáte výnosy a máte přednostní právo na využití apartmánu za zvýhodněných podmínek.',
    
    cta: 'Mám zájem',
    ctaSubtext: 'Zašleme vám podrobné informace',
  } : {
    tagline: 'Alternative ownership',
    title: 'Real Estate Product',
    subtitle: 'Cooperative share in a mountain apartment',
    
    intro: 'For those seeking access to premium real estate without full ownership. Cooperative shares combine investment benefits with usage flexibility.',
    
    benefits: [
      { title: 'Ownership privacy', desc: 'Per cooperative share structure' },
      { title: 'Lower entry investment', desc: 'Fraction of full ownership cost' },
      { title: 'Share of returns', desc: 'Participation in rental income' },
      { title: 'Personal use', desc: 'Discounted stay options' },
    ],
    
    howItWorks: 'How it works',
    howItWorksText: 'You purchase a share in a cooperative owning the apartment. The cooperative manages rentals. As a shareholder, you receive returns and have priority access to the apartment at preferential rates.',
    
    cta: 'I am interested',
    ctaSubtext: 'We will send you detailed information',
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

      {/* Benefits */}
      <section className="py-24 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {t.benefits.map((benefit, i) => (
              <div key={i} className="py-8 border-b border-navy/10">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <h3 className="text-xl font-light text-navy mt-4 mb-3">{benefit.title}</h3>
                <p className="text-navy/50">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-8 text-center">
            {t.howItWorks}
          </h2>
          <p className="text-lg text-navy/60 leading-relaxed text-center">
            {t.howItWorksText}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/kontakt?type=share"
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
