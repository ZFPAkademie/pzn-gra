'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function createOwner(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const apartmentId = formData.get('apartment_id') as string;
  const commissionStr = formData.get('commission_rate') as string;

  if (!name || !email) return { ok: false, error: 'Jméno a email jsou povinné' };

  const supabase = createSupabaseAdminClient();

  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .insert({
      name,
      email,
      phone: phone || null,
      commission_rate: commissionStr ? parseFloat(commissionStr) / 100 : null,
      is_active: true,
    })
    .select('id')
    .single();

  if (ownerError) return { ok: false, error: ownerError.message };

  if (apartmentId && owner) {
    await supabase
      .from('apartments')
      .update({ owner_id: owner.id, status: 'sold' })
      .eq('id', apartmentId);
  }

  revalidatePath('/admin/majitele');
  return { ok: true };
}

export async function sendMagicLink(ownerId: string, email: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();

  // AUTH-03: generateLink vytvoří auth user (nebo použije existující) a vrátí user.id
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://pzn-gra.vercel.app'}/auth/callback`,
      data: { role: 'owner', owner_id: ownerId },
    },
  });

  if (error) return { ok: false, error: error.message };

  const magicLink = data?.properties?.action_link;
  const authUserId = data?.user?.id;
  if (!magicLink) return { ok: false, error: 'Nepodařilo se vygenerovat odkaz' };

  // Propojit auth user s owner záznamem — bez toho portál nenajde majitele
  if (authUserId) {
    await supabase
      .from('owners')
      .update({ user_id: authUserId })
      .eq('id', ownerId);
  }

  // Zaznamenat pozvánku
  await supabase.from('owner_invitations').insert({
    owner_id: ownerId,
    email,
  });

  revalidatePath('/admin/majitele');
  return { ok: true, magicLink };
}

export async function updateOwnerCommission(ownerId: string, commissionPercent: number) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('owners')
    .update({ commission_rate: commissionPercent / 100 })
    .eq('id', ownerId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/majitele');
  return { ok: true };
}

export async function toggleOwnerActive(ownerId: string, isActive: boolean) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('owners')
    .update({ is_active: isActive })
    .eq('id', ownerId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/majitele');
  return { ok: true };
}
