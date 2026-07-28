'use client';

import { useState, useTransition } from 'react';
import { getOwnerDocumentUrl } from './actions';

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OwnerDocumentRow({
  id,
  title,
  sizeBytes,
  createdAt,
}: {
  id: string;
  title: string;
  sizeBytes: number | null;
  createdAt: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleOpen() {
    setError('');
    startTransition(async () => {
      const result = await getOwnerDocumentUrl(id);
      if (!result.ok || !result.url) {
        setError(result.error ?? 'Dokument se nepodařilo otevřít');
        return;
      }
      window.open(result.url, '_blank', 'noopener');
    });
  }

  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[#0B1626] font-light text-sm truncate">{title}</p>
        <p className="text-[#0B1626]/30 text-xs mt-0.5">
          {formatDate(createdAt)}
          {sizeBytes ? ` · ${formatSize(sizeBytes)}` : ''}
        </p>
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      </div>
      <button
        onClick={handleOpen}
        disabled={isPending}
        className="shrink-0 px-3 py-1.5 border border-[#0B1626]/20 text-xs text-[#0B1626] font-light hover:border-[#C9A24D] hover:text-[#C9A24D] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Otevírám…' : 'Otevřít'}
      </button>
    </div>
  );
}
