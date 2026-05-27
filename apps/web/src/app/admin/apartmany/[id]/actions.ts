'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

function revalidate(id: string) {
  revalidatePath(`/admin/apartmany/${id}`);
}

export async function updateApartmentInfo(id: string, formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const title = formData.get('title') as string;
  const building = formData.get('building') as string;
  const unit = formData.get('unit') as string;
  const layout = formData.get('layout') as string;
  const area_m2Str = formData.get('area_m2') as string;
  const floorStr = formData.get('floor') as string;
  const maxGuestsStr = formData.get('max_guests') as string;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('apartments').update({
    title: title || null,
    building: building || null,
    unit: unit || null,
    layout: layout || null,
    area_m2: area_m2Str ? parseFloat(area_m2Str) : null,
    floor: floorStr ? parseInt(floorStr, 10) : null,
    max_guests: maxGuestsStr ? parseInt(maxGuestsStr, 10) : null,
  }).eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidate(id);
  return { ok: true };
}

export async function updateApartmentFeatures(id: string, features: string[]) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('apartments').update({ features }).eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidate(id);
  return { ok: true };
}

export async function addPricingRule(id: string, formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const name = formData.get('name') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const priceKcStr = formData.get('price_per_night_kc') as string;
  const minNightsStr = formData.get('min_nights') as string;

  if (!name || !startDate || !endDate || !priceKcStr) {
    return { ok: false, error: 'Chybí povinná pole' };
  }

  const priceKc = parseFloat(priceKcStr);
  if (isNaN(priceKc) || priceKc <= 0) return { ok: false, error: 'Neplatná cena' };
  if (endDate < startDate) return { ok: false, error: 'Konec musí být po začátku' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('pricing_rules').insert({
    apartment_id: id,
    name,
    start_date: startDate,
    end_date: endDate,
    price_per_night_cents: Math.round(priceKc * 100),
    min_nights: parseInt(minNightsStr) || 2,
  });

  if (error) return { ok: false, error: error.message };
  revalidate(id);
  revalidatePath('/admin/ceniky');
  return { ok: true };
}

export async function deletePricingRuleForApt(ruleId: string, aptId: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('pricing_rules').delete().eq('id', ruleId);

  if (error) return { ok: false, error: error.message };
  revalidate(aptId);
  revalidatePath('/admin/ceniky');
  return { ok: true };
}

export async function addBlock(id: string, formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const reason = formData.get('reason') as string;
  const note = formData.get('note') as string;

  if (!startDate || !endDate) return { ok: false, error: 'Chybí povinná pole' };
  if (endDate < startDate) return { ok: false, error: 'Konec musí být po začátku' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('blocked_dates').insert({
    apartment_id: id,
    owner_id: null,
    start_date: startDate,
    end_date: endDate,
    reason: reason || 'maintenance',
    note: note || null,
    source: null,
  });

  if (error) return { ok: false, error: error.message };
  revalidate(id);
  revalidatePath('/admin/blokace');
  return { ok: true };
}

export async function deleteBlock(blockId: string, aptId: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('blocked_dates').delete().eq('id', blockId);

  if (error) return { ok: false, error: error.message };
  revalidate(aptId);
  revalidatePath('/admin/blokace');
  return { ok: true };
}
