import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type SvjPostType = 'announcement' | 'discussion' | 'poll' | 'document';

interface SvjPost {
  id: string;
  title: string;
  content: string | null;
  type: SvjPostType;
  is_pinned: boolean;
  poll_deadline: string | null;
  created_at: string;
}

const typeBadge: Record<SvjPostType, { label: string; className: string }> = {
  announcement: { label: 'Oznámení', className: 'bg-blue-50 text-blue-700' },
  discussion: { label: 'Diskuze', className: 'bg-green-50 text-green-700' },
  poll: { label: 'Hlasování', className: 'bg-yellow-50 text-yellow-700' },
  document: { label: 'Dokument', className: 'bg-[#0B1626]/5 text-[#0B1626]/60' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function SvjPage() {
  const user = await getServerUser();
  if (!user) redirect('/portal/login');

  const admin = createSupabaseAdminClient();

  const { data: owner } = await admin
    .from('owners')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!owner) redirect('/portal/login?error=no_access');

  const { data: posts } = await admin
    .from('svj_posts')
    .select('id, title, content, type, is_pinned, poll_deadline, created_at')
    .is('archived_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const typedPosts = (posts ?? []) as SvjPost[];

  // Počty komentářů per post
  const { data: commentRows } = await admin
    .from('svj_comments')
    .select('post_id')
    .in('post_id', typedPosts.map((p) => p.id));

  const commentCounts = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">SVJ — Nástěnka</h1>
      </div>

      {/* Sub-navigace: Nástěnka | Dokumenty */}
      <div className="flex gap-2 mb-8">
        <span className="px-4 py-2 bg-[#0B1626] text-white text-sm font-light rounded-sm">Nástěnka</span>
        <Link
          href="/portal/svj/dokumenty"
          className="px-4 py-2 border border-[#0B1626]/20 text-sm text-[#0B1626] font-light rounded-sm hover:border-[#0B1626] transition-colors"
        >
          Dokumenty
        </Link>
      </div>

      {typedPosts.length === 0 ? (
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light">Zatím žádné příspěvky.</p>
          <p className="text-[#0B1626]/30 text-sm mt-2">Správce zde bude zveřejňovat informace.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {typedPosts.map((post) => {
            const badge = typeBadge[post.type] ?? typeBadge.announcement;
            const comments = commentCounts.get(post.id) ?? 0;
            const deadlinePassed = post.poll_deadline && new Date(post.poll_deadline) < new Date();
            return (
              <Link
                key={post.id}
                href={`/portal/svj/${post.id}`}
                className={`block bg-white border rounded-sm p-6 transition-colors hover:border-[#C9A24D]/60 ${post.is_pinned ? 'border-[#C9A24D]/40' : 'border-[#0B1626]/10'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {post.is_pinned && (
                      <span className="text-[#C9A24D] text-xs tracking-wider uppercase">Připnuto</span>
                    )}
                    <span className={`text-xs tracking-wider uppercase px-2 py-0.5 rounded-sm ${badge.className}`}>
                      {badge.label}
                    </span>
                    {post.type === 'poll' && (
                      <span className={`text-xs ${deadlinePassed ? 'text-[#0B1626]/30' : 'text-green-700'}`}>
                        {deadlinePassed ? 'Ukončeno' : 'Probíhá'}
                      </span>
                    )}
                  </div>
                  <span className="text-[#0B1626]/30 text-xs whitespace-nowrap">{formatDate(post.created_at)}</span>
                </div>
                <h2 className="text-[#0B1626] font-light text-base mb-2">{post.title}</h2>
                {post.content && (
                  <p className="text-[#0B1626]/60 font-light text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                    {post.content}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-[#0B1626]/40">
                  <span>
                    {comments === 0
                      ? 'Bez komentářů'
                      : comments === 1
                        ? '1 komentář'
                        : comments < 5
                          ? `${comments} komentáře`
                          : `${comments} komentářů`}
                  </span>
                  <span className="text-[#C9A24D]">Otevřít →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
