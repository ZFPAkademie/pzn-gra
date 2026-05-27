'use client';

import { useState, useTransition } from 'react';
import { createSvjPost, toggleSvjPin, deleteSvjPost } from './actions';

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
          <select name="type" className="w-full border border-stone px-3 py-2 text-sm text-navy focus:outline-none focus:border-gold">
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

export function PostCard({ post }: { post: { id: string; title: string; content: string | null; type: string; is_pinned: boolean; created_at: string } }) {
  const [isPending, startTransition] = useTransition();

  function handlePin() {
    startTransition(async () => { await toggleSvjPin(post.id, !post.is_pinned); });
  }

  function handleDelete() {
    if (!confirm(`Smazat příspěvek "${post.title}"?`)) return;
    startTransition(async () => { await deleteSvjPost(post.id); });
  }

  return (
    <div className={`bg-white border rounded-sm p-5 ${post.is_pinned ? 'border-gold/40' : 'border-stone'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
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
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
