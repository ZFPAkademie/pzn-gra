'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/components/providers/language-provider';
import {
  addDays,
  formatStayDate,
  formatStayRange,
  MIN_STAY_NIGHTS,
  nightsBetween,
  nightsLabel,
  SEARCH_HORIZON_DAYS,
  todayPrague,
} from '@/lib/booking-engine/dates';

interface Props {
  checkIn: string | null;
  checkOut: string | null;
  /** Dny bez jediného volného apartmánu */
  soldOut: Set<string>;
  pending: boolean;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const DAYS = {
  cs: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  pl: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
};
const MONTHS = {
  cs: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pl: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
};

const TEXTS = {
  cs: {
    whenArrive: 'Kdy přijedete?',
    whenLeave: 'Kdy odjedete?',
    yourStay: 'Váš termín',
    pickArrival: 'Vyberte den příjezdu',
    pickDeparture: (min: number) => `Vyberte den odjezdu, minimální pobyt jsou ${min} noci`,
    arrival: 'Příjezd',
    departure: 'Odjezd',
    prev: 'Předchozí měsíc',
    next: 'Další měsíc',
    close: 'Zavřít',
    clear: 'Smazat',
    soldOut: 'vše obsazeno',
    show: 'Zobrazit volné apartmány',
    searching: 'Hledám…',
  },
  en: {
    whenArrive: 'When will you arrive?',
    whenLeave: 'When will you leave?',
    yourStay: 'Your dates',
    pickArrival: 'Select your arrival date',
    pickDeparture: (min: number) => `Select your departure date, the minimum stay is ${min} nights`,
    arrival: 'Arrival',
    departure: 'Departure',
    prev: 'Previous month',
    next: 'Next month',
    close: 'Close',
    clear: 'Clear',
    soldOut: 'fully booked',
    show: 'Show available apartments',
    searching: 'Searching…',
  },
  pl: {
    whenArrive: 'Kiedy przyjadą Państwo?',
    whenLeave: 'Kiedy wyjadą Państwo?',
    yourStay: 'Państwa termin',
    pickArrival: 'Wybierz datę przyjazdu',
    pickDeparture: (min: number) => `Wybierz datę wyjazdu, minimalny pobyt to ${min} noce`,
    arrival: 'Przyjazd',
    departure: 'Wyjazd',
    prev: 'Poprzedni miesiąc',
    next: 'Następny miesiąc',
    close: 'Zamknij',
    clear: 'Wyczyść',
    soldOut: 'brak miejsc',
    show: 'Pokaż wolne apartamenty',
    searching: 'Szukam…',
  },
};

function monthAfter({ year, month }: { year: number; month: number }, n: number) {
  const date = new Date(Date.UTC(year, month - 1 + n, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function monthOf(date: string) {
  const [year, month] = date.split('-').map(Number);
  return { year, month };
}

function lastDayMinus(date: string, days: number) {
  const { year, month } = monthOf(date);
  return addDays(new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10), -days);
}

function monthCells(year: number, month: number): (string | null)[] {
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const days = Array.from({ length: total }, (_, i) => prefix + String(i + 1).padStart(2, '0'));
  return [...Array<null>(offset).fill(null), ...days];
}

export function DateRangeModal({ checkIn, checkOut, soldOut, pending, onChange, onClose, onConfirm }: Props) {
  const { locale } = useLanguage();
  const t = TEXTS[locale];
  const today = todayPrague();
  const lastDate = addDays(today, SEARCH_HORIZON_DAYS);
  const firstMonth = monthOf(today);
  const lastMonth = monthOf(lastDate);

  const [view, setView] = useState(() => {
    if (checkIn) return monthOf(checkIn);
    // Mobil ukazuje jeden měsíc: na jeho konci by host viděl jen pár dnů, které jdou vybrat
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    return narrow && today >= lastDayMinus(today, 7) ? monthAfter(monthOf(today), 1) : monthOf(today);
  });
  const [hover, setHover] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const picking = !!checkIn && !checkOut;
  // Odjet se dá i v den, kdy je vše obsazeno (ráno je volno), ale dál už pobyt nepokračuje
  const lastCheckOut = useMemo(() => {
    if (!picking) return null;
    for (let d = checkIn!; d < lastDate; d = addDays(d, 1)) {
      if (soldOut.has(d)) return d;
    }
    return lastDate;
  }, [picking, checkIn, lastDate, soldOut]);

  const canArrive = (d: string) => d >= today && d < lastDate && !soldOut.has(d);
  const canDepart = (d: string) =>
    picking && d <= lastCheckOut! && nightsBetween(checkIn!, d) >= MIN_STAY_NIGHTS;
  const isTooShort = (d: string) => picking && d > checkIn! && nightsBetween(checkIn!, d) < MIN_STAY_NIGHTS;
  const isEnabled = (d: string) => canDepart(d) || (canArrive(d) && !isTooShort(d));

  const rangeEnd = checkOut ?? (hover && canDepart(hover) ? hover : null);

  function pick(d: string) {
    if (canDepart(d)) onChange(checkIn, d);
    else if (isEnabled(d)) onChange(d, null);
  }

  useEffect(() => {
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      // Fokus zůstává v dialogu
      const items = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canGoBack = view.year > firstMonth.year || (view.year === firstMonth.year && view.month > firstMonth.month);
  const canGoForward = view.year < lastMonth.year || (view.year === lastMonth.year && view.month < lastMonth.month);
  const hasRange = !!checkIn && !!checkOut;

  function renderMonth({ year, month }: { year: number; month: number }) {
    return (
      <div>
        <p className="text-center text-sm tracking-wide text-white mb-3">
          {MONTHS[locale][month - 1]} {year}
        </p>
        <div className="grid grid-cols-7 mb-1">
          {DAYS[locale].map((d) => (
            <div key={d} className="text-center text-[11px] tracking-wider text-white/35 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {monthCells(year, month).map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const enabled = isEnabled(d);
            const isEdge = d === checkIn || d === checkOut;
            const inRange = !!checkIn && !!rangeEnd && d > checkIn && d < rangeEnd;
            const full = soldOut.has(d) && d >= today;
            return (
              <button
                key={d}
                type="button"
                disabled={!enabled}
                onClick={() => pick(d)}
                onMouseEnter={() => setHover(d)}
                onMouseLeave={() => setHover(null)}
                aria-pressed={isEdge}
                aria-label={`${formatStayDate(d, locale, true)}${full ? `, ${t.soldOut}` : ''}`}
                className={`relative h-11 text-sm transition-colors duration-150 ${
                  isEdge
                    ? 'bg-gold text-navy'
                    : inRange
                      ? 'bg-gold/25 text-white'
                      : enabled
                        ? 'text-white hover:bg-white/10'
                        : full
                          ? 'text-white/25 line-through cursor-not-allowed'
                          : 'text-white/15 cursor-not-allowed'
                }`}
              >
                {Number(d.slice(8))}
                {d === today && !isEdge && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const title = hasRange ? t.yourStay : picking ? t.whenLeave : t.whenArrive;
  const subtitle = hasRange
    ? `${formatStayRange(checkIn!, checkOut!, locale)} · ${nightsBetween(checkIn!, checkOut!)} ${nightsLabel(nightsBetween(checkIn!, checkOut!), locale)}`
    : picking
      ? t.pickDeparture(MIN_STAY_NIGHTS)
      : t.pickArrival;

  const steps = [
    { label: t.arrival, date: checkIn, active: !checkIn },
    { label: t.departure, date: checkOut, active: picking },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-md md:max-w-3xl max-h-[92vh] max-h-[92dvh] flex flex-col bg-[#0F1C30] border-t sm:border border-gold/30 shadow-2xl"
      >
        <div className="overflow-y-auto overscroll-contain px-4 sm:px-8 pt-5 sm:pt-7 pb-4">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <h2 className="text-2xl font-light text-white tracking-wide">{title}</h2>
              <p className="text-sm text-white/50 mt-1">{subtitle}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="shrink-0 w-11 h-11 -mt-1 -mr-1 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 mb-5 text-xs">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                {i > 0 && <span className="text-white/25">→</span>}
                <span className={`flex items-center gap-2 ${step.date || step.active ? 'text-white' : 'text-white/35'}`}>
                  <span
                    className={`w-5 h-5 flex items-center justify-center text-[11px] border ${
                      step.date ? 'bg-gold border-gold text-navy' : step.active ? 'border-gold text-gold' : 'border-white/20'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {step.date ? formatStayDate(step.date, locale) : step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setView(monthAfter(view, -1))}
              disabled={!canGoBack}
              aria-label={t.prev}
              className="absolute left-0 -top-2.5 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setView(monthAfter(view, 1))}
              disabled={!canGoForward}
              aria-label={t.next}
              className="absolute right-0 -top-2.5 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="grid md:grid-cols-2 gap-8 md:gap-10">
              {renderMonth(view)}
              <div className="hidden md:block">{renderMonth(monthAfter(view, 1))}</div>
            </div>
          </div>

          {soldOut.size > 0 && (
            <p className="flex items-center gap-2 mt-4 text-xs text-white/40">
              <span className="line-through">15</span>
              {t.soldOut}
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/10">
          {checkIn && (
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="shrink-0 min-h-[48px] px-3 text-xs tracking-widest uppercase text-white/50 hover:text-white transition-colors"
            >
              {t.clear}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={!hasRange || pending}
            className="flex-1 min-h-[48px] px-3 bg-gold text-navy text-xs sm:text-sm tracking-[0.06em] sm:tracking-[0.15em] uppercase hover:bg-white disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {pending ? t.searching : t.show}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
