/**
 * Admin SVJ — správa nástěnky pro všechny majitele
 * /admin/svj
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { AddPostForm, PostCard, DocumentsSection } from './svj-client';
import type { AdminComment } from './svj-client';

export const dynamic = 'force-dynamic';

export default async function AdminSvjPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const { data: posts } = await supabase
    .from('svj_posts')
    .select('id, title, content, type, is_pinned, options, poll_deadline, created_at')
    .is('archived_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const postIds = (posts ?? []).map(p => p.id);

  // Komentáře s autory + hlasy — paralelně
  const [commentsRes, votesRes, documentsRes] = await Promise.all([
    postIds.length
      ? supabase
          .from('svj_comments')
          .select('id, post_id, content, created_at, owners(name)')
          .in('post_id', postIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    postIds.length
      ? supabase.from('svj_poll_votes').select('post_id, option_key').in('post_id', postIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from('svj_documents')
      .select('id, category, title, file_size_bytes, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const commentsByPost = new Map<string, AdminComment[]>();
  for (const c of (commentsRes.data ?? []) as {
    id: string; post_id: string; content: string; created_at: string; owners: { name: string | null } | null;
  }[]) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      authorName: c.owners?.name ?? 'Vlastník',
    });
    commentsByPost.set(c.post_id, list);
  }

  const votesByPost = new Map<string, Record<string, number>>();
  for (const v of (votesRes.data ?? []) as { post_id: string; option_key: string }[]) {
    const counts = votesByPost.get(v.post_id) ?? {};
    counts[v.option_key] = (counts[v.option_key] ?? 0) + 1;
    votesByPost.set(v.post_id, counts);
  }

  const pinned = (posts ?? []).filter(p => p.is_pinned);
  const regular = (posts ?? []).filter(p => !p.is_pinned);

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy tracking-wide">SVJ — Nástěnka</h1>
            <p className="text-sm text-slate-500 mt-1">
              Příspěvky vidí všichni majitelé v klientském portálu.
            </p>
          </div>
          <AddPostForm />
        </div>

        {pinned.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Připnuté</p>
            <div className="space-y-3">
              {pinned.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={commentsByPost.get(post.id) ?? []}
                  voteCounts={votesByPost.get(post.id) ?? {}}
                />
              ))}
            </div>
          </div>
        )}

        {regular.length > 0 && (
          <div>
            {pinned.length > 0 && (
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 mt-6">Ostatní</p>
            )}
            <div className="space-y-3">
              {regular.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={commentsByPost.get(post.id) ?? []}
                  voteCounts={votesByPost.get(post.id) ?? {}}
                />
              ))}
            </div>
          </div>
        )}

        {(posts ?? []).length === 0 && (
          <div className="bg-white border border-stone p-8 text-center text-sm text-slate-400">
            Zatím žádné příspěvky. Klikněte na "Přidat příspěvek" výše.
          </div>
        )}

        <DocumentsSection documents={documentsRes.data ?? []} />

        {/* Spacer pro mobilní bottom tab bar */}
        <div className="h-14 md:hidden" />
      </main>
    </div>
  );
}
