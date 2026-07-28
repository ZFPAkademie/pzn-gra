/**
 * Portal SVJ — detail příspěvku
 * /portal/svj/[id] — obsah, hlasování (poll), komentáře
 */

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';
import { PollSection } from './poll-client';
import { CommentsSection } from './comments-client';

export const dynamic = 'force-dynamic';

type SvjPostType = 'announcement' | 'discussion' | 'poll' | 'document';

const typeBadge: Record<SvjPostType, { label: string; className: string }> = {
  announcement: { label: 'Oznámení', className: 'bg-blue-50 text-blue-700' },
  discussion: { label: 'Diskuze', className: 'bg-green-50 text-green-700' },
  poll: { label: 'Hlasování', className: 'bg-yellow-50 text-yellow-700' },
  document: { label: 'Dokument', className: 'bg-[#0B1626]/5 text-[#0B1626]/60' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function SvjPostDetailPage({ params }: { params: { id: string } }) {
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

  const { data: post } = await admin
    .from('svj_posts')
    .select('id, title, content, type, is_pinned, options, poll_deadline, created_at, archived_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!post || post.archived_at) notFound();

  const badge = typeBadge[post.type as SvjPostType] ?? typeBadge.announcement;

  // Komentáře s autory (FK svj_comments.author_id → owners)
  const { data: comments } = await admin
    .from('svj_comments')
    .select('id, content, created_at, author_id, owners(name)')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  const commentItems = (comments ?? []).map((c) => ({
    id: c.id as string,
    content: c.content as string,
    createdAt: c.created_at as string,
    authorName: ((c.owners as { name: string | null } | null)?.name) ?? 'Vlastník',
    isMine: c.author_id === owner.id,
  }));

  // Hlasování — agregace hlasů (hlasy odděleně v svj_poll_votes)
  let pollData: {
    options: { key: string; label: string }[];
    counts: Record<string, number>;
    totalVotes: number;
    myVote: string | null;
  } | null = null;

  if (post.type === 'poll') {
    const { data: votes } = await admin
      .from('svj_poll_votes')
      .select('owner_id, option_key')
      .eq('post_id', post.id);

    const counts: Record<string, number> = {};
    let myVote: string | null = null;
    for (const v of votes ?? []) {
      counts[v.option_key] = (counts[v.option_key] ?? 0) + 1;
      if (v.owner_id === owner.id) myVote = v.option_key;
    }

    pollData = {
      options: (post.options ?? []) as { key: string; label: string }[],
      counts,
      totalVotes: (votes ?? []).length,
      myVote,
    };
  }

  return (
    <div>
      <Link href="/portal/svj" className="text-[#0B1626]/40 text-sm hover:text-[#0B1626] transition-colors">
        ← Zpět na nástěnku
      </Link>

      <div className="mt-6 bg-white border border-[#0B1626]/10 rounded-sm p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {post.is_pinned && (
              <span className="text-[#C9A24D] text-xs tracking-wider uppercase">Připnuto</span>
            )}
            <span className={`text-xs tracking-wider uppercase px-2 py-0.5 rounded-sm ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <span className="text-[#0B1626]/30 text-xs whitespace-nowrap">{formatDate(post.created_at)}</span>
        </div>

        <h1 className="text-[#0B1626] font-light text-2xl mb-4">{post.title}</h1>

        {post.content && (
          <p className="text-[#0B1626]/60 font-light text-sm leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        )}

        {pollData && (
          <PollSection
            postId={post.id}
            options={pollData.options}
            counts={pollData.counts}
            totalVotes={pollData.totalVotes}
            myVote={pollData.myVote}
            deadline={post.poll_deadline}
          />
        )}
      </div>

      <CommentsSection postId={post.id} comments={commentItems} />
    </div>
  );
}
