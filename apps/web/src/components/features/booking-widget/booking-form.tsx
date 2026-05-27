'use client';

import { useState } from 'react';

interface Props {
  apartmentId: string;
  apartmentSlug: string;
  maxGuests: number;
  checkIn: string;
  checkOut: string;
  onSuccess: (bookingId: string, checkoutUrl: string) => void;
  onError: (message: string) => void;
}

export function BookingForm({
  apartmentId,
  apartmentSlug,
  maxGuests,
  checkIn,
  checkOut,
  onSuccess,
  onError,
}: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(2);
  const [gdpr, setGdpr] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!gdpr) {
      onError('Pro pokračování je nutný souhlas se zpracováním osobních údajů.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId,
          checkIn,
          checkOut,
          guests,
          firstName,
          lastName,
          email,
          phone,
          gdprConsent: gdpr,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        onError(json.error ?? 'Nepodařilo se vytvořit rezervaci. Zkuste to prosím znovu.');
        return;
      }

      onSuccess(json.bookingId, json.confirmationToken);
    } catch {
      onError('Nastala neočekávaná chyba. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-navy/50 uppercase tracking-widest mb-1.5">
            Jméno
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
            placeholder="Jana"
          />
        </div>
        <div>
          <label className="block text-xs text-navy/50 uppercase tracking-widest mb-1.5">
            Příjmení
          </label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
            placeholder="Nováková"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-navy/50 uppercase tracking-widest mb-1.5">
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
          placeholder="jana@email.cz"
        />
      </div>

      <div>
        <label className="block text-xs text-navy/50 uppercase tracking-widest mb-1.5">
          Telefon
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
          placeholder="+420 777 000 000"
        />
      </div>

      <div>
        <label className="block text-xs text-navy/50 uppercase tracking-widest mb-1.5">
          Počet hostů
        </label>
        <select
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value, 10))}
          className="w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'host' : n < 5 ? 'hosté' : 'hostů'}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={gdpr}
            onChange={(e) => setGdpr(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-navy cursor-pointer"
          />
          <span className="text-xs text-navy/60 leading-relaxed">
            Souhlasím se zpracováním osobních údajů pro účely rezervace a komunikace v souladu
            s{' '}
            <a href="/ochrana-osobnich-udaju" className="underline hover:text-navy transition-colors" target="_blank">
              zásadami ochrany osobních údajů
            </a>
            .
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !gdpr}
        className="w-full py-4 bg-[#C9A24D] text-[#0B1626] text-sm uppercase tracking-wider font-light hover:bg-[#b8913c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Přesměrovávám na platbu...
          </span>
        ) : (
          'Odeslat rezervaci'
        )}
      </button>
    </form>
  );
}
