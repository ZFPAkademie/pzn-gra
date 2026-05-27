'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function createPricingRule(formData: FormData) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const apartmentId = formData.get('apartment_id') as string;
  const name = formData.get('name') as string;
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const priceKcStr = formData.get('price_per_night_kc') as string;
  const minNightsStr = formData.get('min_nights') as string;

  if (!apartmentId || !name || !startDate || !endDate || !priceKcStr) {
    return { ok: false, error: 'Chybí povinná pole' };
  }

  const priceKc = parseFloat(priceKcStr);
  if (isNaN(priceKc) || priceKc <= 0) return { ok: false, error: 'Neplatná cena' };
  if (endDate < startDate) return { ok: false, error: 'Konec musí být po začátku' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('pricing_rules').insert({
    apartment_id: apartmentId,
    name,
    start_date: startDate,
    end_date: endDate,
    price_per_night_cents: Math.round(priceKc * 100),
    min_nights: parseInt(minNightsStr) || 2,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/ceniky');
  return { ok: true };
}

export async function deletePricingRule(id: string) {
  if (!await isAdminAuthenticated()) return { ok: false, error: 'Neautorizováno' };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('pricing_rules').delete().eq('id', id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/ceniky');
  return { ok: true };
}
