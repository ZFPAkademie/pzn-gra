/**
 * Kontakt - Design 2030
 * Kompletní obsah + nový design
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie } from '@/lib/i18n';
import { ContactForm } from '@/components/features/contact-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kontakt | Pod Zlatým návrším',
  description: 'Kontaktujte nás pro více informací o apartmánech ve Špindlerově Mlýně.',
};

export default async function ContactPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const t = locale === 'cs' ? {
    tagline: 'Jsme tu pro vás',
    title: 'Kontaktujte nás',
    subtitle: 'Máte zájem o apartmán nebo ubytování? Napište nám.',
    formTitle: 'Napište nám',
    
    saleTitle: 'Prodej apartmánů',
    saleDesc: 'Pro informace o posledním dostupném apartmánu kontaktujte:',
    saleEmail: 'prodej@podzlatymnavrsim.cz',
    salePhone: '+420 XXX XXX XXX',
    
    rentalTitle: 'Pronájem',
    rentalDesc: 'Pro rezervace a dotazy k ubytování:',
    rentalEmail: 'rezervace@podzlatymnavrsim.cz',
    rentalPhone: '+420 XXX XXX XXX',
    
    address: 'Adresa',
    addressLine1: 'Pod Zlatým návrším',
    addressLine2: 'Špindlerův Mlýn',
    addressLine3: '543 51',
    
    hours: 'Provozní doba',
    hoursValue: 'Po–Pá: 9:00–17:00',
  } : {
    tagline: 'We are here for you',
    title: 'Contact us',
    subtitle: 'Interested in an apartment or accommodation? Write to us.',
    formTitle: 'Write to us',
    
    saleTitle: 'Apartment sales',
    saleDesc: 'For information about the last available apartment contact:',
    saleEmail: 'sales@podzlatymnavrsim.cz',
    salePhone: '+420 XXX XXX XXX',
    
    rentalTitle: 'Rental',
    rentalDesc: 'For reservations and accommodation inquiries:',
    rentalEmail: 'booking@podzlatymnavrsim.cz',
    rentalPhone: '+420 XXX XXX XXX',
    
    address: 'Address',
    addressLine1: 'Pod Zlatým návrším',
    addressLine2: 'Špindlerův Mlýn',
    addressLine3: '543 51',
    
    hours: 'Office hours',
    hoursValue: 'Mon–Fri: 9:00–17:00',
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

      {/* Contact Info + Form */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20">
            
            {/* Left - Contact Info */}
            <div className="space-y-12">
              {/* Sale */}
              <div className="pb-8 border-b border-navy/10">
                <h2 className="text-navy font-medium mb-4">{t.saleTitle}</h2>
                <p className="text-sm text-navy/50 mb-4">{t.saleDesc}</p>
                <div className="space-y-2">
                  <a href={`mailto:${t.saleEmail}`} className="block text-navy hover:text-gold transition-colors">
                    {t.saleEmail}
                  </a>
                  <p className="text-navy">{t.salePhone}</p>
                </div>
              </div>
              
              {/* Rental */}
              <div className="pb-8 border-b border-navy/10">
                <h2 className="text-navy font-medium mb-4">{t.rentalTitle}</h2>
                <p className="text-sm text-navy/50 mb-4">{t.rentalDesc}</p>
                <div className="space-y-2">
                  <a href={`mailto:${t.rentalEmail}`} className="block text-navy hover:text-gold transition-colors">
                    {t.rentalEmail}
                  </a>
                  <p className="text-navy">{t.rentalPhone}</p>
                </div>
              </div>
              
              {/* Address */}
              <div className="pb-8 border-b border-navy/10">
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-4">{t.address}</h2>
                <p className="text-navy leading-relaxed">
                  {t.addressLine1}<br />
                  {t.addressLine2}<br />
                  {t.addressLine3}
                </p>
              </div>
              
              {/* Hours */}
              <div>
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-4">{t.hours}</h2>
                <p className="text-navy">{t.hoursValue}</p>
              </div>
            </div>

            {/* Right - Form */}
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
