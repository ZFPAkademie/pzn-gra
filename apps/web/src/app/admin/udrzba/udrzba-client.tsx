'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMaintenanceStatus, updateMaintenanceNote } from './actions';

const statusOptions = [
  { value: 'pending', label: 'Čeká' },
  { value: 'in_progress', label: 'V řešení' },
  { value: 'resolved', label: 'Vyřešeno' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

export interface MaintenanceItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  admin_note: string | null;
  created_at: string;
  ownerName: string;
  apartmentLabel: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MaintenanceCard({ item }: { item: MaintenanceItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(item.admin_note ?? '');
  const [error, setError] = useState('');

  function handleStatus(status: string) {
    if (status === item.status) return;
    setError('');
    startTransition(async () => {
      const result = await updateMaintenanceStatus(item.id, status);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      router.refresh();
    });
  }

  function handleSaveNote() {
    setError('');
    startTransition(async () => {
      const result = await updateMaintenanceNote(item.id, note);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setNoteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-stone rounded-sm p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {item.priority === 'urgent' && (
              <span className="text-xs text-red-600 tracking-wider uppercase">Urgentní</span>
            )}
            <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
            <span className="text-xs text-slate-500">{item.ownerName}</span>
            <span className="text-xs text-slate-400">{item.apartmentLabel}</span>
          </div>
          <h3 className="text-navy font-light text-base">{item.title}</h3>
          {item.description && (
            <p className="text-slate-500 text-sm mt-1 whitespace-pre-line">{item.description}</p>
          )}

          {item.admin_note && !noteOpen && (
            <p className="text-xs text-slate-500 mt-2 border-t border-stone pt-2 whitespace-pre-line">
              <span className="text-slate-400 uppercase tracking-wider">Poznámka: </span>
              {item.admin_note}
            </p>
          )}

          {noteOpen && (
            <div className="mt-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Vyjádření pro majitele…"
                className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleSaveNote}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-navy text-white text-xs font-light hover:bg-navy/90 disabled:opacity-50"
                >
                  Uložit poznámku
                </button>
                <button
                  onClick={() => setNoteOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-navy"
                >
                  Zrušit
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </div>

        <div className="shrink-0 space-y-2">
          {/* Inline status chips — auto-save */}
          <div className="flex gap-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatus(opt.value)}
                disabled={isPending}
                className={`text-xs px-2 py-1 rounded-full transition-colors disabled:opacity-50 ${
                  item.status === opt.value
                    ? statusColors[opt.value]
                    : 'bg-white border border-stone text-slate-400 hover:text-navy'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {!noteOpen && (
            <button
              onClick={() => setNoteOpen(true)}
              className="text-xs text-slate-400 hover:text-navy block ml-auto"
            >
              {item.admin_note ? 'Upravit poznámku' : 'Přidat poznámku'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
