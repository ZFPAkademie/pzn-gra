'use client';

/**
 * Měření návštěvnosti veřejného webu — dvě vrstvy, obě JEN se souhlasem
 * s analytickými cookies (lišta CookieConsent, vzor ZFP reality HUB):
 *
 * 1. Vibekodex Insight (vk-analytics) — vlastní měření do Supabase,
 *    dashboard /admin/navstevnost (zdroje, stránky, konverze, AI crawleři).
 * 2. Google Analytics 4 — jen když je nastavené NEXT_PUBLIC_GA_ID.
 *    Consent Mode v2, skript se stáhne až po souhlasu.
 *
 * Odvolání souhlasu: vk se vypne (vk_optout), GA dostane consent denied
 * a jeho cookies se smažou. Plně se projeví od další stránky.
 */

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { VkTracker } from '@vk/VkTracker';
import { vk } from '@vk/tracker';
import { getCookieConsent, CONSENT_CHANGED_EVENT } from './cookie-consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function clearGaCookies() {
  const host = window.location.hostname;
  const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (!name.startsWith('_ga')) continue;
    for (const d of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? '; domain=' + d : ''}`;
    }
  }
}

export function SiteAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const apply = () => {
      const ok = getCookieConsent()?.analytical === true;
      try {
        if (ok) localStorage.removeItem('vk_optout');
        else localStorage.setItem('vk_optout', '1');
      } catch {
        /* private mode */
      }
      if (!ok && window.gtag) {
        window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        clearGaCookies();
      }
      if (ok && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
      setAllowed(ok);
    };
    apply();
    window.addEventListener(CONSENT_CHANGED_EVENT, apply);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, apply);
  }, []);

  if (!allowed) return null;

  return (
    <>
      <VkTracker />
      {GA_ID && (
        <>
          <Script id="ga-consent" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)},{anonymize_ip:true});`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="afterInteractive" />
        </>
      )}
    </>
  );
}

type Props = Record<string, string | number | boolean | null | undefined>;

/**
 * Konverze — jedno volání pro obě vrstvy. Bez souhlasu no-op (vk_optout, gtag nenačtený).
 * Volat až PO úspěšném odeslání. Do props nikdy osobní údaje.
 */
export function trackConversion(name: string, props: Props = {}) {
  const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean | null>;
  try {
    vk.track(name, clean);
  } catch {
    /* soft fail */
  }
  try {
    window.gtag?.('event', name, clean);
  } catch {
    /* soft fail */
  }
}
