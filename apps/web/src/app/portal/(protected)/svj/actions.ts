'use server';

/**
 * Portal SVJ — server actions pro komentáře, hlasování a dokumenty.
 * Pattern DB-01: admin client + manuální ownership check (requireOwner).
 */

import { revalidatePath } from 'next/cache';
import { requireOwner, createSupabaseAdminClient } from '@/lib/supabase-server';

const MAX_COMMENT_LENGTH = 2000;

export async function addSvjComment(postId: string, content: string) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const trimmed = (content ?? '').trim();
  if (!trimmed) return { ok: false as const, error: 'Komentář nemůže být prázdný' };
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { ok: false as const, error: `Komentář je příliš dlouhý (max ${MAX_COMMENT_LENGTH} znaků)` };
  }

  const admin = createSupabaseAdminClient();

  const { data: post } = await admin
    .from('svj_posts')
    .select('id, archived_at')
    .eq('id', postId)
    .maybeSingle();

  if (!post || post.archived_at) return { ok: false as const, error: 'Příspěvek neexistuje' };

  const { error } = await admin.from('svj_comments').insert({
    post_id: postId,
    author_id: auth.ownerId,
    content: trimmed,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/portal/svj/${postId}`);
  revalidatePath('/portal/svj');
  return { ok: true as const };
}

export async function deleteOwnSvjComment(commentId: string) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const admin = createSupabaseAdminClient();

  const { data: comment } = await admin
    .from('svj_comments')
    .select('id, post_id, author_id')
    .eq('id', commentId)
    .maybeSingle();

  if (!comment) return { ok: false as const, error: 'Komentář neexistuje' };
  if (comment.author_id !== auth.ownerId) return { ok: false as const, error: 'Přístup odepřen' };

  const { error } = await admin.from('svj_comments').delete().eq('id', commentId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/portal/svj/${comment.post_id}`);
  revalidatePath('/portal/svj');
  return { ok: true as const };
}

export async function voteSvjPoll(postId: string, optionKey: string) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const admin = createSupabaseAdminClient();

  const { data: post } = await admin
    .from('svj_posts')
    .select('id, type, options, poll_deadline, archived_at')
    .eq('id', postId)
    .maybeSingle();

  if (!post || post.archived_at) return { ok: false as const, error: 'Hlasování neexistuje' };
  if (post.type !== 'poll') return { ok: false as const, error: 'Příspěvek není hlasování' };

  const options = (post.options ?? []) as { key: string; label: string }[];
  if (!options.some((o) => o.key === optionKey)) {
    return { ok: false as const, error: 'Neplatná možnost' };
  }

  if (post.poll_deadline && new Date(post.poll_deadline) < new Date()) {
    return { ok: false as const, error: 'Hlasování již bylo ukončeno' };
  }

  const { error } = await admin.from('svj_poll_votes').upsert(
    { post_id: postId, owner_id: auth.ownerId, option_key: optionKey },
    { onConflict: 'post_id,owner_id' }
  );

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/portal/svj/${postId}`);
  return { ok: true as const };
}

export async function getSvjDocumentUrl(documentId: string) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const admin = createSupabaseAdminClient();

  const { data: doc } = await admin
    .from('svj_documents')
    .select('id, file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc) return { ok: false as const, error: 'Dokument neexistuje' };

  const { data, error } = await admin.storage
    .from('dokumenty')
    .createSignedUrl(doc.file_path, 3600);

  if (error || !data?.signedUrl) return { ok: false as const, error: 'Odkaz se nepodařilo vytvořit' };
  return { ok: true as const, url: data.signedUrl };
}
