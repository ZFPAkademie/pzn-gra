import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { LanguageProvider } from '@/components/providers/language-provider';
import { getLocaleFromCookie, Locale } from '@/lib/i18n';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

// Force dynamic rendering (uses cookies for locale)
export const dynamic = 'force-dynamic';

// Výchozí hodnoty pro stránky bez vlastních metadat; stránky si og:* doplňují přes withSeo()
const BASE: Metadata = {
  metadataBase: new URL(SITE_URL),
  twitter: { card: 'summary_large_image' },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value);
  if (locale === 'pl') {
    return {
      ...BASE,
      openGraph: { type: 'website', siteName: SITE_NAME, locale: 'pl_PL' },
      title: 'Pod Zlatým návrším | Apartamenty w Szpindlerowym Młynie',
      description: 'Apartamenty na wynajem w Szpindlerowym Młynie, 50 metrów od wyciągu Labská. Rezerwacja online. Golden Ridge Apartments.',
      keywords: 'apartamenty Szpindlerowy Młyn, noclegi Szpindlerowy Młyn, apartamenty Karkonosze, Špindlerův Mlýn, Golden Ridge Apartments',
    };
  }
  if (locale === 'en') {
    return {
      ...BASE,
      openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_GB' },
      title: 'Pod Zlatým návrším | Luxury apartments in Špindlerův Mlýn',
      description: 'Luxury apartments in Špindlerův Mlýn - for sale and for rent. Golden Ridge Apartments.',
      keywords: 'apartments Špindl, apartments Špindlerův Mlýn, luxury accommodation Krkonoše, Giant Mountains, Golden Ridge Apartments',
    };
  }
  return {
    ...BASE,
    openGraph: { type: 'website', siteName: SITE_NAME, locale: 'cs_CZ' },
    title: 'Pod Zlatým návrším | Luxusní apartmány Špindlerův Mlýn',
    description: 'Luxusní apartmány ve Špindlerově Mlýně - prodej a pronájem. Golden Ridge Apartments.',
    keywords: 'apartmány Špindl, apartmány Špindlerův Mlýn, luxusní ubytování Krkonoše, Golden Ridge Apartments',
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookie for initial render
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = getLocaleFromCookie(localeCookie) as Locale;

  return (
    <html lang={locale === 'cs' ? 'cs' : 'en'}>
      <body className="antialiased">
        <LanguageProvider initialLocale={locale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
