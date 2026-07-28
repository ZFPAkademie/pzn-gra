'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addSvjComment, deleteOwnSvjComment } from '../actions';

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  isMine: boolean;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function CommentsSection({ postId, comments }: { postId: string; comments: CommentItem[] }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await addSvjComment(postId, content);
      if (!result.ok) { setError(result.error ?? 'Komentář se nepodařilo přidat'); return; }
      setContent('');
      router.refresh();
    });
  }

  function handleDelete(commentId: string) {
    if (!confirm('Smazat váš komentář?')) return;
    startTransition(async () => {
      const result = await deleteOwnSvjComment(commentId);
      if (!result.ok) { setError(result.error ?? 'Komentář se nepodařilo smazat'); return; }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 bg-white border border-[#0B1626]/10 rounded-sm p-6 md:p-8">
      <h2 className="text-[#0B1626] font-light text-base mb-5 pb-3 border-b border-[#0B1626]/10">
        Komentáře
      </h2>

      {comments.length === 0 ? (
        <p className="text-[#0B1626]/40 font-light text-sm mb-6">Zatím žádné komentáře.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-[#0B1626]/5 pb-4 last:border-0">
              <div className="flex items-center justify-between gap-4 mb-1">
                <p className="text-[#0B1626] text-sm font-light">
                  {comment.authorName}
                  {comment.isMine && <span className="text-[#C9A24D] text-xs ml-2">Vy</span>}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[#0B1626]/30 text-xs">{formatDateTime(comment.createdAt)}</span>
                  {comment.isMine && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={isPending}
                      className="text-red-400 hover:text-red-600 text-xs disabled:opacity-50"
                    >
                      Smazat
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[#0B1626]/60 font-light text-sm whitespace-pre-line">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Napište komentář…"
          className="w-full border border-[#0B1626]/15 rounded-sm px-3 py-2 text-sm text-[#0B1626] font-light focus:outline-none focus:border-[#C9A24D] resize-none"
        />
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="mt-2 px-4 py-2 bg-[#0B1626] text-white text-sm font-light hover:bg-[#0B1626]/90 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Odesílám…' : 'Přidat komentář'}
        </button>
      </form>
    </div>
  );
}
