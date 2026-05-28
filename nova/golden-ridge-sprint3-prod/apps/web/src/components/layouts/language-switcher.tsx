'use client';

/**
 * Language Switcher Component
 * Sprint 1: CZ/EN toggle per SPRINT_1_PLAN.md §5.1
 */

import { useLanguage } from '@/components/providers/language-provider';
import { locales, localeNames, Locale } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center space-x-1 text-sm">
      {locales.map((loc, index) => (
        <span key={loc} className="flex items-center">
          {index > 0 && <span className="text-stone-400 mx-1">|</span>}
          <button
            onClick={() => setLocale(loc)}
            className={`
              px-1 py-0.5 rounded transition-colors
              ${locale === loc 
                ? 'font-semibold text-navy' 
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
            aria-label={`Switch to ${localeNames[loc]}`}
          >
            {loc.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

/**
 * Compact version for footer
 */
export function LanguageSwitcherCompact() {
  const { locale, setLocale } = useLanguage();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="text-sm bg-transparent border border-slate-600 rounded px-2 py-1 text-stone-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
      aria-label="Select language"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc} className="bg-slate-800 text-white">
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
