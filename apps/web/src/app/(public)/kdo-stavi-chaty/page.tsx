/**
 * Kdo staví chaty - Design Checklist 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie, toBaseLocale } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import { withSeo } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return withSeo({
      title: 'Who is building | Pod Zlatým návrším',
      description: 'The Pod Zlatým návrším houses are built by ZFP GROUP; the low-energy timber construction was supplied by D.E.E.D.',
    }, '/kdo-stavi-chaty');
  }
  return withSeo({
    title: 'Kdo staví | Pod Zlatým návrším',
    description: 'Domy Pod Zlatým návrším staví ZFP GROUP, nízkoenergetickou dřevostavbu dodala firma D.E.E.D.',
  }, '/kdo-stavi-chaty');
}

export default async function BuilderPage() {
  const cookieStore = cookies();
  const locale = toBaseLocale(getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value));

  const t = locale === 'cs' ? {
    tagline: 'Za projektem',
    title: 'Kdo staví',
    subtitle: 'Domy Pod Zlatým návrším staví ZFP GROUP, stavbu dodala firma D.E.E.D.',
    
    intro: 'Vybrat dodavatele pro horské domy bylo velkou odpovědností. Chtěli jsme stavět s ohledem na okolí a s využitím moderních technologií. Proto jsme vybrali firmu D.E.E.D., která na českém trhu působí od roku 2001 a navazuje na šedesátiletou tradici německé firmy. Specializuje se na dřevostavby v Česku i po celé Evropě a stavební dílce vyrábí s renomovanými výrobci z Česka a Německa.',
    
    values: [
      { title: 'Materiály', desc: 'Ekologicky nezávadné certifikované materiály, výroba pod kontrolou RAL a Výzkumného a vývojového ústavu dřevařského' },
      { title: 'Úspora energie', desc: 'Nízkoenergetické domy, obvodové stěny s U = 0,16 W/m²K' },
      { title: 'Šetrná stavba', desc: 'Montáž jeřábem přímo ze speciálních vozidel, bez nákladného zařízení staveniště. Domy jsou zkolaudované od listopadu 2023.' },
    ],
    
    cta: 'Kontaktovat nás',
  } : {
    tagline: 'Behind the project',
    title: 'Who is building',
    subtitle: 'The Pod Zlatým návrším houses are built by ZFP GROUP, with construction by D.E.E.D.',
    
    intro: 'Choosing the right builder for our mountain houses was a big responsibility. We wanted to build with respect for the surroundings and with modern technology. That is why we chose D.E.E.D., a company active on the Czech market since 2001 that continues the sixty-year tradition of a German firm. It specialises in timber construction in the Czech Republic and across Europe, producing its building components with renowned Czech and German manufacturers.',
    
    values: [
      { title: 'Materials', desc: 'Environmentally safe certified materials, production inspected by RAL and the Timber Research and Development Institute' },
      { title: 'Energy efficiency', desc: 'Low-energy houses, external walls with U = 0.16 W/m²K' },
      { title: 'Considerate construction', desc: 'Assembled by crane directly from special vehicles, without a costly site setup. The houses received final approval in November 2023.' },
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
