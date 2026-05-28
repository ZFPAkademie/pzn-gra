/**
 * Kontakt (Contact) Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /kontakt (SEO Critical)
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { Container, Section, Card, CardContent } from '@/components/ui';
import { ContactForm } from '@/components/features/contact-form';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return {
    title: `${t('contact.title')} | Pod Zlatým návrším`,
    description: t('contact.subtitle'),
  };
}

export default function KontaktPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return (
    <>
      {/* Page Header */}
      <Section background="light" className="py-12 md:py-16">
        <Container size="narrow">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-xl text-slate-600">
            {t('contact.subtitle')}
          </p>
        </Container>
      </Section>

      {/* Contact Content */}
      <Section>
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              {/* Sale Contact */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    {t('contact.saleTitle')}
                  </h2>
                  <p className="text-slate-600 mb-4">
                    {t('contact.saleDesc')}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-slate-900 font-medium">Michal Novotný</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href="mailto:michal.novotny@zfpa.cz" className="text-slate-900 hover:text-slate-700">
                        michal.novotny@zfpa.cz
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href="tel:+420736242624" className="text-slate-900 hover:text-slate-700">
                        +420 736 242 624
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rental Contact */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    {t('contact.rentalTitle')}
                  </h2>
                  <p className="text-slate-600 mb-4">
                    {t('contact.rentalDesc')}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-slate-900 font-medium">Golden Ridge Apartments</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="text-slate-600">
                        {locale === 'cs' 
                          ? 'Rezervace přes web nebo OTA platformy'
                          : 'Book via web or OTA platforms'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    {t('common.address')}
                  </h2>
                  <address className="not-italic text-slate-600">
                    Pod Zlatým návrším<br />
                    Špindlerův Mlýn<br />
                    543 51<br />
                    Česká republika
                  </address>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">
                    {t('contact.formTitle')}
                  </h2>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
