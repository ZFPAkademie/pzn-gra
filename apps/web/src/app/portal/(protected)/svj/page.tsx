import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';

type SvjPostType = 'announcement' | 'discussion' | 'poll' | 'document';

interface SvjPost {
  id: string;
  title: string;
  content: string | null;
  type: SvjPostType;
  is_pinned: boolean;
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
    .select('id, title, content, type, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const typedPosts = (posts ?? []) as SvjPost[];

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">SVJ — Nástěnka</h1>
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
            return (
              <div
                key={post.id}
                className={`bg-white border rounded-sm p-6 ${post.is_pinned ? 'border-[#C9A24D]/40' : 'border-[#0B1626]/10'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
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
                <h2 className="text-[#0B1626] font-light text-base mb-2">{post.title}</h2>
                {post.content && (
                  <p className="text-[#0B1626]/60 font-light text-sm leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
