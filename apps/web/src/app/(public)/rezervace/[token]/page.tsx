import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingByToken } from '@/lib/booking-engine/bookings';

interface Props {
  params: { token: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Detail rezervace | Pod Zlatým návrším',
  };
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

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Čeká na platbu', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  confirmed: { label: 'Potvrzeno', color: 'text-green-700 bg-green-50 border-green-200' },
  cancelled: { label: 'Zrušeno', color: 'text-red-700 bg-red-50 border-red-200' },
  completed: { label: 'Dokončeno', color: 'text-navy/60 bg-stone border-navy/10' },
};

export default async function BookingTokenPage({ params }: Props) {
  const booking = await getBookingByToken(params.token);

  if (!booking) {
    notFound();
  }

  const apt = booking.apartments as { slug: string; title: string } | null;
  const status = statusLabels[booking.status] ?? statusLabels.pending;

  return (
    <>
      <section className="bg-[#0B1626] pt-32 pb-20">
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

          <p className="text-gold text-xs tracking-widest uppercase mb-4">Rezervace</p>
          <h1 className="text-3xl md:text-4xl font-light text-white mb-3">
            {apt?.title ?? 'Apartmán'}
          </h1>
          <p className="text-white/40 text-sm">
            {booking.guest_first_name} {booking.guest_last_name}
          </p>
        </div>
      </section>

      <section className="py-16 bg-[#FAFAF7]">
        <div className="max-w-2xl mx-auto px-6 space-y-6">

          <div className={`inline-flex items-center px-4 py-2 border rounded-sm text-sm ${status.color}`}>
            {status.label}
          </div>

          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-6 space-y-5">
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

            <div className="border-t border-navy/10 pt-5 grid grid-cols-2 gap-6">
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

          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-6">
            <h2 className="text-xs text-navy/40 uppercase tracking-widest mb-5">Platba</h2>
            <div className="flex justify-between items-baseline">
              <span className="text-navy/60 text-sm">Celková cena</span>
              <span className="text-2xl font-light text-navy">
                {formatCZK(booking.total_amount_cents)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#0B1626]/10 rounded-sm p-6">
            <h2 className="text-xs text-navy/40 uppercase tracking-widest mb-5">Kontaktní údaje</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-navy/50">Jméno</span>
                <span className="text-navy">{booking.guest_first_name} {booking.guest_last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy/50">E-mail</span>
                <span className="text-navy">{booking.guest_email}</span>
              </div>
            </div>
          </div>

          {booking.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-5">
              <p className="text-sm text-amber-800">
                Vaše rezervace čeká na dokončení platby. Pokud jste platbu nezahájili, kontaktujte nás
                na{' '}
                <a href="mailto:rezervace@podzlatymnavrsim.cz" className="underline">
                  rezervace@podzlatymnavrsim.cz
                </a>
                .
              </p>
            </div>
          )}

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
