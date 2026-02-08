/**
 * Localization Index
 * Centralized access to all translation namespaces
 */

// Czech translations
import bookingCs from './cs/booking.json';
import calendarCs from './cs/calendar.json';
import tokenCs from './cs/token.json';
import emailCs from './cs/email.json';

// English translations
import bookingEn from './en/booking.json';
import calendarEn from './en/calendar.json';
import tokenEn from './en/token.json';
import emailEn from './en/email.json';

export const locales = {
  cs: {
    booking: bookingCs,
    calendar: calendarCs,
    token: tokenCs,
    email: emailCs,
  },
  en: {
    booking: bookingEn,
    calendar: calendarEn,
    token: tokenEn,
    email: emailEn,
  },
} as const;

export type Locale = keyof typeof locales;
export type Namespace = keyof typeof locales.cs;

/**
 * Get translations for a specific locale and namespace
 */
export function getTranslations<N extends Namespace>(
  locale: Locale,
  namespace: N
): typeof locales.cs[N] {
  return locales[locale]?.[namespace] || locales.cs[namespace];
}

/**
 * Simple translation helper
 * Supports {{variable}} interpolation
 */
export function t(
  translations: Record<string, any>,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation missing: ${key}`);
    return key;
  }
  
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => 
      String(params[name] ?? `{{${name}}}`)
    );
  }
  
  return value;
}

export default locales;
