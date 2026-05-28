import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { LanguageProvider } from '@/components/providers/language-provider';
import { getLocaleFromCookie, Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Pod Zlatým návrším | Luxusní apartmány Špindlerův Mlýn',
  description: 'Luxusní apartmány ve Špindlerově Mlýně - prodej a pronájem. Golden Ridge Apartments.',
  keywords: 'apartmány Špindl, apartmány Špindlerův Mlýn, luxusní ubytování Krkonoše, Golden Ridge Apartments',
};

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
