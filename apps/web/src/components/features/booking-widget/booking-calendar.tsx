'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  apartmentSlug: string;
  selectedCheckIn: string | null;
  selectedCheckOut: string | null;
  onSelectDates: (checkIn: string, checkOut: string | null) => void;
}

const DAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Monday = 0
function firstDayOfWeek(year: number, month: number): number {
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

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function BookingCalendar({
  apartmentSlug,
  selectedCheckIn,
  selectedCheckOut,
  onSelectDates,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [leftYear, setLeftYear] = useState(today.getFullYear());
  const [leftMonth, setLeftMonth] = useState(today.getMonth() + 1);
  const [blockedCache, setBlockedCache] = useState<Record<string, Set<string>>>({});
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const right = addMonths(leftYear, leftMonth, 1);

  const fetchMonth = useCallback(async (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (blockedCache[key]) return;
    try {
      const res = await fetch(
        `/api/v1/apartments/${apartmentSlug}/availability?year=${year}&month=${month}`
      );
      if (!res.ok) return;
      const json = await res.json();
      setBlockedCache((prev) => ({
        ...prev,
        [key]: new Set<string>(json.blockedDates ?? []),
      }));
    } catch { /* soft fail */ }
  }, [apartmentSlug, blockedCache]);

  useEffect(() => {
    fetchMonth(leftYear, leftMonth);
    fetchMonth(right.year, right.month);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftYear, leftMonth]);

  function isBlocked(d: string) {
    const [y, m] = d.split('-').map(Number);
    return blockedCache[`${y}-${m}`]?.has(d) ?? false;
  }

  function isDisabled(d: string) {
    return d < todayStr || isBlocked(d);
  }

  function effectiveEnd() {
    return selectedCheckOut ?? hoverDate;
  }

  function isStart(d: string) { return d === selectedCheckIn; }
  function isEnd(d: string) { return !!selectedCheckOut && d === selectedCheckOut; }
  function isInRange(d: string) {
    const end = effectiveEnd();
    if (!selectedCheckIn || !end) return false;
    const [a, b] = selectedCheckIn < end
      ? [selectedCheckIn, end]
      : [end, selectedCheckIn];
    return d > a && d < b;
  }
  function isToday(d: string) { return d === todayStr; }

  function handleClick(d: string) {
    if (isDisabled(d)) return;
    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      onSelectDates(d, null);
    } else if (d === selectedCheckIn) {
      onSelectDates(d, null);
    } else if (d < selectedCheckIn) {
      onSelectDates(d, null);
    } else {
      onSelectDates(selectedCheckIn, d);
    }
  }

  function goBack() {
    const prev = addMonths(leftYear, leftMonth, -1);
    if (prev.year < today.getFullYear() || (prev.year === today.getFullYear() && prev.month < today.getMonth() + 1)) return;
    setLeftYear(prev.year);
    setLeftMonth(prev.month);
  }

  function goForward() {
    const next = addMonths(leftYear, leftMonth, 1);
    setLeftYear(next.year);
    setLeftMonth(next.month);
  }

  const canGoBack = !(leftYear === today.getFullYear() && leftMonth <= today.getMonth() + 1);

  function renderMonth(year: number, month: number, side: 'left' | 'right') {
    const total = daysInMonth(year, month);
    const offset = firstDayOfWeek(year, month);

    const cells: (string | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: total }, (_, i) => isoDate(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return (
      <div className={side === 'right' ? 'hidden md:block flex-1' : 'flex-1'}>
        {/* Month header */}
        <p className="text-center text-xs font-medium text-[#0B1626] uppercase tracking-[0.15em] mb-4">
          {monthLabel(year, month)}
        </p>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-[#0B1626]/30 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="space-y-0.5">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((dateStr, ci) => {
                if (!dateStr) return <div key={`e-${ci}`} />;

                const disabled = isDisabled(dateStr);
                const start = isStart(dateStr);
                const end = isEnd(dateStr);
                const inRange = isInRange(dateStr);
                const isHoverEnd = dateStr === hoverDate && !!selectedCheckIn && !selectedCheckOut;
                const today_ = isToday(dateStr);

                // Range background logic
                const isRangeDay = inRange || (isHoverEnd && !disabled);
                const isFirstInRow = ci === 0;
                const isLastInRow = ci === 6;

                return (
                  <div
                    key={dateStr}
                    className="relative h-9 flex items-center justify-center"
                    onClick={() => handleClick(dateStr)}
                    onMouseEnter={() => { if (selectedCheckIn && !selectedCheckOut) setHoverDate(dateStr); }}
                    onMouseLeave={() => setHoverDate(null)}
                  >
                    {/* Range background strip */}
                    {isRangeDay && (
                      <div className={`absolute inset-y-0.5 bg-[#C9A24D]/12 ${
                        isFirstInRow ? 'left-0 rounded-l-full' : 'left-0'
                      } ${
                        isLastInRow ? 'right-0 rounded-r-full' : 'right-0'
                      }`} />
                    )}

                    {/* Start: right half range bg */}
                    {start && effectiveEnd() && effectiveEnd()! > dateStr && (
                      <div className="absolute inset-y-0.5 left-1/2 right-0 bg-[#C9A24D]/12" />
                    )}

                    {/* End: left half range bg */}
                    {end && selectedCheckIn! < dateStr && (
                      <div className="absolute inset-y-0.5 left-0 right-1/2 bg-[#C9A24D]/12" />
                    )}

                    {/* Day circle */}
                    <div
                      className={`
                        relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all
                        ${disabled
                          ? 'text-[#0B1626]/20 cursor-not-allowed'
                          : start || end
                          ? 'bg-[#0B1626] text-white cursor-pointer font-medium shadow-sm'
                          : isHoverEnd && !disabled
                          ? 'bg-[#0B1626]/80 text-white cursor-pointer'
                          : 'text-[#0B1626] cursor-pointer hover:bg-[#0B1626]/8'
                        }
                      `}
                    >
                      {parseInt(dateStr.slice(8), 10)}
                      {today_ && !start && !end && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C9A24D]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#0B1626]/10 select-none">
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#0B1626]/6">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          aria-label="Předchozí měsíc"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#0B1626]/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 text-[#0B1626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Month titles — desktop shows both, mobile shows left only */}
        <div className="flex flex-1 justify-around px-2">
          <span className="text-xs font-medium text-[#0B1626] uppercase tracking-[0.15em] md:hidden">
            {monthLabel(leftYear, leftMonth)}
          </span>
          {/* Desktop titles are inside each column */}
        </div>

        <button
          onClick={goForward}
          aria-label="Další měsíc"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#0B1626]/5 transition-colors"
        >
          <svg className="w-4 h-4 text-[#0B1626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Months */}
      <div className="flex gap-6 px-4 pt-4 pb-4">
        {renderMonth(leftYear, leftMonth, 'left')}
        <div className="hidden md:block w-px bg-[#0B1626]/6 self-stretch mx-2" />
        {renderMonth(right.year, right.month, 'right')}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-4 pb-4 border-t border-[#0B1626]/6 pt-3">
        <span className="flex items-center gap-2 text-[10px] text-[#0B1626]/40 uppercase tracking-wider">
          <span className="w-5 h-5 rounded-full bg-[#0B1626] inline-block" />
          Příjezd / Odjezd
        </span>
        <span className="flex items-center gap-2 text-[10px] text-[#0B1626]/40 uppercase tracking-wider">
          <span className="w-5 h-2 rounded-sm bg-[#C9A24D]/25 inline-block" />
          Pobyt
        </span>
        <span className="flex items-center gap-2 text-[10px] text-[#0B1626]/40 uppercase tracking-wider">
          <span className="w-5 h-5 rounded-full bg-[#0B1626]/8 inline-block" />
          Obsazeno
        </span>
      </div>
    </div>
  );
}
