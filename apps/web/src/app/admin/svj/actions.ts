'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * Anketa: options textarea "jedna možnost na řádek" → [{key, label}].
 * Klíče jsou pozičně stabilní (opt-1, opt-2, …) — hlasy v svj_poll_votes
 * odkazují na key, proto po prvním hlasu už options needitujeme.
 */
function parsePollOptions(raw: string | null): { key: string; label: string }[] | null {
  if (!raw) return null;
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  return lines.map((label, i) => ({ key: `opt-${i + 1}`, label }));
}

/** Deadline = konec dne v CET; +01:00 zajistí, že hlasování nikdy neskončí dřív než o půlnoci. */
function parsePollDeadline(raw: string | null): string | null {
  if (!raw) return null;
  return new Date(`${raw}T23:59:59+01:00`).toISOString();
}

function revalidateSvj() {
  revalidatePath('/admin/svj');
  revalidatePath('/portal/svj');
}

export async function createSvjPost(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const type = (formData.get('type') as string) || 'announcement';
  const isPinned = formData.get('is_pinned') === 'true';

  if (!title) return { ok: false, error: 'Název je povinný' };

  let options: { key: string; label: string }[] | null = null;
  let pollDeadline: string | null = null;
  if (type === 'poll') {
    options = parsePollOptions(formData.get('poll_options') as string);
    if (!options) return { ok: false, error: 'Anketa potřebuje alespoň 2 možnosti (jedna na řádek)' };
    pollDeadline = parsePollDeadline(formData.get('poll_deadline') as string);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('svj_posts').insert({
    title,
    content: content || null,
    type,
    is_pinned: isPinned,
    options,
    poll_deadline: pollDeadline,
  });

  if (error) return { ok: false, error: error.message };
  revalidateSvj();
  return { ok: true };
}

export async function updateSvjPost(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const postId = formData.get('post_id') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!postId) return { ok: false, error: 'Chybí ID příspěvku' };
  if (!title) return { ok: false, error: 'Název je povinný' };

  const supabase = createSupabaseAdminClient();

  const { data: post } = await supabase
    .from('svj_posts')
    .select('id, type')
    .eq('id', postId)
    .maybeSingle();
  if (!post) return { ok: false, error: 'Příspěvek neexistuje' };

  const update: Record<string, unknown> = {
    title,
    content: content || null,
    updated_at: new Date().toISOString(),
  };

  if (post.type === 'poll') {
    const deadlineRaw = formData.get('poll_deadline') as string;
    update.poll_deadline = parsePollDeadline(deadlineRaw);

    const optionsRaw = formData.get('poll_options') as string;
    if (optionsRaw !== null) {
      const { count } = await supabase
        .from('svj_poll_votes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);

      const options = parsePollOptions(optionsRaw);
      if (!options) return { ok: false, error: 'Anketa potřebuje alespoň 2 možnosti (jedna na řádek)' };

      if ((count ?? 0) > 0) {
        // Po prvním hlasu options neměníme — hlasy odkazují na klíče možností
        const { data: current } = await supabase
          .from('svj_posts').select('options').eq('id', postId).single();
        const currentLabels = ((current?.options ?? []) as { label: string }[]).map((o) => o.label).join('\n');
        if (currentLabels !== options.map((o) => o.label).join('\n')) {
          return { ok: false, error: 'Možnosti nelze měnit — anketa už má hlasy' };
        }
      } else {
        update.options = options;
      }
    }
  }

  const { error } = await supabase.from('svj_posts').update(update).eq('id', postId);

  if (error) return { ok: false, error: error.message };
  revalidateSvj();
  return { ok: true };
}

export async function toggleSvjPin(postId: string, isPinned: boolean) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('svj_posts')
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) return { ok: false, error: error.message };
  revalidateSvj();
  return { ok: true };
}

/** Soft delete (APP-02) — komentáře a hlasy zůstávají zachované pro historii. */
export async function deleteSvjPost(postId: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('svj_posts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) return { ok: false, error: error.message };
  revalidateSvj();
  return { ok: true };
}

export async function deleteSvjCommentAdmin(commentId: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('svj_comments').delete().eq('id', commentId);

  if (error) return { ok: false, error: error.message };
  revalidateSvj();
  return { ok: true };
}

// ── SVJ dokumenty — upload přímo z prohlížeče do Storage (FILE-01) ──

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export async function createSvjDocUploadUrl(fileName: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!fileName) return { ok: false as const, error: 'Chybí název souboru' };

  const path = `svj/${Date.now()}-${sanitizeFileName(fileName)}`;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from('dokumenty')
    .createSignedUploadUrl(path);

  if (error || !data) return { ok: false as const, error: 'Upload URL se nepodařilo vytvořit' };
  return { ok: true as const, path: data.path, token: data.token };
}

export async function saveSvjDocument(input: {
  path: string;
  title: string;
  category: string;
  sizeBytes: number | null;
  mimeType: string | null;
}) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!input.title) return { ok: false as const, error: 'Název je povinný' };
  if (!input.path?.startsWith('svj/')) return { ok: false as const, error: 'Neplatná cesta souboru' };

  const category = ['stanovy', 'zapisy', 'finance', 'other'].includes(input.category)
    ? input.category
    : 'other';

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('svj_documents').insert({
    category,
    title: input.title,
    file_path: input.path,
    file_size_bytes: input.sizeBytes,
    mime_type: input.mimeType,
    is_admin_upload: true,
  });

  if (error) {
    // Cleanup — bez DB záznamu by soubor zůstal ve Storage navždy
    await supabase.storage.from('dokumenty').remove([input.path]);
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/admin/svj');
  revalidatePath('/portal/svj/dokumenty');
  return { ok: true as const };
}

export async function updateSvjDocument(documentId: string, input: { title: string; category: string }) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!input.title?.trim()) return { ok: false as const, error: 'Název je povinný' };

  const category = ['stanovy', 'zapisy', 'finance', 'other'].includes(input.category)
    ? input.category
    : 'other';

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('svj_documents')
    .update({ title: input.title.trim(), category })
    .eq('id', documentId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/admin/svj');
  revalidatePath('/portal/svj/dokumenty');
  return { ok: true as const };
}

export async function deleteSvjDocument(documentId: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { data: doc } = await supabase
    .from('svj_documents')
    .select('id, file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc) return { ok: false as const, error: 'Dokument neexistuje' };

  const { error } = await supabase.from('svj_documents').delete().eq('id', documentId);
  if (error) return { ok: false as const, error: error.message };

  // Storage cleanup — případné selhání neblokuje (řádek už je pryč)
  await supabase.storage.from('dokumenty').remove([doc.file_path]);

  revalidatePath('/admin/svj');
  revalidatePath('/portal/svj/dokumenty');
  return { ok: true as const };
}

export async function getSvjDocumentUrlAdmin(documentId: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { data: doc } = await supabase
    .from('svj_documents')
    .select('id, file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc) return { ok: false as const, error: 'Dokument neexistuje' };

  const { data, error } = await supabase.storage
    .from('dokumenty')
    .createSignedUrl(doc.file_path, 3600);

  if (error || !data?.signedUrl) return { ok: false as const, error: 'Odkaz se nepodařilo vytvořit' };
  return { ok: true as const, url: data.signedUrl };
}
