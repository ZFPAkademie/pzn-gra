/**
 * Jazyk aktuálního požadavku — jen pro server (server components, route handlers, generateMetadata)
 */

import { cookies } from 'next/headers';
import { getLocaleFromCookie, type Locale } from './i18n';

export function getRequestLocale(): Locale {
  return getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value);
}
