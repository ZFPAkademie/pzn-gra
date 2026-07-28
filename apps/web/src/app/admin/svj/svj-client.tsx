'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  createSvjPost,
  toggleSvjPin,
  deleteSvjPost,
  updateSvjPost,
  deleteSvjCommentAdmin,
  createSvjDocUploadUrl,
  saveSvjDocument,
  updateSvjDocument,
  deleteSvjDocument,
  getSvjDocumentUrlAdmin,
} from './actions';

const typeLabels: Record<string, string> = {
  announcement: 'Oznámení',
  discussion: 'Diskuze',
  poll: 'Hlasování',
  document: 'Dokument',
};

const typeColors: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-700',
  discussion: 'bg-green-100 text-green-700',
  poll: 'bg-amber-100 text-amber-700',
  document: 'bg-stone text-slate-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function AddPostForm() {
  const [open, setOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [type, setType] = useState('announcement');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('is_pinned', isPinned ? 'true' : 'false');
    startTransition(async () => {
      const result = await createSvjPost(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setOpen(false);
      setIsPinned(false);
      setType('announcement');
      (e.target as HTMLFormElement).reset();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-navy text-white text-sm font-light tracking-wide hover:bg-navy/90 transition-colors">
        Přidat příspěvek
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone p-6 space-y-4 mb-6">
      <h3 className="text-sm font-medium text-navy">Nový příspěvek na nástěnku</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Nadpis *</label>
          <input name="title" required placeholder="Schůze SVJ — 15. června 2026" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Typ</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
          >
            <option value="announcement">Oznámení</option>
            <option value="discussion">Diskuze</option>
            <option value="poll">Hlasování</option>
            <option value="document">Dokument</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`w-8 h-4 rounded-full transition-colors relative ${isPinned ? 'bg-gold' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${isPinned ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-xs text-slate-500">Připnout nahoře</span>
          </label>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Obsah</label>
          <textarea
            name="content"
            rows={4}
            placeholder="Text příspěvku..."
            className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none"
          />
        </div>

        {type === 'poll' && (
          <>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Možnosti hlasování * (jedna na řádek)</label>
              <textarea
                name="poll_options"
                rows={3}
                placeholder={'Ano\nNe\nZdržuji se'}
                className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hlasovat do (volitelné)</label>
              <input
                type="date"
                name="poll_deadline"
                className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
              />
            </div>
          </>
        )}
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 disabled:opacity-50">
          {isPending ? 'Publikuji…' : 'Publikovat'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-navy">Zrušit</button>
      </div>
    </form>
  );
}

export interface AdminPost {
  id: string;
  title: string;
  content: string | null;
  type: string;
  is_pinned: boolean;
  options: { key: string; label: string }[] | null;
  poll_deadline: string | null;
  created_at: string;
}

export interface AdminComment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
}

export function PostCard({
  post,
  comments,
  voteCounts,
}: {
  post: AdminPost;
  comments: AdminComment[];
  voteCounts: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState('');

  const totalVotes = Object.values(voteCounts).reduce((s, n) => s + n, 0);

  function handlePin() {
    startTransition(async () => { await toggleSvjPin(post.id, !post.is_pinned); });
  }

  function handleDelete() {
    if (!confirm(`Smazat příspěvek "${post.title}"? Zmizí z nástěnky, komentáře a hlasy zůstanou v databázi.`)) return;
    startTransition(async () => { await deleteSvjPost(post.id); });
  }

  function handleDeleteComment(commentId: string) {
    if (!confirm('Smazat tento komentář?')) return;
    startTransition(async () => {
      const result = await deleteSvjCommentAdmin(commentId);
      if (!result.ok) setError(result.error ?? 'Chyba');
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('post_id', post.id);
    startTransition(async () => {
      const result = await updateSvjPost(fd);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleUpdate} className="bg-white border border-gold/40 rounded-sm p-5 space-y-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Nadpis *</label>
          <input
            name="title"
            required
            defaultValue={post.title}
            className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Obsah</label>
          <textarea
            name="content"
            rows={4}
            defaultValue={post.content ?? ''}
            className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none"
          />
        </div>
        {post.type === 'poll' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">
                Možnosti (jedna na řádek){totalVotes > 0 ? ' — nelze měnit, anketa už má hlasy' : ''}
              </label>
              <textarea
                name="poll_options"
                rows={3}
                readOnly={totalVotes > 0}
                defaultValue={(post.options ?? []).map((o) => o.label).join('\n')}
                className={`w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold resize-none ${totalVotes > 0 ? 'bg-stone/50 text-slate-400' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hlasovat do</label>
              <input
                type="date"
                name="poll_deadline"
                defaultValue={post.poll_deadline ? post.poll_deadline.slice(0, 10) : ''}
                className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
              />
            </div>
          </div>
        )}
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={isPending} className="px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 disabled:opacity-50">
            {isPending ? 'Ukládám…' : 'Uložit'}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-navy">
            Zrušit
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`bg-white border rounded-sm p-5 ${post.is_pinned ? 'border-gold/40' : 'border-stone'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {post.is_pinned && (
              <span className="text-xs text-gold tracking-wider uppercase">Připnuto</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[post.type] ?? ''}`}>
              {typeLabels[post.type] ?? post.type}
            </span>
            <span className="text-xs text-slate-400">{formatDate(post.created_at)}</span>
          </div>
          <h3 className="text-navy font-light text-base">{post.title}</h3>
          {post.content && (
            <p className="text-slate-500 text-sm mt-1 line-clamp-2 whitespace-pre-line">{post.content}</p>
          )}

          {post.type === 'poll' && (post.options ?? []).length > 0 && (
            <div className="mt-3 space-y-1">
              {(post.options ?? []).map((option) => {
                const count = voteCounts[option.key] ?? 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={option.key} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 w-40 truncate">{option.label}</span>
                    <div className="flex-1 h-1.5 bg-stone rounded-full overflow-hidden max-w-[160px]">
                      <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-400 whitespace-nowrap">{count} ({pct} %)</span>
                  </div>
                );
              })}
              <p className="text-xs text-slate-400 mt-1">
                Celkem hlasů: {totalVotes}
                {post.poll_deadline && ` · do ${formatDate(post.poll_deadline)}`}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowComments((v) => !v)}
            className="mt-3 text-xs text-slate-400 hover:text-navy"
          >
            Komentáře ({comments.length}) {showComments ? '▴' : '▾'}
          </button>

          {showComments && (
            <div className="mt-2 space-y-2 border-t border-stone pt-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400">Žádné komentáře.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-navy">{comment.authorName}
                        <span className="text-slate-400 ml-2">{formatDate(comment.createdAt)}</span>
                      </p>
                      <p className="text-xs text-slate-500 whitespace-pre-line">{comment.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={isPending}
                      className="text-xs text-red-400 hover:text-red-600 shrink-0 disabled:opacity-50"
                    >
                      Smazat
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
          {error && !editing && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setEditing(true)}
            disabled={isPending}
            className="text-xs text-slate-400 hover:text-navy disabled:opacity-50"
          >
            Upravit
          </button>
          <button
            onClick={handlePin}
            disabled={isPending}
            className="text-xs text-slate-400 hover:text-gold disabled:opacity-50"
          >
            {post.is_pinned ? 'Odepnout' : 'Připnout'}
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
    </div>
  );
}

// ── SVJ dokumenty — admin správa ──

const docCategoryLabels: Record<string, string> = {
  stanovy: 'Stanovy',
  zapisy: 'Zápisy ze schůzí',
  finance: 'Finance',
  other: 'Ostatní',
};

export interface AdminSvjDocument {
  id: string;
  category: string;
  title: string;
  file_size_bytes: number | null;
  created_at: string;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsSection({ documents }: { documents: AdminSvjDocument[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) { setError('Vyberte soubor'); return; }
    setError('');
    setUploading(true);
    try {
      const urlResult = await createSvjDocUploadUrl(file.name);
      if (!urlResult.ok) { setError(urlResult.error ?? 'Chyba'); return; }

      // Upload přímo z prohlížeče do Storage (FILE-01 — Vercel 4.5MB limit)
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from('dokumenty')
        .uploadToSignedUrl(urlResult.path, urlResult.token, file);
      if (uploadError) { setError('Upload selhal: ' + uploadError.message); return; }

      const saveResult = await saveSvjDocument({
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

  function handleOpen(documentId: string) {
    startTransition(async () => {
      const result = await getSvjDocumentUrlAdmin(documentId);
      if (!result.ok || !result.url) { setError(result.error ?? 'Chyba'); return; }
      window.open(result.url, '_blank', 'noopener');
    });
  }

  function handleDeleteDoc(documentId: string, docTitle: string) {
    if (!confirm(`Smazat dokument "${docTitle}"? Soubor bude odstraněn.`)) return;
    startTransition(async () => {
      const result = await deleteSvjDocument(documentId);
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      router.refresh();
    });
  }

  return (
    <div className="mt-10">
      <div className="mb-4">
        <h2 className="text-xl font-light text-navy tracking-wide">SVJ — Dokumenty</h2>
        <p className="text-sm text-slate-500 mt-1">
          Stanovy, zápisy ze schůzí a další dokumenty viditelné všem majitelům.
        </p>
      </div>

      <form onSubmit={handleUpload} className="bg-white border border-stone p-5 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
            placeholder="Stanovy SVJ 2026"
            className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Kategorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold"
          >
            <option value="stanovy">Stanovy</option>
            <option value="zapisy">Zápisy ze schůzí</option>
            <option value="finance">Finance</option>
            <option value="other">Ostatní</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={uploading || !file}
          className="px-4 py-2 bg-navy text-white text-sm font-light hover:bg-navy/90 disabled:opacity-40"
        >
          {uploading ? 'Nahrávám…' : 'Nahrát dokument'}
        </button>
        {error && <p className="text-red-600 text-xs md:col-span-4">{error}</p>}
      </form>

      {documents.length === 0 ? (
        <div className="bg-white border border-stone p-6 text-center text-sm text-slate-400">
          Zatím žádné dokumenty.
        </div>
      ) : (
        <div className="bg-white border border-stone divide-y divide-stone">
          {documents.map((doc) => (
            <SvjDocRow
              key={doc.id}
              doc={doc}
              onOpen={() => handleOpen(doc.id)}
              onDelete={() => handleDeleteDoc(doc.id, doc.title)}
              busy={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SvjDocRow({
  doc,
  onOpen,
  onDelete,
  busy,
}: {
  doc: AdminSvjDocument;
  onOpen: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError('');
    startTransition(async () => {
      const result = await updateSvjDocument(doc.id, { title, category });
      if (!result.ok) { setError(result.error ?? 'Chyba'); return; }
      setEditing(false);
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
          <option value="stanovy">Stanovy</option>
          <option value="zapisy">Zápisy ze schůzí</option>
          <option value="finance">Finance</option>
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
          {docCategoryLabels[doc.category] ?? doc.category} · {formatDate(doc.created_at)}
          {doc.file_size_bytes ? ` · ${formatSize(doc.file_size_bytes)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={onOpen} disabled={busy} className="text-xs text-slate-400 hover:text-navy disabled:opacity-50">
          Otevřít
        </button>
        <button onClick={() => setEditing(true)} disabled={busy} className="text-xs text-slate-400 hover:text-navy disabled:opacity-50">
          Upravit
        </button>
        <button onClick={onDelete} disabled={busy} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
          Smazat
        </button>
      </div>
    </div>
  );
}
