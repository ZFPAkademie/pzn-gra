import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getBookingByToken } from '@/lib/booking-engine/bookings';
import { getRentalApartmentBySlug } from '@/lib/apartments';
import { getApartmentHeroImage } from '@/data/apartment-images';
import { generatePaymentQR } from '@/lib/qr';
import { CopyButton } from './copy-button';
import { MessagesThread } from './messages-thread';

interface Props { params: { token: string } }

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const booking = await getBookingByToken(params.token);
  const apt = booking?.apartments as { title: string } | null;
  return {
    title: apt?.title ? `Rezervace — ${apt.title} | Pod Zlatým návrším` : 'Rezervace | Pod Zlatým návrším',
    robots: { index: false },
  };
}

function fmtCZK(cents: number) {
  return (cents / 100).toLocaleString('cs-CZ', { minimumFractionDigits: 0 }) + ' Kč';
}
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function fmtDay(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'long' });
}
function fmtShort(d: string) {
  const date = new Date(d + 'T12:00:00');
  return `${date.getDate()}. ${date.toLocaleDateString('cs-CZ', { month: 'long' })}`;
}

const BANK_IBAN   = process.env.BANK_IBAN  ?? 'CZ00 0000 0000 0000 0000 0000';
const BANK_NAME   = process.env.BANK_NAME  ?? 'Pod Zlatým návrším s.r.o.';
const CONTACT_EMAIL = 'rezervace@podzlatymnavrsim.cz';
const CONTACT_PHONE = '+420 777 000 000';

