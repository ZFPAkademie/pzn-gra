import { createSupabaseAdminClient } from '@/lib/supabase-server';

export interface PriceBreakdown {
  date: string;
  pricePerNightCents: number;
  ruleName: string | null;
}

export interface PriceResult {
  totalCents: number;
  pricePerNightCents: number;
  nights: number;
  minNights: number;
  breakdown: PriceBreakdown[];
  currency: 'CZK';
}

export async function calculatePrice(
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<PriceResult | null> {
  const admin = createSupabaseAdminClient();

  const { data: apartment, error: aptError } = await admin
    .from('apartments')
    .select('base_price_cents')
    .eq('id', apartmentId)
    .maybeSingle();

  if (aptError || !apartment) {
    console.error('[pricing] apartment not found:', aptError);
    return null;
  }

  const basePriceCents: number = apartment.base_price_cents ?? 0;

  const { data: rules } = await admin
    .from('pricing_rules')
    .select('name, start_date, end_date, price_per_night_cents, min_nights')
    .eq('apartment_id', apartmentId)
    .lte('start_date', checkOut)
    .gte('end_date', checkIn)
    .order('start_date', { ascending: true });

  const current = new Date(checkIn);
  const end = new Date(checkOut);
  const breakdown: PriceBreakdown[] = [];
  let totalCents = 0;

  while (current < end) {
    const dateStr = current.toISOString().slice(0, 10);

    const matchingRule = (rules || []).find((rule) => {
      return dateStr >= rule.start_date && dateStr <= rule.end_date;
    });

    const nightCents = matchingRule
      ? matchingRule.price_per_night_cents
      : basePriceCents;

    breakdown.push({
      date: dateStr,
      pricePerNightCents: nightCents,
      ruleName: matchingRule ? matchingRule.name : null,
    });

    totalCents += nightCents;
    current.setDate(current.getDate() + 1);
  }

  const nights = breakdown.length;
  const avgPricePerNight = nights > 0 ? Math.round(totalCents / nights) : basePriceCents;

  const overlappingRules = (rules || []).filter((rule) => {
    return rule.start_date <= checkOut && rule.end_date >= checkIn;
  });
  const minNights = overlappingRules.reduce((max, rule) => {
    const ruleMin = rule.min_nights ?? 2;
    return ruleMin > max ? ruleMin : max;
  }, 2);

  return {
    totalCents,
    pricePerNightCents: avgPricePerNight,
    nights,
    minNights,
    breakdown,
    currency: 'CZK',
  };
}
