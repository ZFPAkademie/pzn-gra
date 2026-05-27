/**
 * Admin SVJ — správa nástěnky pro všechny majitele
 * /admin/svj
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { AddPostForm, PostCard } from './svj-client';

export const dynamic = 'force-dynamic';

export default async function AdminSvjPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const { data: posts } = await supabase
    .from('svj_posts')
    .select('id, title, content, type, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

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
              {pinned.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          </div>
        )}

        {regular.length > 0 && (
          <div>
            {pinned.length > 0 && (
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 mt-6">Ostatní</p>
            )}
            <div className="space-y-3">
              {regular.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          </div>
        )}

        {(posts ?? []).length === 0 && (
          <div className="bg-white border border-stone p-8 text-center text-sm text-slate-400">
            Zatím žádné příspěvky. Klikněte na "Přidat příspěvek" výše.
          </div>
        )}
      </main>
    </div>
  );
}
