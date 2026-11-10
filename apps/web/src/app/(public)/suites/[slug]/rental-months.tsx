/**
 * Ceník a obsazenost po měsících — dvě samostatné míry, každá s vlastním měřítkem
 * (žádná dvojí osa): cena za noc (medián měsíce) a obsazené noci z nocí měsíce.
 * Hodnoty jsou vždy vypsané textem, pruh je jen pomůcka; řádek = měsíc, takže na
 * telefonu se nic neuřezává.
 */

import { formatMoney } from '@/lib/booking-engine/money';
import type { RentalMonth } from '@/lib/sale-presentation';

interface Props {
  months: RentalMonth[];
  currency: string;
  locale: 'cs' | 'en';
  labels: { colMonth: string; colPrice: string; colPriceShort: string; colBooked: string; fromToday: string; upTo: string; nightsOf: (b: number, n: number) => string };
}

function monthName(ym: string, locale: 'cs' | 'en') {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 15));
  const name = d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'cs-CZ', { month: 'long', timeZone: 'UTC' });
  return { name: name.charAt(0).toUpperCase() + name.slice(1), year: String(y) };
}

export function RentalMonths({ months, currency, locale, labels }: Props) {
  const maxMedian = Math.max(1, ...months.map((m) => m.medianCents ?? 0));
  const money = (c: number) => formatMoney(c, currency, locale);

  return (
    <div className="border-t border-white/10">
      {/* Hlavička (desktop) */}
      <div className="hidden md:grid grid-cols-[10rem_1fr_1fr] gap-8 py-3 text-xs uppercase tracking-widest text-white/40 border-b border-white/10">
        <span>{labels.colMonth}</span>
        <span>{labels.colPrice}</span>
        <span>{labels.colBooked}</span>
      </div>

      {months.map((m, i) => {
        const { name, year } = monthName(m.month, locale);
        const showYear = i === 0 || m.month.endsWith('-01');
        const pricePct = m.medianCents ? Math.max(4, Math.round((m.medianCents / maxMedian) * 100)) : 0;
        const bookedPct = m.nights ? Math.round((m.booked / m.nights) * 100) : 0;
        const peak = m.maxCents && m.medianCents && m.maxCents >= m.medianCents * 1.5 ? m.maxCents : null;

        return (
          <div
            key={m.month}
            className="grid grid-cols-1 md:grid-cols-[10rem_1fr_1fr] gap-x-8 gap-y-2 py-4 border-b border-white/10"
          >
            <div className="text-white font-light">
              {name}
              {showYear && <span className="text-white/40 ml-2 text-sm">{year}</span>}
              {m.partial && <span className="block text-white/40 text-xs mt-0.5">{labels.fromToday}</span>}
            </div>

            {/* Cena za noc */}
            <div className="flex items-center gap-3" title={`${labels.colPrice}: ${m.medianCents ? money(m.medianCents) : '—'}`}>
              <span className="md:hidden w-20 shrink-0 text-xs uppercase tracking-widest text-white/40">{labels.colPriceShort}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 rounded-full" style={{ width: `${pricePct}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right text-white tabular-nums">
                {m.medianCents ? money(m.medianCents) : '—'}
                {peak && (
                  <span className="block text-[11px] text-white/40 whitespace-nowrap">
                    {labels.upTo} {money(peak)}
                  </span>
                )}
              </span>
            </div>

            {/* Obsazenost */}
            <div className="flex items-center gap-3" title={`${labels.colBooked}: ${labels.nightsOf(m.booked, m.nights)}`}>
              <span className="md:hidden w-20 shrink-0 text-xs uppercase tracking-widest text-white/40">{labels.colBooked}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full" style={{ width: `${bookedPct}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right text-white tabular-nums whitespace-nowrap">
                {labels.nightsOf(m.booked, m.nights)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
