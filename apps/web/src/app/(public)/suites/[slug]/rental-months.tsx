/**
 * Pronájem v číslech — dvě oddělené vizualizace (žádná dvojí osa):
 *
 * 1. SeasonOccupancy: obsazenost jen nejbližší sezóny, kde už rezervace jsou.
 *    Pruh = tento apartmán, svislá značka = průměr celého domu (stejná míra, stejné měřítko 0–100 %).
 *    Vzdálené měsíce se záměrně neukazují — „0 z 31“ na jaře působilo, jako by tam nikdo nebyl,
 *    přitom se na ně jen ještě nerezervuje (zadání 10. 11. 2026).
 * 2. PriceYear: ceník za noc po měsících na rok dopředu (medián + svátky), bez obsazenosti.
 *
 * Hodnoty jsou vždy vypsané textem; pruh je jen pomůcka.
 */

import { formatMoney } from '@/lib/booking-engine/money';
import type { RentalMonth, SeasonMonth } from '@/lib/sale-presentation';

function monthName(ym: string, locale: 'cs' | 'en', short = false) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 15));
  const name = d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'cs-CZ', { month: short ? 'short' : 'long', timeZone: 'UTC' });
  return { name: name.charAt(0).toUpperCase() + name.slice(1).replace(/\.$/, ''), year: String(y) };
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function SeasonOccupancy({
  months,
  today,
  locale,
  labels,
}: {
  months: SeasonMonth[];
  today: string;
  locale: 'cs' | 'en';
  labels: { thisApt: string; house: string; fromToday: string; nightsOf: (b: number, n: number) => string };
}) {
  return (
    <div>
      {/* Legenda */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50 mb-4">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-6 h-2 rounded-full bg-gold" />
          {labels.thisApt}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-0.5 h-3.5 bg-white" />
          {labels.house}
        </span>
      </div>

      <div className="border-t border-white/10">
        {months.map((m, i) => {
          const { name, year } = monthName(m.month, locale);
          const own = pct(m.booked, m.nights);
          const house = pct(m.houseBooked, m.houseNights);
          const partial = m.month === today.slice(0, 7);
          return (
            <div
              key={m.month}
              className="grid grid-cols-[1fr_auto] md:grid-cols-[10rem_1fr_10rem] items-center gap-x-6 gap-y-2 py-4 border-b border-white/10"
            >
              <div className="text-white font-light">
                {name}
                {(i === 0 || m.month.endsWith('-01')) && <span className="text-white/40 ml-2 text-sm">{year}</span>}
                {partial && <span className="block text-white/40 text-xs mt-0.5">{labels.fromToday}</span>}
              </div>
              <div className="col-span-2 md:col-span-1 md:order-none order-last relative h-2 bg-white/5 rounded-full" title={`${labels.thisApt}: ${own} % · ${labels.house}: ${house} %`}>
                <div className="absolute inset-y-0 left-0 bg-gold rounded-full" style={{ width: `${own}%` }} />
                <div className="absolute -top-1 -bottom-1 w-0.5 bg-white" style={{ left: `calc(${house}% - 1px)` }} />
              </div>
              <div className="text-right tabular-nums whitespace-nowrap">
                <span className="text-white">{own} %</span>
                <span className="text-white/40 text-sm ml-2">{labels.nightsOf(m.booked, m.nights)}</span>
                <span className="block text-white/40 text-xs">
                  {labels.house} {house} %
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PriceYear({
  months,
  currency,
  locale,
  upTo,
}: {
  months: RentalMonth[];
  currency: string;
  locale: 'cs' | 'en';
  upTo: string;
}) {
  const max = Math.max(1, ...months.map((m) => m.medianCents ?? 0));
  const money = (c: number) => formatMoney(c, currency, locale);
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-px bg-white/10 border border-white/10">
      {months.map((m) => {
        const { name } = monthName(m.month, locale);
        const peak = m.maxCents && m.medianCents && m.maxCents >= m.medianCents * 1.5 ? m.maxCents : null;
        const h = m.medianCents ? Math.max(6, Math.round((m.medianCents / max) * 100)) : 0;
        return (
          <div key={m.month} className="bg-navy p-3 sm:p-4 flex flex-col">
            <span className="text-xs text-white/50">{name}</span>
            <span className="text-lg sm:text-xl font-light text-white tabular-nums mt-1">{m.medianCents ? money(m.medianCents) : '—'}</span>
            <span className="text-[11px] text-white/40 min-h-[1rem] whitespace-nowrap">{peak ? `${upTo} ${money(peak)}` : ''}</span>
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full" style={{ width: `${h}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
