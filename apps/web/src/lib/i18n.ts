/**
 * Internationalization (i18n) Configuration
 * Sprint 1: Basic CZ/EN support per SPRINT_1_PLAN.md §8
 */

import cs from '@/messages/cs.json';
import en from '@/messages/en.json';

export type Locale = 'cs' | 'en';

export const defaultLocale: Locale = 'cs';

export const locales: Locale[] = ['cs', 'en'];

export const localeNames: Record<Locale, string> = {
  cs: 'Čeština',
  en: 'English',
};

const messages: Record<Locale, typeof cs> = {
  cs,
  en,
};

/**
 * Get translation by key path
 * Supports nested keys like "home.heroTitle"
 */
export function getTranslation(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = messages[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to key if not found
      return key;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters like {{count}}
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, param) => {
      return params[param]?.toString() ?? `{{${param}}}`;
    });
  }

  return value;
}

/**
 * Create a translation function for a specific locale
 */
export function createT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) => getTranslation(locale, key, params);
}

/**
 * Get locale from cookie or default
 */
export function getLocaleFromCookie(cookieValue?: string): Locale {
  if (cookieValue && locales.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }
  return defaultLocale;
}
