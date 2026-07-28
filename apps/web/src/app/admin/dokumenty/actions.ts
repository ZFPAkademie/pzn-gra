'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

const VALID_CATEGORIES = ['purchase_contract', 'handover_protocol', 'insurance', 'other'];

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export async function createOwnerDocUploadUrl(ownerId: string, fileName: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!ownerId || !fileName) return { ok: false as const, error: 'Chybí majitel nebo soubor' };

  const path = `owners/${ownerId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from('dokumenty')
    .createSignedUploadUrl(path);

  if (error || !data) return { ok: false as const, error: 'Upload URL se nepodařilo vytvořit' };
  return { ok: true as const, path: data.path, token: data.token };
}

export async function saveOwnerDocument(input: {
  ownerId: string;
  apartmentId: string | null;
  path: string;
  title: string;
  category: string;
  sizeBytes: number | null;
  mimeType: string | null;
}) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!input.title) return { ok: false as const, error: 'Název je povinný' };
  if (!input.path?.startsWith(`owners/${input.ownerId}/`)) {
    return { ok: false as const, error: 'Neplatná cesta souboru' };
  }

  const category = VALID_CATEGORIES.includes(input.category) ? input.category : 'other';

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('owner_documents').insert({
    owner_id: input.ownerId,
    apartment_id: input.apartmentId,
    category,
    title: input.title,
    file_path: input.path,
    file_size_bytes: input.sizeBytes,
    mime_type: input.mimeType,
    uploaded_by: 'admin',
  });

  if (error) {
    // Cleanup — bez DB záznamu by soubor zůstal ve Storage navždy
    await supabase.storage.from('dokumenty').remove([input.path]);
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/admin/dokumenty');
  revalidatePath('/portal/dokumenty');
  return { ok: true as const };
}

export async function updateOwnerDocument(documentId: string, input: { title: string; category: string }) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!input.title?.trim()) return { ok: false as const, error: 'Název je povinný' };

  const category = VALID_CATEGORIES.includes(input.category) ? input.category : 'other';

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('owner_documents')
    .update({ title: input.title.trim(), category })
    .eq('id', documentId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/admin/dokumenty');
  revalidatePath('/portal/dokumenty');
  return { ok: true as const };
}

export async function deleteOwnerDocument(documentId: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { data: doc } = await supabase
    .from('owner_documents')
    .select('id, file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc) return { ok: false as const, error: 'Dokument neexistuje' };

  const { error } = await supabase.from('owner_documents').delete().eq('id', documentId);
  if (error) return { ok: false as const, error: error.message };

  // Storage cleanup — případné selhání neblokuje (řádek už je pryč)
  await supabase.storage.from('dokumenty').remove([doc.file_path]);

  revalidatePath('/admin/dokumenty');
  revalidatePath('/portal/dokumenty');
  return { ok: true as const };
}

export async function getOwnerDocumentUrlAdmin(documentId: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { data: doc } = await supabase
    .from('owner_documents')
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
