/**
 * Investiční příležitost - Design 2030
 * Kompletní obsah + nový design
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie } from '@/lib/i18n';
import { InvestmentCTA } from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Investiční příležitost | Pod Zlatým návrším',
  description: 'Investujte do luxusních apartmánů v Krkonoších. Stabilní výnosy a dlouhodobé zhodnocení.',
};

// Investment benefits
const benefits = [
  { title: 'Stabilní výnosy', description: 'Průměrná roční obsazenost 65-75 % díky celoroční turistické sezóně.' },
  { title: 'Dlouhodobé zhodnocení', description: 'Historický růst cen nemovitostí ve Špindlerově Mlýně 8-12 % ročně.' },
  { title: 'Vlastní využití', description: 'Možnost vlastního pobytu v apartmánu kdykoliv během roku.' },
  { title: 'Profesionální správa', description: 'Kompletní servis včetně úklidu, údržby a správy rezervací.' },
  { title: 'Prémiová lokalita', description: 'Nejžádanější horská destinace v České republice.' },
  { title: 'Daňové výhody', description: 'Odpisy a náklady na správu jako daňově uznatelné výdaje.' },
];

// Why invest here
const reasons = [
  { number: '01', title: 'Etablovaná destinace', text: 'Špindlerův Mlýn je etablovaná destinace s celoroční poptávkou. Kombinace lyžařské sezóny a letní turistiky zajišťuje stabilní obsazenost apartmánů.' },
  { number: '02', title: 'Limitovaná nabídka', text: 'Omezené možnosti nové výstavby v KRNAP znamenají dlouhodobě rostoucí hodnotu existujících nemovitostí.' },
  { number: '03', title: 'Silná poptávka', text: 'Rostoucí zájem o kvalitní horské ubytování ze strany českých i zahraničních turistů.' },
];

export default async function InvestmentPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Investiční příležitost',
    title: 'Vlastněte kousek hor',
    subtitle: 'Stabilní zhodnocení v prémiové horské lokalitě s možností vlastního využití',
    benefitsTitle: 'Proč investovat',
    reasonsTitle: 'Proč právě zde',
    lastChance: 'Poslední šance',
    lastApartment: 'Poslední dostupný apartmán k prodeji',
    ctaTitle: 'Máte zájem?',
    ctaText: 'Zanechte nám kontakt a připravíme vám detailní investiční nabídku.',
    ctaButton: 'Získat nabídku',
    shareLink: 'Nechcete kupovat celý apartmán? Zvažte koupi podílu.',
    shareLinkText: 'Zjistit více o nemovitostním produktu',
  } : {
    tagline: 'Investment opportunity',
    title: 'Own a piece of the mountains',
    subtitle: 'Stable appreciation in a premium mountain location with personal use options',
    benefitsTitle: 'Why invest',
    reasonsTitle: 'Why here',
    lastChance: 'Last chance',
    lastApartment: 'Last available apartment for sale',
    ctaTitle: 'Interested?',
    ctaText: 'Leave us your contact and we will prepare a detailed investment offer.',
    ctaButton: 'Get offer',
    shareLink: "Don't want to buy a whole apartment? Consider buying a share.",
    shareLinkText: 'Learn more about real estate shares',
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

      {/* Last Chance Banner */}
      <section className="py-6 bg-gold">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy font-medium">
            <span className="uppercase tracking-widest text-sm">{t.lastChance}:</span>{' '}
            {t.lastApartment}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            {t.benefitsTitle}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {benefits.map((benefit, i) => (
              <div key={i} className="py-6 border-b border-navy/10">
                <h3 className="text-navy font-medium mb-3">{benefit.title}</h3>
                <p className="text-sm text-navy/50 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why here */}
      <section className="py-24 bg-stone">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            {t.reasonsTitle}
          </h2>
          {reasons.map((reason, i) => (
            <div key={i} className="py-12 border-b border-navy/10 last:border-0">
              <div className="grid md:grid-cols-3 gap-8 items-start">
                <div>
                  <span className="text-gold text-sm tracking-widest">{reason.number}</span>
                  <h3 className="text-xl font-light text-navy mt-2">{reason.title}</h3>
                </div>
                <p className="md:col-span-2 text-navy/60 leading-relaxed">{reason.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            {t.ctaTitle}
          </h2>
          <p className="text-white/50 mb-10 max-w-md mx-auto">
            {t.ctaText}
          </p>
          <InvestmentCTA label={t.ctaButton} locale={locale} />
        </div>
      </section>

      {/* Link to Nemovitostní produkt */}
      <section className="py-16 bg-cream border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">
            {t.shareLink}
          </p>
          <Link 
            href="/nemovitostni-produkt"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            {t.shareLinkText}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
