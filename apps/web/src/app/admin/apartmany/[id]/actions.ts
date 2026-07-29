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
  const orientation = formData.get('orientation') as string;
  const description = formData.get('description') as string;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('apartments').update({
    title: title || null,
    building: building || null,
    unit: unit || null,
    layout: layout || null,
    area_m2: area_m2Str ? parseFloat(area_m2Str) : null,
    floor: floorStr ? parseInt(floorStr, 10) : null,
    max_guests: maxGuestsStr ? parseInt(maxGuestsStr, 10) : null,
    orientation: orientation || null,
    description: description || null,
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

// ── Fotogalerie (bucket `apartmany`, public — fotky bytů jsou veřejné) ──

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export async function createImageUploadUrl(apartmentId: string, fileName: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!fileName) return { ok: false as const, error: 'Chybí název souboru' };

  const supabase = createSupabaseAdminClient();
  const { data: apt } = await supabase
    .from('apartments')
    .select('slug')
    .eq('id', apartmentId)
    .maybeSingle();

  if (!apt?.slug) return { ok: false as const, error: 'Byt nenalezen' };

  const path = `${apt.slug}/${Date.now()}-${sanitizeFileName(fileName)}`;
  const { data, error } = await supabase.storage.from('apartmany').createSignedUploadUrl(path);

  if (error || !data) return { ok: false as const, error: 'Upload URL se nepodařilo vytvořit' };
  return { ok: true as const, path: data.path, token: data.token };
}

export async function saveApartmentImage(apartmentId: string, path: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };
  if (!path) return { ok: false as const, error: 'Chybí cesta souboru' };

  const supabase = createSupabaseAdminClient();

  // Nová fotka jde na konec galerie
  const { data: last } = await supabase
    .from('apartment_images')
    .select('sort_order')
    .eq('apartment_id', apartmentId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('apartment_images').insert({
    apartment_id: apartmentId,
    storage_path: path,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    // Bez DB řádku by soubor ve Storage osiřel
    await supabase.storage.from('apartmany').remove([path]);
    return { ok: false as const, error: error.message };
  }

  revalidate(apartmentId);
  return { ok: true as const };
}

export async function deleteApartmentImage(imageId: string, apartmentId: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { data: image } = await supabase
    .from('apartment_images')
    .select('id, storage_path')
    .eq('id', imageId)
    .maybeSingle();

  if (!image) return { ok: false as const, error: 'Fotka neexistuje' };

  const { error } = await supabase.from('apartment_images').delete().eq('id', imageId);
  if (error) return { ok: false as const, error: error.message };

  // Některé byty sdílejí složku (golden-ridge-7 ↔ chata-1-suite-7) —
  // soubor smaž jen když už na něj neodkazuje žádný jiný byt.
  const { count } = await supabase
    .from('apartment_images')
    .select('id', { count: 'exact', head: true })
    .eq('storage_path', image.storage_path);

  if ((count ?? 0) === 0) {
    await supabase.storage.from('apartmany').remove([image.storage_path]);
  }

  revalidate(apartmentId);
  return { ok: true as const };
}

/** Prohodí fotku se sousedem — 'up' o pozici výš, 'down' o pozici níž. */
export async function moveApartmentImage(
  imageId: string,
  apartmentId: string,
  direction: 'up' | 'down'
) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { data: images } = await supabase
    .from('apartment_images')
    .select('id, sort_order')
    .eq('apartment_id', apartmentId)
    .order('sort_order', { ascending: true });

  const list = images ?? [];
  const index = list.findIndex((i) => i.id === imageId);
  if (index === -1) return { ok: false as const, error: 'Fotka neexistuje' };

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return { ok: true as const };

  // Přepiš pořadí celé galerie — odolné vůči duplicitám v sort_order
  const reordered = [...list];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase
      .from('apartment_images')
      .update({ sort_order: i })
      .eq('id', reordered[i].id);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidate(apartmentId);
  return { ok: true as const };
}

/** Nastaví fotku jako hlavní — přesune ji na první pozici. */
export async function setApartmentHeroImage(imageId: string, apartmentId: string) {
  if (!await isAdminAuthenticated()) return { ok: false as const, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { data: images } = await supabase
    .from('apartment_images')
    .select('id, sort_order')
    .eq('apartment_id', apartmentId)
    .order('sort_order', { ascending: true });

  const list = images ?? [];
  const picked = list.find((i) => i.id === imageId);
  if (!picked) return { ok: false as const, error: 'Fotka neexistuje' };

  const reordered = [picked, ...list.filter((i) => i.id !== imageId)];

  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase
      .from('apartment_images')
      .update({ sort_order: i })
      .eq('id', reordered[i].id);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidate(apartmentId);
  return { ok: true as const };
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
