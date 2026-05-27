'use client';

import { useState } from 'react';
import { BookingCalendar } from './booking-calendar';
import { BookingPriceSummary } from './booking-price-summary';
import { BookingForm } from './booking-form';

type Step = 'calendar' | 'form';

const MIN_NIGHTS = 2;

interface Props {
  apartmentId: string;
  apartmentSlug: string;
  maxGuests: number;
  basePricePerNight: number;
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
}
function nights(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function BookingWidget({ apartmentId, apartmentSlug, maxGuests, basePricePerNight }: Props) {
  const [step, setStep]         = useState<Step>('calendar');
  const [checkIn, setCheckIn]   = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  function handleDates(ci: string, co: string | null) {
    setCheckIn(ci); setCheckOut(co); setError(null);
    if (ci && co) {
      const n = nights(ci, co);
      if (n < MIN_NIGHTS) setError(`Minimální pobyt jsou ${MIN_NIGHTS} noci.`);
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
    <div className="sticky top-24 space-y-0">

      {/* ── Price strip ── */}
      <div className="bg-[#0B1626] px-6 py-5">
        <p className="text-[#C9A24D] text-[10px] tracking-[0.18em] uppercase mb-2">Pronájem od</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[2.2rem] font-light text-white leading-none">
            {basePricePerNight.toLocaleString('cs-CZ')}
          </span>
          <span className="text-white/40 text-sm">Kč / noc</span>
        </div>
        <p className="text-white/25 text-[11px] mt-1.5">Ceny se mohou lišit dle sezóny</p>
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
                  Vyberte datum příjezdu
                </p>
              )}
              {checkIn && !checkOut && (
                <p className="text-[11px] text-[#0B1626]/50 text-center">
                  Příjezd <span className="text-[#0B1626] font-medium">{fmtDate(checkIn)}</span> — vyberte odjezd
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
                    Zrušit
                  </button>
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 py-3 bg-[#C9A24D] text-[#0B1626] text-[11px] uppercase tracking-widest font-medium hover:bg-[#b8913c] transition-colors"
                  >
                    Rezervovat
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
                <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Termín</p>
                <p className="text-sm text-[#0B1626] font-medium">
                  {fmtDate(checkIn)} → {fmtDate(checkOut)}
                  <span className="text-[#0B1626]/40 font-normal ml-2">
                    {nights(checkIn, checkOut)} nocí
                  </span>
                </p>
              </div>
              <button onClick={() => setStep('calendar')}
                className="text-[11px] text-[#0B1626]/40 hover:text-[#0B1626] underline underline-offset-2 transition-colors">
                Změnit
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
