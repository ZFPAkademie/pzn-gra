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
    .select('id, owner_id, apartment_id, file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (!doc) return { ok: false as const, error: 'Dokument neexistuje' };
  // Vlastní dokument, nebo dokument k apartmánu, jehož je spolumajitelem
  const allowed = doc.owner_id === auth.ownerId
    || (doc.apartment_id != null && auth.apartmentIds.includes(doc.apartment_id));
  if (!allowed) return { ok: false as const, error: 'Přístup odepřen' };

  const { data, error } = await admin.storage
    .from('dokumenty')
    .createSignedUrl(doc.file_path, 3600);

  if (error || !data?.signedUrl) return { ok: false as const, error: 'Odkaz se nepodařilo vytvořit' };
  return { ok: true as const, url: data.signedUrl };
}
