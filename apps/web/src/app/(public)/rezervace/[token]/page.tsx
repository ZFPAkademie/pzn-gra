import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingByToken } from '@/lib/booking-engine/bookings';
import { CopyButton } from './copy-button';

interface Props {
  params: { token: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Vaše rezervace | Pod Zlatým návrším' };
}

function formatCZK(cents: number): string {
  return (cents / 100).toLocaleString('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' Kč';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const BANK_IBAN = process.env.BANK_IBAN ?? 'CZ00 0000 0000 0000 0000 0000';
const BANK_NAME = process.env.BANK_NAME ?? 'Pod Zlatým návrším s.r.o.';

export default async function BookingTokenPage({ params }: Props) {
  const booking = await getBookingByToken(params.token);
  if (!booking) notFound();

  const apt = booking.apartments as { slug: string; title: string } | null;
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  const isCancelled = booking.status === 'cancelled';
  const reference = `REZ-${params.token.slice(0, 8).toUpperCase()}`;
  const amountFormatted = (booking.total_amount_cents / 100).toFixed(2);

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0B1626] pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center text-white/40 hover:text-white mb-10 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Zpět na web
          </Link>

          <p className="text-[#C9A24D] text-xs tracking-widest uppercase mb-4">Rezervace</p>
          <h1 className="text-3xl md:text-4xl font-light text-white mb-2">
            {apt?.title ?? 'Váš apartmán'}
          </h1>
          <p className="text-white/40 text-sm">
            {booking.guest_first_name} {booking.guest_last_name} · {reference}
          </p>

          {/* Status badge */}
          <div className="mt-6">
            {isPending && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-700/50 text-amber-300 text-xs tracking-wider uppercase rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Čeká na platbu
              </span>
            )}
            {isConfirmed && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700/50 text-green-300 text-xs tracking-wider uppercase rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Potvrzeno
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-700/50 text-red-300 text-xs tracking-wider uppercase rounded-sm">
                Zrušeno
              </span>
            )}
            {booking.status === 'completed' && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/50 text-xs tracking-wider uppercase rounded-sm">
                Dokončeno
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-[#F4F6F8]">
        <div className="max-w-2xl mx-auto px-6 space-y-5">

          {/* Termín */}
          <div className="bg-white border border-navy/10 p-6 space-y-5">
            <h2 className="text-xs text-navy/40 uppercase tracking-widest">Termín pobytu</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Příjezd</p>
                <p className="text-navy font-light">{formatDate(booking.check_in)}</p>
                <p className="text-xs text-navy/40 mt-0.5">od 15:00</p>
              </div>
              <div>
                <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Odjezd</p>
                <p className="text-navy font-light">{formatDate(booking.check_out)}</p>
                <p className="text-xs text-navy/40 mt-0.5">do 10:00</p>
              </div>
            </div>
            <div className="border-t border-navy/10 pt-4 flex gap-8">
              <div>
                <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Délka pobytu</p>
                <p className="text-navy">{booking.nights} nocí</p>
              </div>
              <div>
                <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Počet hostů</p>
                <p className="text-navy">{booking.guests_count}</p>
              </div>
            </div>
          </div>

          {/* Platba — bank transfer */}
          {isPending && (
            <div className="bg-white border border-[#C9A24D]/40 p-6 space-y-5">
              <div className="flex items-start justify-between">
                <h2 className="text-xs text-navy/40 uppercase tracking-widest">Platební instrukce</h2>
                <span className="text-xs text-[#C9A24D] bg-[#C9A24D]/10 px-3 py-1 rounded-sm">
                  Bankovní převod
                </span>
              </div>

              <p className="text-sm text-navy/70 leading-relaxed">
                Rezervaci potvrdíme po přijetí platby, <strong className="font-medium text-navy">nejpozději do 24 hodin</strong>.
                Použijte prosím níže uvedené platební údaje.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-navy/8">
                  <div>
                    <p className="text-xs text-navy/40 uppercase tracking-widest mb-0.5">Příjemce</p>
                    <p className="text-navy text-sm">{BANK_NAME}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-navy/8">
                  <div>
                    <p className="text-xs text-navy/40 uppercase tracking-widest mb-0.5">IBAN</p>
                    <p className="text-navy font-mono text-sm">{BANK_IBAN}</p>
                  </div>
                  <CopyButton value={BANK_IBAN.replace(/\s/g, '')} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-navy/8">
                  <div>
                    <p className="text-xs text-navy/40 uppercase tracking-widest mb-0.5">Částka</p>
                    <p className="text-navy font-light text-xl">{formatCZK(booking.total_amount_cents)}</p>
                  </div>
                  <CopyButton value={amountFormatted} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-navy/8">
                  <div>
                    <p className="text-xs text-navy/40 uppercase tracking-widest mb-0.5">Zpráva pro příjemce</p>
                    <p className="text-navy font-mono text-sm">{reference}</p>
                  </div>
                  <CopyButton value={reference} />
                </div>
              </div>

              <div className="bg-navy/5 p-4 rounded-sm">
                <p className="text-xs text-navy/60 leading-relaxed">
                  Po odeslání platby vám zašleme potvrzení na{' '}
                  <span className="text-navy">{booking.guest_email}</span>.
                  V případě dotazů nás kontaktujte na{' '}
                  <a href="mailto:rezervace@podzlatymnavrsim.cz" className="text-[#C9A24D] hover:underline">
                    rezervace@podzlatymnavrsim.cz
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Potvrzeno */}
          {isConfirmed && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800 font-medium">Rezervace potvrzena</p>
              </div>
              <p className="text-sm text-green-700">
                Platba přijata. Těšíme se na vás! Detaily pobytu jsme zaslali na{' '}
                <span className="font-medium">{booking.guest_email}</span>.
              </p>
            </div>
          )}

          {/* Cena */}
          <div className="bg-white border border-navy/10 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">Celková cena</p>
              <p className="text-xs text-navy/40">vč. všech poplatků</p>
            </div>
            <p className="text-2xl font-light text-navy">{formatCZK(booking.total_amount_cents)}</p>
          </div>

          {/* Zpět */}
          {apt?.slug && (
            <Link
              href={`/apartmany-spindleruv-mlyn-pronajem/${apt.slug}`}
              className="inline-flex items-center text-navy/50 hover:text-navy transition-colors text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Zpět na detail apartmánu
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
