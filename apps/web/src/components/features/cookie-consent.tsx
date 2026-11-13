'use client';

/**
 * Lišta souhlasu s cookies (vzor ZFP reality HUB, styl Alpine Quiet Luxury).
 *
 * Kategorie: technické (vždy) · analytické (Vibekodex Insight + Google Analytics 4).
 * Souhlas se ukládá do localStorage (STORAGE_KEY) s verzí a datem. Bez souhlasu
 * se nic volitelného nenačte — SiteAnalytics poslouchá CONSENT_CHANGED_EVENT.
 * Znovuotevření: CookieSettingsButton (patička, zásady ochrany osobních údajů).
 * Texty cs + en + pl (lišta běží i na pronájmu a rezervacích, DEC-034).
 */

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

const STORAGE_KEY = 'pzn-cookie-consent';
const CONSENT_VERSION = 1;
const OPEN_EVENT = 'pzn:open-cookie-settings';
/** Vyšle se po každém uložení souhlasu — měření se zapne/vypne bez reloadu. */
export const CONSENT_CHANGED_EVENT = 'pzn:cookie-consent-changed';

export interface CookieConsentValue {
  version: number;
  date: string;
  analytical: boolean;
}

/** Uložený souhlas (null = zatím nerozhodnuto). */
export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentValue;
    return parsed.version === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

/** Tlačítko „Nastavení cookies" — otevře lištu s detailem kategorií. */
export function CookieSettingsButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {children}
    </button>
  );
}

const TEXTS = {
  cs: {
    aria: 'Nastavení cookies',
    intro: 'Používáme cookies, aby web fungoval a abychom věděli, jak ho návštěvníci používají. Analytické nasadíme jen s vaším souhlasem.',
    more: 'Podrobnosti',
    technical: 'Technické (nezbytné)',
    technicalDesc: 'Jazyk webu, přihlášení a rezervace. Nelze vypnout.',
    analytical: 'Analytické',
    analyticalDesc: 'Souhrnná statistika návštěvnosti (vlastní měření a Google Analytics). Bez reklamy a bez prodeje dat.',
    acceptAll: 'Přijmout vše',
    reject: 'Jen nezbytné',
    settings: 'Nastavení',
    save: 'Uložit volbu',
  },
  en: {
    aria: 'Cookie settings',
    intro: 'We use cookies to make the website work and to understand how visitors use it. Analytics cookies are only set with your consent.',
    more: 'Details',
    technical: 'Technical (necessary)',
    technicalDesc: 'Website language, sign-in and bookings. Cannot be switched off.',
    analytical: 'Analytics',
    analyticalDesc: 'Aggregate visitor statistics (our own measurement and Google Analytics). No advertising, no selling of data.',
    acceptAll: 'Accept all',
    reject: 'Necessary only',
    settings: 'Settings',
    save: 'Save choice',
  },
  pl: {
    aria: 'Ustawienia plików cookie',
    intro: 'Używamy plików cookie, aby strona działała i abyśmy wiedzieli, jak odwiedzający z niej korzystają. Analityczne ustawiamy wyłącznie za Państwa zgodą.',
    more: 'Szczegóły',
    technical: 'Techniczne (niezbędne)',
    technicalDesc: 'Język strony, logowanie i rezerwacje. Nie można ich wyłączyć.',
    analytical: 'Analityczne',
    analyticalDesc: 'Zbiorcze statystyki odwiedzin (własny pomiar i Google Analytics). Bez reklam i bez sprzedaży danych.',
    acceptAll: 'Akceptuj wszystkie',
    reject: 'Tylko niezbędne',
    settings: 'Ustawienia',
    save: 'Zapisz wybór',
  },
};

export function CookieConsent() {
  const { locale } = useLanguage();
  const t = TEXTS[locale] ?? TEXTS.en;
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(false);
  const [analytical, setAnalytical] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
    const open = () => {
      setAnalytical(getCookieConsent()?.analytical === true);
      setDetail(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  if (!visible) return null;

  const save = (value: boolean) => {
    const full: CookieConsentValue = { version: CONSENT_VERSION, date: new Date().toISOString(), analytical: value };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    } catch {
      /* private mode — lišta se ukáže příště znovu */
    }
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setVisible(false);
    setDetail(false);
  };

  const btnPrimary =
    'inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-navy text-white text-xs tracking-widest uppercase hover:bg-navy-700 transition-colors';
  const btnSecondary =
    'inline-flex items-center justify-center min-h-[44px] px-6 py-3 border border-navy/20 text-navy text-xs tracking-widest uppercase hover:border-navy/50 transition-colors';

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4" role="dialog" aria-label={t.aria}>
      <div className="max-w-3xl mx-auto bg-cream border border-navy/10 shadow-xl p-5 sm:p-6">
        <p className="text-sm text-navy/70 leading-relaxed">
          {t.intro}{' '}
          <Link href="/ochrana-osobnich-udaju#cookies" className="text-navy underline underline-offset-2 hover:text-gold">
            {t.more}
          </Link>
        </p>

        {detail && (
          <div className="mt-4 space-y-2">
            <label className="flex items-start gap-3 border border-navy/10 bg-white p-3.5 opacity-70">
              <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4 accent-[#0B1626]" />
              <span>
                <span className="block text-sm text-navy">{t.technical}</span>
                <span className="block text-xs text-navy/60 mt-0.5">{t.technicalDesc}</span>
              </span>
            </label>
            <label className="flex items-start gap-3 border border-navy/10 bg-white p-3.5 cursor-pointer hover:border-gold/60">
              <input
                type="checkbox"
                checked={analytical}
                onChange={(e) => setAnalytical(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#0B1626]"
              />
              <span>
                <span className="block text-sm text-navy">{t.analytical}</span>
                <span className="block text-xs text-navy/60 mt-0.5">{t.analyticalDesc}</span>
              </span>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => save(true)} className={btnPrimary}>
            {t.acceptAll}
          </button>
          <button type="button" onClick={() => save(false)} className={btnSecondary}>
            {t.reject}
          </button>
          {detail ? (
            <button type="button" onClick={() => save(analytical)} className={btnSecondary}>
              {t.save}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDetail(true)}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 text-xs tracking-widest uppercase text-navy/60 hover:text-navy transition-colors"
            >
              {t.settings}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
