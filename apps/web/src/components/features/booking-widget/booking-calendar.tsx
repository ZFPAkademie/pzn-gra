'use client';

import { useState, useEffect } from 'react';

interface Props {
  apartmentSlug: string;
  selectedCheckIn: string | null;
  selectedCheckOut: string | null;
  onSelectDates: (checkIn: string, checkOut: string | null) => void;
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('cs-CZ', {
    month: 'long',
    year: 'numeric',
  });
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function addMonths(year: number, month: number, delta: number) {
  let m = month + delta;
  let y = year;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  return { year: y, month: m };
}

export function BookingCalendar({ apartmentSlug, selectedCheckIn, selectedCheckOut, onSelectDates }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [blockedCache, setBlockedCache] = useState<Record<string, Set<string>>>({});
  const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set());
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const second = addMonths(currentYear, currentMonth, 1);

  async function fetchMonth(year: number, month: number) {
    const key = `${year}-${month}`;
    if (blockedCache[key] || loadingMonths.has(key)) return;

    setLoadingMonths((prev) => new Set(prev).add(key));
    try {
      const res = await fetch(
        `/api/v1/apartments/${apartmentSlug}/availability?year=${year}&month=${month}`
      );
      if (!res.ok) return;
      const json = await res.json();
      const blocked: string[] = json.blockedDates ?? [];
      setBlockedCache((prev) => ({
        ...prev,
        [key]: new Set(blocked),
      }));
    } catch {
      // soft fail
    } finally {
      setLoadingMonths((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  useEffect(() => {
    fetchMonth(currentYear, currentMonth);
    fetchMonth(second.year, second.month);
  }, [currentYear, currentMonth]);

  function isBlocked(dateStr: string): boolean {
    const [y, m] = dateStr.split('-').map(Number);
    const key = `${y}-${m}`;
    return blockedCache[key]?.has(dateStr) ?? false;
  }

  function isPast(dateStr: string): boolean {
    return dateStr < todayStr;
  }

  function isDisabled(dateStr: string): boolean {
    return isPast(dateStr) || isBlocked(dateStr);
  }

  function isInRange(dateStr: string): boolean {
    if (!selectedCheckIn) return false;
    const end = selectedCheckOut ?? hoverDate;
    if (!end) return false;
    return dateStr > selectedCheckIn && dateStr < end;
  }

  function isStart(dateStr: string): boolean {
    return dateStr === selectedCheckIn;
  }

  function isEnd(dateStr: string): boolean {
    return !!selectedCheckOut && dateStr === selectedCheckOut;
  }

  function handleDayClick(dateStr: string) {
    if (isDisabled(dateStr)) return;

    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      onSelectDates(dateStr, null);
      return;
    }

    if (dateStr <= selectedCheckIn) {
      onSelectDates(dateStr, null);
      return;
    }

    onSelectDates(selectedCheckIn, dateStr);
  }

  function prevMonth() {
    const prev = addMonths(currentYear, currentMonth, -1);
    if (prev.year < today.getFullYear() || (prev.year === today.getFullYear() && prev.month < today.getMonth() + 1)) return;
    setCurrentYear(prev.year);
    setCurrentMonth(prev.month);
  }

  function nextMonth() {
    const next = addMonths(currentYear, currentMonth, 1);
    setCurrentYear(next.year);
    setCurrentMonth(next.month);
  }

  const canGoPrev = !(currentYear === today.getFullYear() && currentMonth <= today.getMonth() + 1);

  function renderMonth(year: number, month: number) {
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);

    const cells: (string | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => isoDate(year, month, i + 1)),
    ];

    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-7 gap-px text-center mb-3">
          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d) => (
            <div key={d} className="text-xs text-navy/30 uppercase tracking-wider py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {cells.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} />;
            }

            const disabled = isDisabled(dateStr);
            const start = isStart(dateStr);
            const end = isEnd(dateStr);
            const inRange = isInRange(dateStr);
            const day = parseInt(dateStr.slice(8), 10);

            let cellClass =
              'relative h-10 flex items-center justify-center text-sm select-none transition-colors ';

            if (disabled) {
              cellClass += 'text-navy/20 cursor-not-allowed line-through';
            } else if (start || end) {
              cellClass += 'bg-[#0B1626] text-white cursor-pointer';
            } else if (inRange) {
              cellClass += 'bg-[#C9A24D]/20 text-navy cursor-pointer hover:bg-[#C9A24D]/30';
            } else {
              cellClass += 'text-navy cursor-pointer hover:bg-[#0B1626]/5';
            }

            return (
              <div
                key={dateStr}
                className={cellClass}
                onClick={() => handleDayClick(dateStr)}
                onMouseEnter={() => {
                  if (selectedCheckIn && !selectedCheckOut) setHoverDate(dateStr);
                }}
                onMouseLeave={() => setHoverDate(null)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#0B1626]/10 rounded-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-2 hover:bg-stone rounded-sm disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Předchozí měsíc"
        >
          <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex gap-12 flex-1 justify-center">
          <span className="text-sm font-light text-navy uppercase tracking-widest">
            {formatMonthYear(currentYear, currentMonth)}
          </span>
          <span className="hidden md:block text-sm font-light text-navy uppercase tracking-widest">
            {formatMonthYear(second.year, second.month)}
          </span>
        </div>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-stone rounded-sm transition-colors"
          aria-label="Další měsíc"
        >
          <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div className="flex gap-8">
        {renderMonth(currentYear, currentMonth)}
        <div className="hidden md:block w-px bg-navy/10 self-stretch" />
        <div className="hidden md:flex flex-1 min-w-0">
          {renderMonth(second.year, second.month)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-navy/40">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 bg-[#0B1626] inline-block" />
          Váš termín
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 bg-[#C9A24D]/20 inline-block" />
          Rozsah
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 bg-navy/5 inline-block line-through text-center" />
          Obsazeno
        </span>
      </div>
    </div>
  );
}
