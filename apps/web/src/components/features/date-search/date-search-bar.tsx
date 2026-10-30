'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';
import { formatStayRange, nightsBetween, nightsLabel, formatStayDate } from '@/lib/booking-engine/dates';
import { DateRangeModal } from './date-range-modal';

interface Props {
  /** Předvyplněný termín (stránka výsledků) */
  initialCheckIn?: string;
  initialCheckOut?: string;
}

const TEXTS = {
  cs: { label: 'Termín pobytu', placeholder: 'Příjezd → Odjezd', pickDeparture: 'vyberte odjezd', search: 'Hledat volné apartmány', searching: 'Hledám…' },
  en: { label: 'Your stay', placeholder: 'Arrival → Departure', pickDeparture: 'select departure', search: 'Find available apartments', searching: 'Searching…' },
  pl: { label: 'Termin pobytu', placeholder: 'Przyjazd → Wyjazd', pickDeparture: 'wybierz wyjazd', search: 'Szukaj wolnych apartamentów', searching: 'Szukam…' },
};

/** Výběr termínu napříč apartmány: panel + vyskakovací kalendář → /volne-terminy */
export function DateSearchBar({ initialCheckIn, initialCheckOut }: Props) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = TEXTS[locale];

  const [checkIn, setCheckIn] = useState<string | null>(initialCheckIn ?? null);
  const [checkOut, setCheckOut] = useState<string | null>(initialCheckOut ?? null);
  const [open, setOpen] = useState(false);
  const [soldOut, setSoldOut] = useState<Set<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const soldOutLoaded = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function loadSoldOut() {
    if (soldOutLoaded.current) return;
    soldOutLoaded.current = true;
    fetch('/api/v1/availability')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json?.soldOutDays) setSoldOut(new Set<string>(json.soldOutDays)); })
      .catch(() => { soldOutLoaded.current = false; });
  }

  function openCalendar() {
    loadSoldOut();
    setOpen(true);
  }

  function closeCalendar() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function search() {
    if (!checkIn || !checkOut) { openCalendar(); return; }
    setOpen(false);
    startTransition(() => router.push(`/volne-terminy?od=${checkIn}&do=${checkOut}`));
  }

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  // Na stránce výsledků by tlačítko na mobilu jen odsouvalo výsledky, termín se mění v kalendáři
  const alreadySearched = !!initialCheckIn && checkIn === initialCheckIn && checkOut === initialCheckOut;

  return (
    <>
      <div className="w-full max-w-3xl flex flex-col sm:flex-row text-left bg-navy/80 backdrop-blur-md border border-gold/30">
        <button
          ref={triggerRef}
          type="button"
          onClick={openCalendar}
          onPointerEnter={loadSoldOut}
          onFocus={loadSoldOut}
          aria-haspopup="dialog"
          className="flex-1 min-w-0 flex items-center gap-4 px-5 py-3.5 min-h-[68px] text-left hover:bg-white/5 transition-colors"
        >
          <svg className="w-5 h-5 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] tracking-[0.2em] uppercase text-gold mb-0.5">{t.label}</span>
            <span className={`block text-base font-light truncate ${checkIn ? 'text-white' : 'text-white/70'}`}>
              {checkIn && checkOut
                ? formatStayRange(checkIn, checkOut, locale)
                : checkIn
                  ? `${formatStayDate(checkIn, locale)} → ${t.pickDeparture}`
                  : t.placeholder}
            </span>
          </span>
          {nights > 0 && (
            <span className="shrink-0 text-xs text-white/60">{nights} {nightsLabel(nights, locale)}</span>
          )}
        </button>
        <button
          type="button"
          onClick={search}
          disabled={pending}
          className={`${alreadySearched ? 'hidden sm:block' : ''} shrink-0 min-h-[52px] px-6 lg:px-8 bg-gold text-navy text-xs lg:text-sm tracking-[0.15em] uppercase hover:bg-white disabled:opacity-70 transition-colors duration-500`}
        >
          {pending ? t.searching : t.search}
        </button>
      </div>

      {open && (
        <DateRangeModal
          checkIn={checkIn}
          checkOut={checkOut}
          soldOut={soldOut}
          pending={pending}
          onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
          onClose={closeCalendar}
          onConfirm={search}
        />
      )}
    </>
  );
}
