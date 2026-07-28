'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  createOwnerDocUploadUrl,
  saveOwnerDocument,
  updateOwnerDocument,
  deleteOwnerDocument,
  getOwnerDocumentUrlAdmin,
} from './actions';

const categoryLabels: Record<string, string> = {
  purchase_contract: 'Kupní smlouva',
  handover_protocol: 'Předávací protokol',
  insurance: 'Pojištění',
  other: 'Ostatní',
};

export interface OwnerOption {
  id: string;
  name: string;
  apartments: { id: string; label: string }[];
}

export interface OwnerDocItem {
  id: string;
  owner_id: string;
  category: string;
  title: string;
  file_size_bytes: number | null;
  created_at: string;
  ownerName: string;
  apartmentLabel: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadOwnerDocForm({ owners }: { owners: OwnerOption[] }) {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? '');
  const [apartmentId, setApartmentId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const selectedOwner = owners.find((o) => o.id === ownerId);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !ownerId) { setError('Vyberte majitele a soubor'); return; }
    setError('');
    setUploading(true);
    try {
      const urlResult = await createOwnerDocUploadUrl(ownerId, file.name);
      if (!urlResult.ok) { setError(urlResult.error ?? 'Chyba'); return; }

      // Upload přímo z prohlížeče do Storage (FILE-01 — Vercel 4.5MB limit)
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from('dokumenty')
        .uploadToSignedUrl(urlResult.path, urlResult.token, file);
      if (uploadError) { setError('Upload selhal: ' + uploadError.message); return; }

      const saveResult = await saveOwnerDocument({
        ownerId,
        apartmentId: apartmentId || null,
        path: urlResult.path,
        title: title.trim() || file.name,
        category,
        sizeBytes: file.size,
        mimeType: file.type || null,
      });
      if (!saveResult.ok) { setError(saveResult.error ?? 'Chyba'); return; }

      setFile(null);
      setTitle('');
      setCategory('other');
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="bg-white border border-stone p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Majitel *</label>
        <select
          value={ownerId}
          onChange={(e) => { setOwnerId(e.target.value); setApartmentId(''); }}
          className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
        >
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Apartmán (volitelné)</label>
        <select
          value={apartmentId}
          onChange={(e) => setApartmentId(e.target.value)}
          className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
        >
          <option value="">—</option>
          {(selectedOwner?.apartments ?? []).map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Kategorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
        >
          <option value="purchase_contract">Kupní smlouva</option>
          <option value="handover_protocol">Předávací protokol</option>
          <option value="insurance">Pojištění</option>
          <option value="other">Ostatní</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Soubor *</label>
        <input
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
          }}
          className="w-full text-xs text-slate-600 file:mr-2 file:px-3 file:py-1.5 file:border file:border-stone file:bg-white file:text-navy file:text-xs"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Název</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kupní smlouva — Suite 9"
          className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={uploading || !file || !ownerId}
          className="px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 disabled:opacity-40 w-full md:w-auto"
        >
          {uploading ? 'Nahrávám…' : 'Nahrát dokument'}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs md:col-span-3">{error}</p>}
    </form>
  );
}

export function OwnerDocCard({ doc }: { doc: OwnerDocItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category);

  function handleSave() {
    setError('');
    startTransition(async () => {
      const result = await updateOwnerDocument(doc.id, { title, category });
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setEditing(false);
      router.refresh();
    });
  }

  function handleOpen() {
    setError('');
    startTransition(async () => {
      const result = await getOwnerDocumentUrlAdmin(doc.id);
      if (!result.ok || !result.url) { setError(result.error ?? 'Chyba'); return; }
      window.open(result.url, '_blank', 'noopener');
    });
  }

  function handleDelete() {
    if (!confirm(`Smazat dokument "${doc.title}"? Soubor bude odstraněn.`)) return;
    startTransition(async () => {
      const result = await deleteOwnerDocument(doc.id);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
        >
          <option value="purchase_contract">Kupní smlouva</option>
          <option value="handover_protocol">Předávací protokol</option>
          <option value="insurance">Pojištění</option>
          <option value="other">Ostatní</option>
        </select>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-3 py-1.5 bg-navy text-white text-xs font-light hover:bg-navy/90 disabled:opacity-50"
          >
            Uložit
          </button>
          <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-navy">
            Zrušit
          </button>
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-navy font-light truncate">{doc.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {categoryLabels[doc.category] ?? doc.category}
          {doc.apartmentLabel ? ` · ${doc.apartmentLabel}` : ''}
          {' · '}{formatDate(doc.created_at)}
          {doc.file_size_bytes ? ` · ${formatSize(doc.file_size_bytes)}` : ''}
        </p>
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleOpen}
          disabled={isPending}
          className="text-xs text-slate-400 hover:text-navy disabled:opacity-50"
        >
          Otevřít
        </button>
        <button
          onClick={() => setEditing(true)}
          disabled={isPending}
          className="text-xs text-slate-400 hover:text-navy disabled:opacity-50"
        >
          Upravit
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
        >
          Smazat
        </button>
      </div>
    </div>
  );
}
