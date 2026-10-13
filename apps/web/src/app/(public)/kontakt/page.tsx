/**
 * Kontakt - Design 2030
 * Kompletní obsah + nový design
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie, toBaseLocale } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import { ContactForm } from '@/components/features/contact-form';
import { getSalesManager } from '@/lib/apartments';
import { SALES_COMPANY } from '@/data/sales-company';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getRequestLocale() === 'en') {
    return {
      title: 'Contact | Pod Zlatým návrším',
      description: 'Contact us for more information about the apartments in Špindlerův Mlýn.',
    };
  }
  return {
    title: 'Kontakt | Pod Zlatým návrším',
    description: 'Kontaktujte nás pro více informací o apartmánech ve Špindlerově Mlýně.',
  };
}

export default async function ContactPage() {
  const cookieStore = cookies();
  const locale = toBaseLocale(getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value));

  const t = locale === 'cs' ? {
    tagline: 'Jsme tu pro vás',
    title: 'Kontaktujte nás',
    subtitle: 'Máte zájem o apartmán nebo ubytování? Napište nám.',
    formTitle: 'Napište nám',
    
    saleTitle: 'Prodej apartmánů',
    saleDesc: 'Pro informace o apartmánech na prodej kontaktujte:',
    sellerLabel: 'Prodávající',
    sellerRegister: `Zapsaná v obchodním rejstříku, sp. zn. ${SALES_COMPANY.registerCs}`,
    icoLabel: 'IČ',
    dicLabel: 'DIČ',
    
    rentalTitle: 'Pronájem',
    rentalDesc: 'Pro rezervace a dotazy k ubytování:',
    rentalEmail: 'rezervace@podzlatymnavrsim.cz',
    // Telefon pro pronájem zatím nemáme potvrzený — prázdný = nezobrazuje se (dřív „+420 XXX XXX XXX")
    rentalPhone: '',
    
    address: 'Adresa',
    addressLine1: 'Pod Zlatým návrším',
    addressLine2: 'Špindlerův Mlýn',
    addressLine3: '543 51',
    
    hours: 'Provozní doba',
    hoursValue: 'Po–Pá: 9:00–17:00',
  } : {
    tagline: 'We are here for you',
    title: 'Contact us',
    subtitle: 'Interested in an apartment or a stay? Write to us.',
    formTitle: 'Write to us',
    
    saleTitle: 'Apartment sales',
    saleDesc: 'For information about apartments for sale, please contact:',
    sellerLabel: 'Seller',
    sellerRegister: `Registered in the Commercial Register, file no. ${SALES_COMPANY.registerEn}`,
    icoLabel: 'Company ID',
    dicLabel: 'VAT ID',
    
    rentalTitle: 'Rentals',
    rentalDesc: 'For bookings and accommodation enquiries:',
    rentalEmail: 'rezervace@podzlatymnavrsim.cz',
    rentalPhone: '',
    
    address: 'Address',
    addressLine1: 'Pod Zlatým návrším',
    addressLine2: 'Špindlerův Mlýn',
    addressLine3: '543 51',
    
    hours: 'Office hours',
    hoursValue: 'Mon–Fri: 9:00–17:00',
  };

  const manager = getSalesManager();
  const managerTitle = locale === 'cs' ? manager.title : 'Sales manager';

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
                  <p className="text-navy">
                    {manager.name}
                    <span className="text-navy/50 text-sm ml-2">{managerTitle}</span>
                  </p>
                  <a href={`tel:${manager.phone.replace(/\s/g, '')}`} className="block text-navy hover:text-gold transition-colors">
                    {manager.phone}
                  </a>
                  <a href={`mailto:${manager.email}`} className="block text-navy hover:text-gold transition-colors">
                    {manager.email}
                  </a>
                </div>
                <div className="mt-6 text-sm text-navy/60 leading-relaxed">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.sellerLabel}</p>
                  <p className="text-navy">{SALES_COMPANY.name}</p>
                  <p>{SALES_COMPANY.address}</p>
                  <p>{t.icoLabel} {SALES_COMPANY.ico} · {t.dicLabel} {SALES_COMPANY.dic}</p>
                  <p>{t.sellerRegister}</p>
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
                  {t.rentalPhone && <p className="text-navy">{t.rentalPhone}</p>}
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
