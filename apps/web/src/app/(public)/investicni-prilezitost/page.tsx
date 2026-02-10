/**
 * Investment Page - Design Checklist 2030
 * 
 * - Jazyk klidný, institucionální
 * - Žádné procenta bez kontextu
 * - Důvěra > výkon
 * - Formulář diskrétní
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Investiční příležitost | Pod Zlatým návrším',
  description: 'Investujte do luxusních apartmánů v Krkonoších.',
};

export default async function InvestmentPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Dlouhodobá hodnota',
    title: 'Investice',
    subtitle: 'Stabilní zhodnocení v prémiové horské lokalitě',
    
    intro: 'Pod Zlatým návrším nabízí investiční příležitost pro ty, kteří hledají kombinaci stabilního výnosu a možnosti vlastního využití v nejžádanější horské destinaci České republiky.',
    
    section1Title: 'Proč investovat',
    section1Text: 'Špindlerův Mlýn je etablovaná destinace s celoroční poptávkou. Kombinace lyžařské sezóny a letní turistiky zajišťuje stabilní obsazenost apartmánů.',
    
    section2Title: 'Jak to funguje',
    section2Text: 'Zakoupíte apartmán v plném vlastnictví. My se postaráme o správu a pronájem. Vy čerpáte výnosy a máte možnost vlastního využití.',
    
    section3Title: 'Pro koho je to vhodné',
    section3Text: 'Pro investory hledající diverzifikaci portfolia do nemovitostí s pravidelným výnosem a potenciálem dlouhodobého zhodnocení.',
    
    cta: 'Zjistit více',
    ctaSubtext: 'Pošleme vám detailní informace',
  } : {
    tagline: 'Long-term value',
    title: 'Investment',
    subtitle: 'Stable appreciation in a premium mountain location',
    
    intro: 'Pod Zlatým návrším offers an investment opportunity for those seeking a combination of stable returns and personal use in the most sought-after mountain destination in the Czech Republic.',
    
    section1Title: 'Why invest',
    section1Text: 'Špindlerův Mlýn is an established destination with year-round demand. The combination of ski season and summer tourism ensures stable apartment occupancy.',
    
    section2Title: 'How it works',
    section2Text: 'You purchase an apartment in full ownership. We take care of management and rental. You receive returns and have the option of personal use.',
    
    section3Title: 'Who is it for',
    section3Text: 'For investors looking to diversify their portfolio into real estate with regular returns and long-term appreciation potential.',
    
    cta: 'Learn more',
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

      {/* Sections */}
      <section className="bg-stone">
        <div className="max-w-5xl mx-auto">
          
          {/* Section 1 */}
          <div className="py-20 px-6 border-b border-navy/10">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <span className="text-gold text-sm tracking-widest">01</span>
                <h2 className="text-2xl font-light text-navy mt-4">{t.section1Title}</h2>
              </div>
              <p className="text-navy/60 leading-relaxed">{t.section1Text}</p>
            </div>
          </div>
          
          {/* Section 2 */}
          <div className="py-20 px-6 border-b border-navy/10">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <span className="text-gold text-sm tracking-widest">02</span>
                <h2 className="text-2xl font-light text-navy mt-4">{t.section2Title}</h2>
              </div>
              <p className="text-navy/60 leading-relaxed">{t.section2Text}</p>
            </div>
          </div>
          
          {/* Section 3 */}
          <div className="py-20 px-6">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <span className="text-gold text-sm tracking-widest">03</span>
                <h2 className="text-2xl font-light text-navy mt-4">{t.section3Title}</h2>
              </div>
              <p className="text-navy/60 leading-relaxed">{t.section3Text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link 
            href="/kontakt?type=investment"
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
