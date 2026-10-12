'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { pushBookingToFdmAction } from './actions';

interface Props {
  bookingId: string;
  syncStatus: string;
  reservationCode: string | null;
  syncError: string | null;
}

const statusLabel: Record<string, string> = {
  synced: 'Zapsáno v FDM',
  pending: 'Čeká na zápis',
  failed: 'Zápis selhal',
  skipped: 'Nezapisuje se',
};

export function FdmPushButton({ bookingId, syncStatus, reservationCode, syncError }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handlePush() {
    setMessage(null);
    startTransition(async () => {
      const res = await pushBookingToFdmAction(bookingId);
      setMessage(res.ok ? `Zapsáno, kód ${res.reservationCode}` : `Chyba: ${res.error}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
            syncStatus === 'synced'
              ? 'bg-green-50 text-green-700'
              : syncStatus === 'failed'
                ? 'bg-red-50 text-red-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {statusLabel[syncStatus] ?? syncStatus}
        </span>
        {reservationCode && <span className="font-mono text-xs text-slate-600">{reservationCode}</span>}
      </div>
      {syncError && <p className="text-xs text-red-600 break-words">{syncError}</p>}
      {syncStatus !== 'synced' && (
        <button
          onClick={handlePush}
          disabled={pending}
          className="px-3 py-1.5 bg-navy text-white text-xs rounded-md hover:bg-navy/90 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Odesílám…' : 'Odeslat do FDM'}
        </button>
      )}
      {message && <p className="text-xs text-slate-600">{message}</p>}
    </div>
  );
}
