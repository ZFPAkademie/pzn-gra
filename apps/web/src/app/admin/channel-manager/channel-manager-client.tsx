'use client';

import { useState, useTransition } from 'react';
import { addConnection, deleteConnection, toggleConnection } from './actions';

function SyncAllButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/ical/sync', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (data.ok) {
        setResult(`Synchronizováno: ${data.totalImported} bloků z ${data.results?.length ?? 0} napojení`);
      } else {
        setResult('Chyba při synchronizaci');
      }
    } catch {
      setResult('Chyba při synchronizaci');
    } finally {
      setSyncing(false);
      setTimeout(() => { setResult(null); window.location.reload(); }, 2500);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && <p className="text-sm text-slate-600">{result}</p>}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm rounded-md hover:bg-navy/90 disabled:opacity-50 transition-colors"
      >
        {syncing ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Synchronizuji...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Synchronizovat vše
          </>
        )}
      </button>
    </div>
  );
}

function AddConnectionButton({ apartmentId, apartmentTitle }: { apartmentId: string; apartmentTitle: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-navy border border-navy/20 rounded hover:bg-navy/5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Přidat napojení
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-medium text-navy mb-4">
          Přidat iCal napojení — {apartmentTitle}
        </h2>
        <form
          action={async (fd) => {
            startTransition(async () => {
              fd.append('apartmentId', apartmentId);
              const res = await addConnection(fd);
              if (res.ok) { setOpen(false); window.location.reload(); }
              else alert(res.error);
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Kanál</label>
            <select name="channel" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-navy">
              <option value="booking_com">Booking.com</option>
              <option value="airbnb">Airbnb</option>
              <option value="other">Jiný</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">iCal URL</label>
            <input
              type="url"
              name="icalUrl"
              required
              placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-navy font-mono"
            />
            <p className="text-xs text-slate-400 mt-1">
              Booking.com: Extranet → Kalendář → Sync → iCal URL
            </p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Popis (volitelný)</label>
            <input
              type="text"
              name="label"
              placeholder="např. Booking.com – Suite 9"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-navy"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 text-sm bg-navy text-white rounded hover:bg-navy/90 disabled:opacity-50"
            >
              {pending ? 'Ukládám...' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConnectionActions({ connectionId, syncEnabled }: { connectionId: string; syncEnabled: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      await fetch('/api/admin/ical/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });
      window.location.reload();
    });
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleConnection(connectionId, !syncEnabled);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!confirm('Smazat napojení a všechny importované blokace?')) return;
    startTransition(async () => {
      await deleteConnection(connectionId);
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={handleSync}
        disabled={pending}
        className="text-xs text-sky-600 hover:text-sky-800 disabled:opacity-40"
      >
        Sync
      </button>
      <span className="text-slate-200">|</span>
      <button
        onClick={handleToggle}
        disabled={pending}
        className="text-xs text-slate-500 hover:text-navy disabled:opacity-40"
      >
        {syncEnabled ? 'Vypnout' : 'Zapnout'}
      </button>
      <span className="text-slate-200">|</span>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
      >
        Smazat
      </button>
    </div>
  );
}

export { SyncAllButton, AddConnectionButton, ConnectionActions };
