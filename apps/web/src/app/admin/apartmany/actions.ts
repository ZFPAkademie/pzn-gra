'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function updateApartmentFlags(
  apartmentId: string,
  flags: { for_sale?: boolean; for_rent?: boolean; in_rental_program?: boolean }
) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('apartments')
    .update({ ...flags, updated_at: new Date().toISOString() })
    .eq('id', apartmentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/apartmany');
  return { ok: true };
}

export async function updateApartmentOwner(apartmentId: string, ownerId: string | null) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('apartments')
    .update({
      owner_id: ownerId,
      status: ownerId ? 'sold' : 'available',
      updated_at: new Date().toISOString(),
    })
    .eq('id', apartmentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/apartmany');
  return { ok: true };
}

export async function updateApartmentBasePrice(apartmentId: string, priceKc: number) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('apartments')
    .update({
      base_price_cents: Math.round(priceKc * 100),
      updated_at: new Date().toISOString(),
    })
    .eq('id', apartmentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/apartmany');
  return { ok: true };
}

export async function createApartment(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const slug = formData.get('slug') as string;
  const title = formData.get('title') as string;
  const unit = formData.get('unit') as string;
  const building = formData.get('building') as string;
  const layout = formData.get('layout') as string;
  const areaM2 = formData.get('area_m2') as string;
  const floor = formData.get('floor') as string;
  const priceKc = formData.get('base_price_kc') as string;

  if (!slug || !title) return { ok: false, error: 'Slug a název jsou povinné' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('apartments').insert({
    slug,
    title,
    unit: unit || null,
    building: building || null,
    layout: layout || null,
    area_m2: areaM2 ? parseFloat(areaM2) : null,
    floor: floor ? parseInt(floor) : null,
    base_price_cents: priceKc ? Math.round(parseFloat(priceKc) * 100) : 250000,
    status: 'available',
    for_sale: false,
    for_rent: false,
    in_rental_program: false,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/apartmany');
  return { ok: true };
}
