/**
 * Contact Page - Design Checklist 2030
 * Formulář = diskrétní
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie } from '@/lib/i18n';
import { ContactForm } from '@/components/features/contact-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kontakt | Pod Zlatým návrším',
  description: 'Kontaktujte nás pro více informací o apartmánech.',
};

export default async function ContactPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Jsme tu pro vás',
    title: 'Kontakt',
    subtitle: 'Rádi zodpovíme vaše dotazy. Odpovídáme do 24 hodin.',
    formTitle: 'Napište nám',
    address: 'Adresa',
    addressValue: 'Pod Zlatým návrším\nŠpindlerův Mlýn\n543 51',
    email: 'E-mail',
    emailValue: 'info@podzlatymnavrsim.cz',
    phone: 'Telefon',
    phoneValue: '+420 XXX XXX XXX',
  } : {
    tagline: 'We are here for you',
    title: 'Contact',
    subtitle: 'We are happy to answer your questions. We respond within 24 hours.',
    formTitle: 'Write to us',
    address: 'Address',
    addressValue: 'Pod Zlatým návrším\nŠpindlerův Mlýn\n543 51',
    email: 'Email',
    emailValue: 'info@podzlatymnavrsim.cz',
    phone: 'Phone',
    phoneValue: '+420 XXX XXX XXX',
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
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20">
            
            {/* Contact Info */}
            <div className="space-y-12">
              <div>
                <p className="text-sm text-navy/40 uppercase tracking-widest mb-4">{t.address}</p>
                <p className="text-navy whitespace-pre-line leading-relaxed">
                  {t.addressValue}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-navy/40 uppercase tracking-widest mb-4">{t.email}</p>
                <a href={`mailto:${t.emailValue}`} className="text-navy hover:text-gold transition-colors">
                  {t.emailValue}
                </a>
              </div>
              
              <div>
                <p className="text-sm text-navy/40 uppercase tracking-widest mb-4">{t.phone}</p>
                <p className="text-navy">{t.phoneValue}</p>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-8">{t.formTitle}</h2>
              <ContactForm locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
