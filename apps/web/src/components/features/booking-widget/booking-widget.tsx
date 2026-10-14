'use client';

import { useEffect, useRef, useState } from 'react';
import { BookingCalendar } from './booking-calendar';
import { BookingPriceSummary } from './booking-price-summary';
import { BookingForm } from './booking-form';
import { useLanguage } from '@/components/providers/language-provider';
import type { Locale } from '@/lib/i18n';

type Step = 'calendar' | 'form';

const MIN_NIGHTS = 2;

interface Props {
  apartmentId: string;
  apartmentSlug: string;
  maxGuests: number;
  basePricePerNight: number;
  /** Měna ceny „od“ — CZK (lokální ceník) nebo EUR (Front Desk Master) */
  currency?: 'CZK' | 'EUR';
}

/** Polské množné číslo: 1 / 2–4 (mimo 12–14) / ostatní */
function plPlural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
}

const NUM_LOCALE: Record<Locale, string> = { cs: 'cs-CZ', en: 'en-GB', pl: 'pl-PL' };

const TEXTS = {
  cs: {
    minStay: (n: number) => `Minimální pobyt jsou ${n} noci.`,
    rentFrom: 'Pronájem od',
    perNight: 'noc',
    seasonal: 'Ceny se mohou lišit dle sezóny',
    pickArrival: 'Vyberte datum příjezdu',
    arrival: 'Příjezd',
    pickDeparture: 'vyberte odjezd',
    cancel: 'Zrušit',
    book: 'Rezervovat',
    dates: 'Termín',
    nights: (_n: number) => 'nocí',
    change: 'Změnit',
  },
  en: {
    minStay: (n: number) => `The minimum stay is ${n} nights.`,
    rentFrom: 'Rates from',
    perNight: 'night',
    seasonal: 'Prices may vary by season',
    pickArrival: 'Select your arrival date',
    arrival: 'Arrival',
    pickDeparture: 'select your departure',
    cancel: 'Cancel',
    book: 'Book',
    dates: 'Dates',
    nights: (n: number) => (n === 1 ? 'night' : 'nights'),
    change: 'Change',
  },
  pl: {
    minStay: (n: number) => `Minimalny pobyt to ${n} ${plPlural(n, 'noc', 'noce', 'nocy')}.`,
    rentFrom: 'Wynajem od',
    perNight: 'noc',
    seasonal: 'Ceny mogą się różnić w zależności od sezonu',
    pickArrival: 'Wybierz datę przyjazdu',
    arrival: 'Przyjazd',
    pickDeparture: 'wybierz datę wyjazdu',
    cancel: 'Anuluj',
    book: 'Zarezerwuj',
    dates: 'Termin',
    nights: (n: number) => plPlural(n, 'noc', 'noce', 'nocy'),
    change: 'Zmień',
  },
};

function fmtDate(d: string, locale: Locale = 'cs') {
  return new Date(d + 'T12:00:00').toLocaleDateString(NUM_LOCALE[locale], { day: 'numeric', month: 'short' });
}
function nights(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function BookingWidget({ apartmentId, apartmentSlug, maxGuests, basePricePerNight, currency = 'CZK' }: Props) {
  const [step, setStep]         = useState<Step>('calendar');
  const [checkIn, setCheckIn]   = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const { locale } = useLanguage();
  const t = TEXTS[locale];

  // Po přepnutí kalendář ↔ formulář vrátit pohled na začátek widgetu,
  // jinak na mobilu host zůstane uprostřed formuláře (kalendář je vyšší).
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const el = rootRef.current;
    if (el && el.getBoundingClientRect().top < 80) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  function handleDates(ci: string, co: string | null) {
    setCheckIn(ci); setCheckOut(co); setError(null);
    if (ci && co) {
      const n = nights(ci, co);
      if (n < MIN_NIGHTS) setError(t.minStay(MIN_NIGHTS));
    }
  }

  function handleSuccess(_id: string, token: string) {
    window.location.href = `/rezervace/${token}`;
  }

  function reset() { setCheckIn(null); setCheckOut(null); setError(null); setStep('calendar'); }

  const hasRange  = checkIn && checkOut;
  const validRange = hasRange && nights(checkIn!, checkOut!) >= MIN_NIGHTS;

  return (
    /* sticky container */
    <div ref={rootRef} className="lg:sticky lg:top-24 scroll-mt-24 space-y-0">

      {/* ── Price strip ── */}
      <div className="bg-[#0B1626] px-6 py-5">
        <p className="text-[#C9A24D] text-[10px] tracking-[0.18em] uppercase mb-2">{t.rentFrom}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[2.2rem] font-light text-white leading-none">
            {basePricePerNight.toLocaleString(NUM_LOCALE[locale])}
          </span>
          <span className="text-white/40 text-sm">{currency === 'EUR' ? '€' : locale === 'pl' ? 'CZK' : 'Kč'} / {t.perNight}</span>
        </div>
        <p className="text-white/25 text-[11px] mt-1.5">{t.seasonal}</p>
      </div>

      {/* ── Calendar / Form ── */}
      <div className="bg-white border border-[#0B1626]/8 border-t-0">

        {step === 'calendar' && (
          <div className="p-5">
            <BookingCalendar
              apartmentSlug={apartmentSlug}
              selectedCheckIn={checkIn}
              selectedCheckOut={checkOut}
              onSelectDates={handleDates}
            />

            {/* Status line */}
            <div className="mt-4 min-h-[20px]">
              {!checkIn && (
                <p className="text-[11px] text-[#0B1626]/35 text-center tracking-wide">
                  {t.pickArrival}
                </p>
              )}
              {checkIn && !checkOut && (
                <p className="text-[11px] text-[#0B1626]/50 text-center">
                  {t.arrival} <span className="text-[#0B1626] font-medium">{fmtDate(checkIn, locale)}</span> — {t.pickDeparture}
                </p>
              )}
              {error && (
                <p className="text-[11px] text-red-500 text-center">{error}</p>
              )}
            </div>

            {/* CTA */}
            {validRange && !error && (
              <div className="mt-4 space-y-3">
                <BookingPriceSummary
                  apartmentSlug={apartmentSlug}
                  checkIn={checkIn!}
                  checkOut={checkOut!}
                />
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-none px-4 py-3 text-[11px] uppercase tracking-widest text-[#0B1626]/50 border border-[#0B1626]/15 hover:border-[#0B1626]/30 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 py-3 bg-[#C9A24D] text-[#0B1626] text-[11px] uppercase tracking-widest font-medium hover:bg-[#b8913c] transition-colors"
                  >
                    {t.book}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'form' && checkIn && checkOut && (
          <div className="p-5">
            {/* Selected dates bar */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#0B1626]/8">
              <div>
                <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">{t.dates}</p>
                <p className="text-sm text-[#0B1626] font-medium">
                  {fmtDate(checkIn, locale)} → {fmtDate(checkOut, locale)}
                  <span className="text-[#0B1626]/40 font-normal ml-2">
                    {nights(checkIn, checkOut)} {t.nights(nights(checkIn, checkOut))}
                  </span>
                </p>
              </div>
              <button onClick={() => setStep('calendar')}
                className="text-[11px] text-[#0B1626]/40 hover:text-[#0B1626] underline underline-offset-2 transition-colors">
                {t.change}
              </button>
            </div>

            <BookingForm
              apartmentId={apartmentId}
              apartmentSlug={apartmentSlug}
              maxGuests={maxGuests}
              checkIn={checkIn}
              checkOut={checkOut}
              onSuccess={handleSuccess}
              onError={(msg) => { setError(msg); setStep('calendar'); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
