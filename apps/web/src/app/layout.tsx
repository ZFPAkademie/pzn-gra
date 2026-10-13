import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { LanguageProvider } from '@/components/providers/language-provider';
import { getLocaleFromCookie, Locale } from '@/lib/i18n';

// Force dynamic rendering (uses cookies for locale)
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value) === 'en') {
    return {
      title: 'Pod Zlatým návrším | Luxury apartments in Špindlerův Mlýn',
      description: 'Luxury apartments in Špindlerův Mlýn - for sale and for rent. Golden Ridge Apartments.',
      keywords: 'apartments Špindl, apartments Špindlerův Mlýn, luxury accommodation Krkonoše, Giant Mountains, Golden Ridge Apartments',
    };
  }
  return {
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
