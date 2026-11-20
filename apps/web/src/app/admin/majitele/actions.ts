'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { setOwnerApartments } from '@/lib/apartment-owners';
import { isValidIco, lookupAresCompany, normalizeIco } from '@/lib/ares';

/** Firma, která apartmán vlastní (migrace 028) — prázdná pole = null */
function companyFields(formData: FormData):
  | { ok: true; data: { company_name: string | null; company_id: string | null; company_vat_id: string | null; company_address: string | null } }
  | { ok: false; error: string } {
  const val = (k: string) => String(formData.get(k) ?? '').trim() || null;
  const rawIco = val('company_id');
  const company_id = rawIco ? normalizeIco(rawIco) : null;
  if (company_id && !isValidIco(company_id)) return { ok: false, error: 'IČO firmy nemá platný tvar (8 číslic s kontrolní číslicí)' };
  const company_vat_id = val('company_vat_id')?.replace(/\s/g, '').toUpperCase() ?? null;
  const data = { company_name: val('company_name'), company_id, company_vat_id, company_address: val('company_address') };
  if (!data.company_name && (company_id || company_vat_id || data.company_address)) {
    return { ok: false, error: 'Vyplňte název firmy (nebo ho načtěte z ARES podle IČO)' };
  }
  return { ok: true, data };
}

export async function lookupCompany(ico: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  return lookupAresCompany(ico);
}

export async function createOwner(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const apartmentIds = formData.getAll('apartment_ids').map(String).filter(Boolean);
  const commissionStr = formData.get('commission_rate') as string;

  if (!name || !email) return { ok: false, error: 'Jméno a email jsou povinné' };
  const company = companyFields(formData);
  if (!company.ok) return company;

  const supabase = createSupabaseAdminClient();

  const { data: owner, error: ownerError } = await supabase
    .from('owners')
    .insert({
      name,
      email,
      phone: phone || null,
      commission_rate: commissionStr ? parseFloat(commissionStr) / 100 : null,
      is_active: true,
      ...company.data,
    })
    .select('id')
    .single();

  if (ownerError) return { ok: false, error: ownerError.message };

  if (apartmentIds.length > 0 && owner) {
    const linked = await setOwnerApartments(owner.id, apartmentIds);
    if (!linked.ok) return { ok: false, error: `Majitel uložen, ale apartmány se nepřiřadily: ${linked.error}` };
  }

  revalidatePath('/admin/majitele');
  revalidatePath('/admin/apartmany');
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

  return { ok: true, magicLink };
}

export async function updateOwnerCommission(ownerId: string, commissionPercent: number) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };
  if (isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    return { ok: false, error: 'Provize musí být 0–100 %' };
  }

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

export async function updateOwner(ownerId: string, formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const apartmentIds = formData.getAll('apartment_ids').map(String).filter(Boolean);
  const commissionStr = String(formData.get('commission_rate') ?? '').trim().replace(',', '.');

  if (!name || !email) return { ok: false, error: 'Jméno a email jsou povinné' };

  let commission_rate: number | null = null;
  if (commissionStr !== '') {
    const pct = parseFloat(commissionStr);
    if (isNaN(pct) || pct < 0 || pct > 100) return { ok: false, error: 'Provize musí být 0–100 %' };
    commission_rate = pct / 100;
  }
  const company = companyFields(formData);
  if (!company.ok) return company;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('owners')
    .update({ name, email, phone: phone || null, commission_rate, ...company.data })
    .eq('id', ownerId);

  if (error) return { ok: false, error: error.message };

  // Formulář vždy posílá kompletní výběr apartmánů (i prázdný)
  if (formData.get('apartments_submitted') === '1') {
    const linked = await setOwnerApartments(ownerId, apartmentIds);
    if (!linked.ok) return { ok: false, error: linked.error };
  }

  revalidatePath('/admin/majitele');
  revalidatePath('/admin/apartmany');
  return { ok: true };
}

export async function deleteOwner(ownerId: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();

  // Odpojit apartmány od majitele (spolumajitelé zůstávají)
  const unlinked = await setOwnerApartments(ownerId, []);
  if (!unlinked.ok) return { ok: false, error: unlinked.error };

  const { error } = await supabase
    .from('owners')
    .update({ is_active: false })
    .eq('id', ownerId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/majitele');
  return { ok: true };
}
