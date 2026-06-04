'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateBookingStatus } from './actions';

interface StatusActionsProps {
  bookingId: string;
  currentStatus: string;
}

export function StatusActions({ bookingId, currentStatus }: StatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdate = async (newStatus: string) => {
    setLoading(newStatus);
    setMessage(null);
    const result = await updateBookingStatus(bookingId, newStatus);
    if (result.ok) {
      setMessage({ type: 'success', text: 'Status aktualizován' });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Chyba při aktualizaci' });
    }
    setLoading(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'pending' && (
          <>
            <button
              onClick={() => handleUpdate('confirmed')}
              disabled={loading === 'confirmed'}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'confirmed' ? 'Ukládám...' : 'Potvrdit platbu'}
            </button>
            <button
              onClick={() => handleUpdate('cancelled')}
              disabled={loading === 'cancelled'}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'cancelled' ? 'Ukládám...' : 'Zrušit'}
            </button>
          </>
        )}
        {currentStatus === 'confirmed' && (
          <>
            <button
              onClick={() => handleUpdate('completed')}
              disabled={loading === 'completed'}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'completed' ? 'Ukládám...' : 'Označit jako dokončené'}
            </button>
            <button
              onClick={() => handleUpdate('cancelled')}
              disabled={loading === 'cancelled'}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === 'cancelled' ? 'Ukládám...' : 'Zrušit'}
            </button>
          </>
        )}
        {currentStatus === 'cancelled' && (
          <button
            onClick={() => handleUpdate('pending')}
            disabled={loading === 'pending'}
            className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-md hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === 'pending' ? 'Ukládám...' : 'Obnovit rezervaci (vrátit na čekající)'}
          </button>
        )}
        {currentStatus === 'completed' && (
          <p className="text-sm text-slate-400 italic">Žádné dostupné akce pro tento status.</p>
        )}
      </div>
      {message && (
        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
