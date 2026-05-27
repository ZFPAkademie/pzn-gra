'use client';

import { useState } from 'react';
import { BookingCalendar } from './booking-calendar';
import { BookingPriceSummary } from './booking-price-summary';
import { BookingForm } from './booking-form';

type WidgetState = 'idle' | 'dates_selected' | 'form' | 'error';

const MIN_NIGHTS = 2;

interface Props {
  apartmentId: string;
  apartmentSlug: string;
  maxGuests: number;
  basePricePerNight: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
  });
}

export function BookingWidget({ apartmentId, apartmentSlug, maxGuests, basePricePerNight }: Props) {
  const [state, setState] = useState<WidgetState>('idle');
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSelectDates(newCheckIn: string, newCheckOut: string | null) {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);

    if (newCheckIn && newCheckOut) {
      const nights = Math.round(
        (new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / 86400000
      );
      if (nights < MIN_NIGHTS) {
        setErrorMessage(`Minimální délka pobytu jsou ${MIN_NIGHTS} noci.`);
        setState('error');
      } else {
        setErrorMessage(null);
        setState('dates_selected');
      }
    } else {
      setState('idle');
    }
  }

  function handleSuccess(_bookingId: string, checkoutUrl: string) {
    window.location.href = checkoutUrl;
  }

  function handleError(message: string) {
    setErrorMessage(message);
    setState('error');
  }

  function resetDates() {
    setCheckIn(null);
    setCheckOut(null);
    setState('idle');
    setErrorMessage(null);
  }

  return (
    <div className="space-y-4">
      <div className="bg-navy p-6 mb-2">
        <p className="text-gold text-xs tracking-widest uppercase mb-3">Pronájem od</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light text-white">
            {basePricePerNight.toLocaleString('cs-CZ')}
          </span>
          <span className="text-white/50 text-sm">Kč / noc</span>
        </div>
        <p className="text-white/30 text-xs mt-1">Ceny se mohou lišit dle sezóny</p>
      </div>

      <BookingCalendar
        apartmentSlug={apartmentSlug}
        selectedCheckIn={checkIn}
        selectedCheckOut={checkOut}
        onSelectDates={handleSelectDates}
      />

      {state === 'idle' && (
        <p className="text-xs text-navy/40 text-center py-2">
          Vyberte datum příjezdu a odjezdu
        </p>
      )}

      {checkIn && !checkOut && (
        <p className="text-xs text-navy/50 text-center py-2">
          Příjezd: {formatDate(checkIn)} — Vyberte datum odjezdu
        </p>
      )}

      {state === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button
            onClick={resetDates}
            className="mt-2 text-xs text-red-600 underline hover:no-underline"
          >
            Vybrat jiný termín
          </button>
        </div>
      )}

      {state === 'dates_selected' && checkIn && checkOut && (
        <>
          <BookingPriceSummary
            apartmentSlug={apartmentSlug}
            checkIn={checkIn}
            checkOut={checkOut}
          />

          <div className="flex gap-2">
            <button
              onClick={resetDates}
              className="flex-1 py-3 border border-navy/20 text-navy text-xs uppercase tracking-widest hover:bg-navy/5 transition-colors"
            >
              Změnit termín
            </button>
            <button
              onClick={() => setState('form')}
              className="flex-1 py-3 bg-[#C9A24D] text-[#0B1626] text-xs uppercase tracking-widest hover:bg-[#b8913c] transition-colors"
            >
              Pokračovat
            </button>
          </div>
        </>
      )}

      {state === 'form' && checkIn && checkOut && (
        <>
          <div className="bg-stone border border-navy/10 px-4 py-3 flex justify-between items-center rounded-sm">
            <span className="text-xs text-navy/60">
              {formatDate(checkIn)} — {formatDate(checkOut)}
            </span>
            <button
              onClick={() => setState('dates_selected')}
              className="text-xs text-navy/40 underline hover:no-underline"
            >
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
            onError={handleError}
          />
        </>
      )}
    </div>
  );
}
