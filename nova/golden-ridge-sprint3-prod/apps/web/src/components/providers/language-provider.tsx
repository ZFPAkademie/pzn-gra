'use client';

/**
 * Language Provider
 * Sprint 1: Client-side language context
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, locales, createT } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function LanguageProvider({ children, initialLocale = defaultLocale }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Initialize from cookie on mount
  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.split('=')[1] as Locale | undefined;

    if (cookieLocale && locales.includes(cookieLocale)) {
      setLocaleState(cookieLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale);
      // Set cookie for 1 year
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
      // Refresh the page to get new server-side translations
      window.location.reload();
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => createT(locale)(key, params),
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
