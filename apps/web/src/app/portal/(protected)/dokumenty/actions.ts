'use server';

/**
 * Portal — dokumenty majitele (owner_documents).
 * Pattern DB-01: admin client + manuální ownership check.
 */

import { requireOwner, createSupabaseAdminClient } from '@/lib/supabase-server';

export async function getOwnerDocumentUrl(documentId: string) {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const admin = createSupabaseAdminClient();

  const { data: doc } = await admin
    .from('owner_documents')
    .select('id, owner_id, file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc) return { ok: false as const, error: 'Dokument neexistuje' };
  if (doc.owner_id !== auth.ownerId) return { ok: false as const, error: 'Přístup odepřen' };

  const { data, error } = await admin.storage
    .from('dokumenty')
    .createSignedUrl(doc.file_path, 3600);

  if (error || !data?.signedUrl) return { ok: false as const, error: 'Odkaz se nepodařilo vytvořit' };
  return { ok: true as const, url: data.signedUrl };
}
