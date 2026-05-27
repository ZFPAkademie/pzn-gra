import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getBookingByToken } from '@/lib/booking-engine/bookings';
import { getRentalApartmentBySlug } from '@/lib/apartments';
import { getApartmentImages } from '@/data/apartment-images';
import { CopyButton } from './copy-button';

interface Props {
  params: { token: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const booking = await getBookingByToken(params.token);
  const apt = booking?.apartments as { slug: string; title: string } | null;
  return {
    title: apt?.title
      ? `Rezervace — ${apt.title} | Pod Zlatým návrším`
      : 'Rezervace | Pod Zlatým návrším',
    robots: { index: false },
  };
}

function formatCZK(cents: number): string {
  return (cents / 100).toLocaleString('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' Kč';
}

function formatDate(dateStr: string, short = false): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('cs-CZ', {
    weekday: short ? undefined : 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const BANK_IBAN = process.env.BANK_IBAN ?? 'CZ00 0000 0000 0000 0000 0000';
const BANK_NAME = process.env.BANK_NAME ?? 'Pod Zlatým návrším s.r.o.';
const RESORT_ADDRESS = 'Špindlerův Mlýn, Krkonoše';
const CHECKIN_CONTACT = 'rezervace@podzlatymnavrsim.cz';
const CHECKIN_PHONE = '+420 777 000 000';

export default async function BookingTokenPage({ params }: Props) {
  const booking = await getBookingByToken(params.token);
  if (!booking) notFound();

  const apt = booking.apartments as { slug: string; title: string } | null;
  const staticApt = apt?.slug ? getRentalApartmentBySlug(apt.slug) : null;
  const images = apt?.slug ? getApartmentImages(apt.slug) : [];
  const coverImage = images[0] ?? null;

  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  const reference = `REZ-${params.token.slice(0, 8).toUpperCase()}`;
  const amountStr = (booking.total_amount_cents / 100).toFixed(2);

  const checkInDate = new Date(booking.check_in + 'T12:00:00');
  const checkOutDate = new Date(booking.check_out + 'T12:00:00');
  const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

  return (
    <div className="min-h-screen bg-[#F4F6F8]">

      {/* TOP BAR */}
      <div className="bg-[#0B1626] border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#C9A24D]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white/80 text-sm font-light tracking-widest uppercase">Pod Zlatým návrším</span>
          </Link>
          <span className="text-white/30 text-xs font-mono">{reference}</span>
        </div>
      </div>

      {/* HERO — apartmán */}
      <div className="bg-[#0B1626] pb-0">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-0">

          {/* Status */}
          <div className="mb-6">
            {isPending && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs tracking-wider uppercase rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Čeká na platbu
              </span>
            )}
            {isConfirmed && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-400/10 border border-green-400/30 text-green-300 text-xs tracking-wider uppercase rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Rezervace potvrzena
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-400/10 border border-red-400/30 text-red-300 text-xs tracking-wider uppercase rounded-sm">
                Rezervace zrušena
              </span>
            )}
          </div>

          {/* Apartment name */}
          <h1 className="text-3xl md:text-4xl font-light text-white mb-1">
            {apt?.title ?? 'Váš apartmán'}
          </h1>
          <p className="text-white/40 text-sm mb-8">
            {RESORT_ADDRESS}
            {staticApt && ` · ${staticApt.layout} · ${staticApt.totalArea}`}
          </p>

          {/* Cover image */}
          {coverImage && (
            <div className="relative h-52 md:h-72 rounded-t-sm overflow-hidden -mx-0">
              <Image
                src={coverImage.src}
                alt={apt?.title ?? 'Apartmán'}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1626]/60 to-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* TERMÍN — hlavní karta */}
        <div className="bg-white border border-navy/10 rounded-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-navy/8">
            <div className="p-5">
              <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-2">Příjezd</p>
              <p className="text-xs text-navy/50 mb-0.5">{dayNames[checkInDate.getDay()]}</p>
              <p className="text-2xl font-light text-navy leading-none">
                {checkInDate.getDate()}. {checkInDate.toLocaleDateString('cs-CZ', { month: 'long' })}
              </p>
              <p className="text-xs text-navy/40 mt-2">od 15:00</p>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-2">Odjezd</p>
              <p className="text-xs text-navy/50 mb-0.5">{dayNames[checkOutDate.getDay()]}</p>
              <p className="text-2xl font-light text-navy leading-none">
                {checkOutDate.getDate()}. {checkOutDate.toLocaleDateString('cs-CZ', { month: 'long' })}
              </p>
              <p className="text-xs text-navy/40 mt-2">do 10:00</p>
            </div>
          </div>
          <div className="border-t border-navy/8 px-5 py-3 flex items-center justify-between bg-[#F4F6F8]">
            <div className="flex items-center gap-4 text-sm text-navy/60">
              <span>{booking.nights} {booking.nights === 1 ? 'noc' : booking.nights < 5 ? 'noci' : 'nocí'}</span>
              <span>·</span>
              <span>{booking.guests_count} {booking.guests_count === 1 ? 'host' : booking.guests_count < 5 ? 'hosté' : 'hostů'}</span>
            </div>
            <span className="text-sm font-light text-navy">{formatCZK(booking.total_amount_cents)}</span>
          </div>
        </div>

        {/* PLATEBNÍ INSTRUKCE — pouze pending */}
        {isPending && (
          <div className="bg-white border border-[#C9A24D]/30 rounded-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-navy/8 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-navy">Zaplaťte převodem</h2>
                <p className="text-xs text-navy/50 mt-0.5">Rezervaci potvrdíme do 24 hodin od přijetí platby</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#C9A24D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>

            <div className="divide-y divide-navy/6">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Příjemce</p>
                  <p className="text-sm text-navy">{BANK_NAME}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">IBAN</p>
                  <p className="text-sm text-navy font-mono">{BANK_IBAN}</p>
                </div>
                <CopyButton value={BANK_IBAN.replace(/\s/g, '')} label="Kopírovat" />
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Částka</p>
                  <p className="text-xl font-light text-navy">{formatCZK(booking.total_amount_cents)}</p>
                </div>
                <CopyButton value={amountStr} label="Kopírovat" />
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Zpráva pro příjemce</p>
                  <p className="text-sm text-navy font-mono">{reference}</p>
                </div>
                <CopyButton value={reference} label="Kopírovat" />
              </div>
            </div>

            <div className="px-5 py-4 bg-amber-50/60 border-t border-amber-100">
              <p className="text-xs text-amber-800 leading-relaxed">
                Po odeslání platby vám zašleme potvrzení na <strong>{booking.guest_email}</strong>.
                Máte otázky?{' '}
                <a href={`mailto:${CHECKIN_CONTACT}`} className="underline hover:text-amber-900">
                  {CHECKIN_CONTACT}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* CONFIRMED — info k příjezdu */}
        {isConfirmed && (
          <div className="bg-white border border-green-200 rounded-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-navy/8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-medium text-navy">Platba přijata · Rezervace potvrzena</h2>
                <p className="text-xs text-navy/50 mt-0.5">Těšíme se na vás!</p>
              </div>
            </div>
            <div className="divide-y divide-navy/6">
              <div className="px-5 py-4 flex items-start gap-3">
                <svg className="w-4 h-4 text-[#C9A24D] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Adresa</p>
                  <p className="text-sm text-navy">{RESORT_ADDRESS}</p>
                </div>
              </div>
              <div className="px-5 py-4 flex items-start gap-3">
                <svg className="w-4 h-4 text-[#C9A24D] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Recepce</p>
                  <a href={`tel:${CHECKIN_PHONE.replace(/\s/g, '')}`} className="text-sm text-navy hover:text-[#C9A24D] transition-colors">
                    {CHECKIN_PHONE}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* O APARTMÁNU */}
        {staticApt && (
          <div className="bg-white border border-navy/10 rounded-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-navy/8">
              <h2 className="text-xs text-navy/40 uppercase tracking-widest">O apartmánu</h2>
            </div>

            {/* Features */}
            <div className="px-5 py-4 flex flex-wrap gap-2 border-b border-navy/6">
              {staticApt.features.map((f) => (
                <span key={f} className="px-3 py-1.5 bg-[#F4F6F8] text-navy/70 text-xs rounded-sm">
                  {f}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-navy/6 border-b border-navy/6">
              <div className="px-4 py-4">
                <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Dispozice</p>
                <p className="text-sm text-navy">{staticApt.layout}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Plocha</p>
                <p className="text-sm text-navy">{staticApt.totalArea}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-[10px] text-navy/40 uppercase tracking-widest mb-1">Max. hostů</p>
                <p className="text-sm text-navy">{staticApt.maxGuests}</p>
              </div>
            </div>

            {/* Description */}
            <div className="px-5 py-4">
              <p className="text-sm text-navy/60 leading-relaxed">{staticApt.description}</p>
            </div>
          </div>
        )}

        {/* KONTAKT */}
        <div className="bg-white border border-navy/10 rounded-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-navy/8">
            <h2 className="text-xs text-navy/40 uppercase tracking-widest">Kontakt & otázky</h2>
          </div>
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              href={`tel:${CHECKIN_PHONE.replace(/\s/g, '')}`}
              className="flex items-center gap-3 flex-1 py-3 px-4 border border-navy/15 text-navy text-sm hover:border-navy/40 transition-colors rounded-sm"
            >
              <svg className="w-4 h-4 text-[#C9A24D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {CHECKIN_PHONE}
            </a>
            <a
              href={`mailto:${CHECKIN_CONTACT}`}
              className="flex items-center gap-3 flex-1 py-3 px-4 border border-navy/15 text-navy text-sm hover:border-navy/40 transition-colors rounded-sm"
            >
              <svg className="w-4 h-4 text-[#C9A24D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {CHECKIN_CONTACT}
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center py-4">
          <p className="text-xs text-navy/30">
            Rezervace {reference} · Pod Zlatým návrším · Špindlerův Mlýn
          </p>
          <Link href="/" className="text-xs text-[#C9A24D]/60 hover:text-[#C9A24D] transition-colors mt-1 inline-block">
            podzlatymnavrsim.cz
          </Link>
        </div>

      </div>
    </div>
  );
}
