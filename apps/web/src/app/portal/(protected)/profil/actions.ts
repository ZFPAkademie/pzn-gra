'use server';

import { requireOwner, createSupabaseAdminClient } from '@/lib/supabase-server';

export async function updateOwnerProfile(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireOwner();
  if (!auth.ok) return { ok: false, error: auth.error };

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() ?? '';
  const bank_account = (formData.get('bank_account') as string | null)?.trim() ?? '';

  if (!name) return { ok: false, error: 'Jméno je povinné' };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('owners')
    .update({ name, phone, bank_account, updated_at: new Date().toISOString() })
    .eq('id', auth.ownerId);

  if (error) return { ok: false, error: 'Nepodařilo se uložit změny' };

  return { ok: true };
}
