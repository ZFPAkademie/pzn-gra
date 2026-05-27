'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  apartmentSlug: string;
  selectedCheckIn: string | null;
  selectedCheckOut: string | null;
  onSelectDates: (checkIn: string, checkOut: string | null) => void;
}

const DAY_ABBR = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const MONTH_CS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function daysIn(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function startOff(y: number, m: number) { const d = new Date(y, m-1, 1).getDay(); return d === 0 ? 6 : d-1; }
function addM(y: number, m: number, n: number) {
  let mo = m+n, yr = y;
  while (mo>12){mo-=12;yr++;} while(mo<1){mo+=12;yr--;}
  return {y:yr,m:mo};
}

export function BookingCalendar({ apartmentSlug, selectedCheckIn, selectedCheckOut, onSelectDates }: Props) {
  const now = new Date(); now.setHours(0,0,0,0);
  const todayStr = iso(now.getFullYear(), now.getMonth()+1, now.getDate());

  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()+1);
  const [cache, setCache] = useState<Record<string,Set<string>>>({});
  const [hover, setHover] = useState<string|null>(null);

  const load = useCallback(async (y: number, m: number) => {
    const key = `${y}-${m}`;
    if (cache[key]) return;
    try {
      const r = await fetch(`/api/v1/apartments/${apartmentSlug}/availability?year=${y}&month=${m}`);
      if (!r.ok) return;
      const j = await r.json();
      setCache(p => ({...p, [key]: new Set<string>(j.blockedDates??[])}));
    } catch {/**/}
  }, [apartmentSlug, cache]);

  useEffect(() => { load(year, month); }, [year, month]);

  const blocked = (d: string) => { const [y,m] = d.split('-').map(Number); return cache[`${y}-${m}`]?.has(d)??false; };
  const disabled = (d: string) => d < todayStr || blocked(d);
  const activeEnd = selectedCheckOut ?? (selectedCheckIn && !selectedCheckOut ? hover : null);
  const inRange = (d: string) => {
    if (!selectedCheckIn || !activeEnd) return false;
    const [a,b] = selectedCheckIn < activeEnd ? [selectedCheckIn,activeEnd] : [activeEnd,selectedCheckIn];
    return d > a && d < b;
  };

  function click(d: string) {
    if (disabled(d)) return;
    if (!selectedCheckIn || selectedCheckOut) { onSelectDates(d, null); }
    else if (d <= selectedCheckIn) { onSelectDates(d, null); }
    else { onSelectDates(selectedCheckIn, d); }
  }

  const canBack = () => { const p = addM(year,month,-1); return p.y > now.getFullYear() || (p.y===now.getFullYear() && p.m>=now.getMonth()+1); };
  function back() { if(!canBack()) return; const p=addM(year,month,-1); setYear(p.y); setMonth(p.m); }
  function fwd()  { const n=addM(year,month,1); setYear(n.y); setMonth(n.m); }

  const off = startOff(year, month);
  const tot = daysIn(year, month);
  const cells: (string|null)[] = [...Array(off).fill(null), ...Array.from({length:tot},(_,i)=>iso(year,month,i+1))];
  while (cells.length%7!==0) cells.push(null);
  const rows: (string|null)[][] = [];
  for (let i=0;i<cells.length;i+=7) rows.push(cells.slice(i,i+7));

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={back} disabled={!canBack()} aria-label="Předchozí měsíc"
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#0B1626]/40 hover:text-[#0B1626] hover:bg-[#0B1626]/6 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[13px] font-semibold text-[#0B1626] tracking-wide">
          {MONTH_CS[month-1].toUpperCase()} {year}
        </span>
        <button onClick={fwd} aria-label="Další měsíc"
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#0B1626]/40 hover:text-[#0B1626] hover:bg-[#0B1626]/6 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_ABBR.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-[#0B1626]/30 tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-[2px]">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7">
            {row.map((d, ci) => {
              if (!d) return <div key={`_${ci}`} className="h-10" />;

              const isStart  = d === selectedCheckIn;
              const isEnd    = !!selectedCheckOut && d === selectedCheckOut;
              const isRng    = inRange(d);
              const isHov    = d === hover && !!selectedCheckIn && !selectedCheckOut && !disabled(d);
              const isTdy    = d === todayStr;
              const dis      = disabled(d);
              const bl       = blocked(d);

              const rangeBg  = isRng || isHov;
              const firstCol = ci === 0;
              const lastCol  = ci === 6;

              return (
                <div key={d} className="relative h-10 flex items-center justify-center"
                  onClick={() => click(d)}
                  onMouseEnter={() => { if (selectedCheckIn && !selectedCheckOut) setHover(d); }}
                  onMouseLeave={() => setHover(null)}
                >
                  {/* Range strip */}
                  {rangeBg && (
                    <div className={`absolute inset-y-[4px] bg-[#C9A24D]/15
                      ${firstCol ? 'left-1/2 rounded-l-none' : 'left-0'}
                      ${lastCol  ? 'right-1/2 rounded-r-none' : 'right-0'}
                    `} />
                  )}
                  {/* Half right from start */}
                  {isStart && activeEnd && activeEnd > d && (
                    <div className="absolute inset-y-[4px] left-1/2 right-0 bg-[#C9A24D]/15" />
                  )}
                  {/* Half left into end */}
                  {isEnd && selectedCheckIn && selectedCheckIn < d && (
                    <div className="absolute inset-y-[4px] left-0 right-1/2 bg-[#C9A24D]/15" />
                  )}

                  {/* Day circle */}
                  <div className={`
                    relative z-10 w-9 h-9 flex items-center justify-center rounded-full
                    text-[13px] transition-all duration-150
                    ${dis
                      ? bl
                        ? 'text-[#0B1626]/15 cursor-not-allowed'
                        : 'text-[#0B1626]/18 cursor-not-allowed'
                      : isStart || isEnd
                        ? 'bg-[#0B1626] text-white font-semibold cursor-pointer'
                        : isHov
                          ? 'bg-[#0B1626]/12 text-[#0B1626] cursor-pointer'
                          : 'text-[#0B1626] cursor-pointer hover:bg-[#0B1626]/7'
                    }
                  `}>
                    {parseInt(d.slice(8), 10)}
                    {isTdy && !isStart && !isEnd && (
                      <span className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-[#C9A24D]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#0B1626]/8">
        <span className="flex items-center gap-1.5 text-[10px] text-[#0B1626]/35 uppercase tracking-wide">
          <span className="w-3.5 h-3.5 rounded-full bg-[#0B1626] shrink-0" />
          Příjezd / Odjezd
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#0B1626]/35 uppercase tracking-wide">
          <span className="w-5 h-2.5 rounded-sm bg-[#C9A24D]/30 shrink-0" />
          Pobyt
        </span>
      </div>
    </div>
  );
}
