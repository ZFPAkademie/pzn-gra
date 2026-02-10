/**
 * Standardy - Design Checklist 2030
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Standardy | Pod Zlatým návrším',
  description: 'Vysoký standard vybavení našich apartmánů.',
};

export default async function StandardsPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Kvalita v detailu',
    title: 'Standardy',
    subtitle: 'Každý apartmán je navržen s důrazem na komfort a nadčasový design',
    
    standards: [
      { title: 'Interiér', desc: 'Nadčasový design s důrazem na funkčnost. Kvalitní materiály a pečlivé zpracování.' },
      { title: 'Kuchyně', desc: 'Plně vybavená kuchyně s moderními spotřebiči. Vše pro pohodlné vaření.' },
      { title: 'Koupelna', desc: 'Prostorná koupelna s kvalitní sanitou. Luxusní sprcha a prémiová kosmetika.' },
      { title: 'Technologie', desc: 'Vysokorychlostní Wi-Fi, Smart TV a klimatizace v každém apartmánu.' },
    ],
    
    cta: 'Prohlédnout apartmány',
  } : {
    tagline: 'Quality in detail',
    title: 'Standards',
    subtitle: 'Every apartment is designed with emphasis on comfort and timeless design',
    
    standards: [
      { title: 'Interior', desc: 'Timeless design with emphasis on functionality. Quality materials and careful craftsmanship.' },
      { title: 'Kitchen', desc: 'Fully equipped kitchen with modern appliances. Everything for comfortable cooking.' },
      { title: 'Bathroom', desc: 'Spacious bathroom with quality sanitary ware. Luxury shower and premium cosmetics.' },
      { title: 'Technology', desc: 'High-speed Wi-Fi, Smart TV and air conditioning in every apartment.' },
    ],
    
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

      {/* Standards */}
      <section className="py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {t.standards.map((item, i) => (
              <div key={i} className="py-8 border-b border-navy/10">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <h3 className="text-xl font-light text-navy mt-4 mb-4">{item.title}</h3>
                <p className="text-navy/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
