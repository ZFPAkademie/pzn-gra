'use client';

import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/booking-engine/money';
import { useLanguage } from '@/components/providers/language-provider';

interface Props {
  apartmentSlug: string;
  checkIn: string;
  checkOut: string;
}

interface PriceData {
  available: boolean;
  nights: number;
  totalCents: number;
  pricePerNightCents: number;
  currency: string;
}

const TEXTS = {
  cs: {
    loadFailed: 'Nepodařilo se načíst cenu',
    unavailable: 'Vybrané termíny nejsou volné. Zvolte jiné datum.',
    summary: 'Přehled ceny',
    nights: (_n: number) => 'nocí',
    total: 'Celkem',
  },
  en: {
    loadFailed: 'The price could not be loaded',
    unavailable: 'The selected dates are not available. Please choose different dates.',
    summary: 'Price summary',
    nights: (n: number) => (n === 1 ? 'night' : 'nights'),
    total: 'Total',
  },
};

export function BookingPriceSummary({ apartmentSlug, checkIn, checkOut }: Props) {
  const { locale } = useLanguage();
  const t = locale === 'cs' ? TEXTS.cs : TEXTS.en;
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/api/v1/apartments/${apartmentSlug}/availability?checkIn=${checkIn}&checkOut=${checkOut}`
    )
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(t.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [apartmentSlug, checkIn, checkOut]);

  if (loading) {
    return (
      <div className="bg-stone border border-[#0B1626]/10 rounded-sm p-4 animate-pulse">
        <div className="h-4 bg-navy/10 rounded w-1/2 mb-2" />
        <div className="h-6 bg-navy/10 rounded w-1/3" />
      </div>
    );
  }

  if (error || (data && !data.available)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm p-4">
        <p className="text-sm text-red-700">
          {error ?? t.unavailable}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const checkInDate = new Date(checkIn + 'T12:00:00');
  const checkOutDate = new Date(checkOut + 'T12:00:00');
  const formatDate = (d: Date) =>
    d.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-stone border border-[#0B1626]/10 rounded-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-navy/50 uppercase tracking-widest">{t.summary}</span>
        <span className="text-xs text-navy/50">
          {formatDate(checkInDate)} — {formatDate(checkOutDate)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-navy/70 mb-3">
        <div className="flex justify-between">
          <span>{formatMoney(data.pricePerNightCents, data.currency, locale)} × {data.nights} {t.nights(data.nights)}</span>
          <span>{formatMoney(data.totalCents, data.currency, locale)}</span>
        </div>
      </div>

      <div className="border-t border-navy/10 pt-3 flex justify-between items-baseline">
        <span className="text-sm text-navy/50">{t.total}</span>
        <span className="text-xl font-light text-navy">{formatMoney(data.totalCents, data.currency, locale)}</span>
      </div>
    </div>
  );
}
