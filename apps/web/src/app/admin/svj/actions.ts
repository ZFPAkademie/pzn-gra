'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function createSvjPost(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const type = formData.get('type') as string;
  const isPinned = formData.get('is_pinned') === 'true';

  if (!title) return { ok: false, error: 'Název je povinný' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('svj_posts').insert({
    title,
    content: content || null,
    type: type || 'announcement',
    is_pinned: isPinned,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/svj');
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
  revalidatePath('/admin/svj');
  return { ok: true };
}

export async function deleteSvjPost(postId: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('svj_posts').delete().eq('id', postId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/svj');
  return { ok: true };
}
