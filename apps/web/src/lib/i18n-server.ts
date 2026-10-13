/**
 * Jazyk aktuálního požadavku — jen pro server (server components, route handlers, generateMetadata)
 */

import { cookies } from 'next/headers';
import { getLocaleFromCookie, toBaseLocale, type BaseLocale, type Locale } from './i18n';

/** cs | en — stránky bez polské verze (polský návštěvník dostane angličtinu) */
export function getRequestLocale(): BaseLocale {
  return toBaseLocale(getRequestLocaleFull());
}

/** cs | en | pl — pronájem a rezervační proces */
export function getRequestLocaleFull(): Locale {
  return getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value);
}