export default async function BookingTokenPage({ params }: Props) {
  const booking = await getBookingByToken(params.token);
  if (!booking) notFound();

  const apt = booking.apartments as { slug: string; title: string } | null;
  const staticApt = apt?.slug ? getRentalApartmentBySlug(apt.slug) : null;
  const heroImage = apt?.slug ? getApartmentHeroImage(apt.slug) : null;

  const isPending   = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';

  const reference   = `REZ-${params.token.slice(0, 8).toUpperCase()}`;
  const amountCZK   = booking.total_amount_cents / 100;
  const amountStr   = amountCZK.toFixed(2);

  // QR kód pro platbu (pouze pending)
  let qrDataUrl: string | null = null;
  if (isPending) {
    try {
      qrDataUrl = await generatePaymentQR({
        iban: BANK_IBAN,
        amount: amountCZK,
        message: reference,
      });
    } catch { /* soft fail */ }
  }

  // Check-in info (admin nastavuje po potvrzení)
  const checkinInfo = booking.checkin_info as {
    wifi_name?: string;
    wifi_password?: string;
    door_code?: string;
    parking?: string;
    note?: string;
  } | null;

  const guestFullName = `${booking.guest_first_name} ${booking.guest_last_name}`;

  return (
    <div className="min-h-screen bg-[#F4F6F8]">

      {/* TOP BAR */}
      <div className="bg-[#0B1626]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#C9A24D]">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white/60 text-sm font-light tracking-widest uppercase group-hover:text-white/90 transition-colors">
              Pod Zlatým návrším
            </span>
          </Link>
          <span className="text-white/25 text-xs font-mono">{reference}</span>
        </div>
      </div>

      {/* HERO */}
      <div className="bg-[#0B1626]">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">
          {/* Status */}
          <div className="mb-5">
            {isPending && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] tracking-wider uppercase rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Čeká na platbu
              </span>
            )}
            {isConfirmed && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-400/10 border border-green-400/20 text-green-300 text-[11px] tracking-wider uppercase rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Potvrzeno
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-400/10 border border-red-400/20 text-red-300 text-[11px] tracking-wider uppercase rounded-sm">
                Zrušeno
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-light text-white mb-1">
            {apt?.title ?? 'Váš apartmán'}
          </h1>
          {staticApt && (
            <p className="text-white/35 text-sm">
              Špindlerův Mlýn · {staticApt.layout} · {staticApt.totalArea}
            </p>
          )}
        </div>

        {/* Hero foto */}
        {heroImage && (
          <div className="relative h-56 md:h-80 overflow-hidden">
            <Image
              src={heroImage}
              alt={apt?.title ?? 'Apartmán'}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1626]/70 via-transparent to-transparent" />
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* TERMÍN */}
        <div className="bg-white border border-[#0B1626]/8 rounded-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-[#0B1626]/6">
            <div className="px-5 py-5">
              <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-2">Příjezd</p>
              <p className="text-[11px] text-[#0B1626]/40 mb-0.5 capitalize">{fmtDay(booking.check_in)}</p>
              <p className="text-[1.4rem] font-light text-[#0B1626] leading-none">{fmtShort(booking.check_in)}</p>
              <p className="text-[11px] text-[#0B1626]/35 mt-2">od 15:00</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-2">Odjezd</p>
              <p className="text-[11px] text-[#0B1626]/40 mb-0.5 capitalize">{fmtDay(booking.check_out)}</p>
              <p className="text-[1.4rem] font-light text-[#0B1626] leading-none">{fmtShort(booking.check_out)}</p>
              <p className="text-[11px] text-[#0B1626]/35 mt-2">do 10:00</p>
            </div>
          </div>
          <div className="px-5 py-3 bg-[#F4F6F8] border-t border-[#0B1626]/6 flex items-center justify-between">
            <span className="text-sm text-[#0B1626]/50">
              {booking.nights} {booking.nights === 1 ? 'noc' : booking.nights < 5 ? 'noci' : 'nocí'}
              {' · '}
              {booking.guests_count} {booking.guests_count === 1 ? 'host' : booking.guests_count < 5 ? 'hosté' : 'hostů'}
            </span>
            <span className="text-sm font-light text-[#0B1626]">{fmtCZK(booking.total_amount_cents)}</span>
          </div>
        </div>

        {/* PLATBA — pending */}
        {isPending && (
          <div className="bg-white border border-[#C9A24D]/25 rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#0B1626]/6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0B1626]">Zaplaťte převodem</p>
                <p className="text-[11px] text-[#0B1626]/40 mt-0.5">Potvrdíme do 24 h od přijetí platby</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#C9A24D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>

            {/* QR kód + údaje */}
            <div className="flex gap-0 divide-x divide-[#0B1626]/6">
              {/* Platební údaje */}
              <div className="flex-1 divide-y divide-[#0B1626]/5">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Příjemce</p>
                    <p className="text-sm text-[#0B1626]">{BANK_NAME}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">IBAN</p>
                    <p className="text-sm text-[#0B1626] font-mono">{BANK_IBAN}</p>
                  </div>
                  <CopyButton value={BANK_IBAN.replace(/\s/g,'')} />
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Částka</p>
                    <p className="text-lg font-light text-[#0B1626]">{fmtCZK(booking.total_amount_cents)}</p>
                  </div>
                  <CopyButton value={amountStr} />
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Zpráva</p>
                    <p className="text-sm text-[#0B1626] font-mono">{reference}</p>
                  </div>
                  <CopyButton value={reference} />
                </div>
              </div>

              {/* QR kód */}
              {qrDataUrl && (
                <div className="flex flex-col items-center justify-center px-5 py-4 gap-2 bg-white min-w-[120px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR platba" width={100} height={100} className="rounded-sm" />
                  <p className="text-[9px] text-[#0B1626]/30 uppercase tracking-wider text-center">QR platba</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-amber-50/70 border-t border-amber-100/80">
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Po odeslání platby vám zašleme potvrzení na{' '}
                <strong className="font-medium">{booking.guest_email}</strong>.
                {' '}Máte otázky?{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-amber-900">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* POTVRZENO */}
        {isConfirmed && (
          <div className="bg-white border border-green-200 rounded-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0B1626]">Platba přijata · Rezervace potvrzena</p>
                <p className="text-[11px] text-[#0B1626]/40 mt-0.5">Těšíme se na vás!</p>
              </div>
            </div>

            {/* Check-in info od admina */}
            {checkinInfo && Object.values(checkinInfo).some(Boolean) && (
              <div className="border-t border-[#0B1626]/6 divide-y divide-[#0B1626]/5">
                {checkinInfo.door_code && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Kód ke dveřím</p>
                      <p className="text-sm text-[#0B1626] font-mono font-medium">{checkinInfo.door_code}</p>
                    </div>
                    <CopyButton value={checkinInfo.door_code} />
                  </div>
                )}
                {checkinInfo.wifi_name && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Wi-Fi</p>
                      <p className="text-sm text-[#0B1626]">{checkinInfo.wifi_name}</p>
                      {checkinInfo.wifi_password && (
                        <p className="text-[11px] text-[#0B1626]/50 font-mono mt-0.5">{checkinInfo.wifi_password}</p>
                      )}
                    </div>
                    {checkinInfo.wifi_password && <CopyButton value={checkinInfo.wifi_password} />}
                  </div>
                )}
                {checkinInfo.parking && (
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Parkování</p>
                    <p className="text-sm text-[#0B1626]">{checkinInfo.parking}</p>
                  </div>
                )}
                {checkinInfo.note && (
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-0.5">Pokyny k příjezdu</p>
                    <p className="text-sm text-[#0B1626]/70 leading-relaxed">{checkinInfo.note}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* O APARTMÁNU */}
        {staticApt && (
          <div className="bg-white border border-[#0B1626]/8 rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#0B1626]/6">
              <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest">O apartmánu</p>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-2 border-b border-[#0B1626]/5">
              {staticApt.features.map((f) => (
                <span key={f} className="px-3 py-1.5 bg-[#F4F6F8] text-[#0B1626]/60 text-[11px] rounded-sm">
                  {f}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#0B1626]/5 border-b border-[#0B1626]/5">
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-1">Dispozice</p>
                <p className="text-sm text-[#0B1626]">{staticApt.layout}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-1">Plocha</p>
                <p className="text-sm text-[#0B1626]">{staticApt.totalArea}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#0B1626]/35 uppercase tracking-widest mb-1">Max. hostů</p>
                <p className="text-sm text-[#0B1626]">{staticApt.maxGuests}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-[#0B1626]/55 leading-relaxed">{staticApt.description}</p>
            </div>
          </div>
        )}

        {/* ZPRÁVY */}
        {!isCancelled && (
          <MessagesThread token={params.token} guestName={guestFullName} />
        )}

        {/* KONTAKT */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${CONTACT_PHONE.replace(/\s/g,'')}`}
            className="flex items-center gap-2.5 px-4 py-3.5 bg-white border border-[#0B1626]/8 rounded-sm text-sm text-[#0B1626] hover:border-[#0B1626]/25 transition-colors">
            <svg className="w-4 h-4 text-[#C9A24D] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {CONTACT_PHONE}
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-2.5 px-4 py-3.5 bg-white border border-[#0B1626]/8 rounded-sm text-sm text-[#0B1626] hover:border-[#0B1626]/25 transition-colors truncate">
            <svg className="w-4 h-4 text-[#C9A24D] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{CONTACT_EMAIL}</span>
          </a>
        </div>

        {/* FOOTER */}
        <div className="text-center py-3">
          <p className="text-[11px] text-[#0B1626]/25">
            {reference} · Pod Zlatým návrším · Špindlerův Mlýn
          </p>
          <Link href="/" className="text-[11px] text-[#C9A24D]/50 hover:text-[#C9A24D] transition-colors mt-1 inline-block">
            podzlatymnavrsim.cz
          </Link>
        </div>
      </div>
    </div>
  );
}
