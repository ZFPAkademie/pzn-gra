/**
 * Synchronizace kalendáře z Front Desk Master do tabulky fdm_calendar.
 * Spouští Vercel Cron (/api/cron/fdm-sync) a ručně admin z Channel Manageru.
 *
 * Pro každý apartmán s fdm_room_use_id: dostupnost + ceny (Standard Rate) + min. pobyt
 * na HORIZON_DAYS dopředu. Zápis po dávkách přes upsert, minulé dny se mažou.
 */

import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { fdmGetAvailability, fdmGetPricing, fdmGetRestrictions, isFdmConfigured } from './client';

export const FDM_HORIZON_DAYS = 365;
export const FDM_STANDARD_RATE_ID = 1;
export const FDM_CURRENCY = 'EUR';

const CHUNK_DAYS = 92; // FDM formulář volá i celý rok najednou; dávky kvůli velikosti odpovědi

export interface FdmSyncSummary {
  ok: boolean;
  apartments: number;
  days: number;
  error?: string;
  startedAt: string;
  finishedAt: string;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function syncFdmCalendar(): Promise<FdmSyncSummary> {
  const startedAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();

  const finish = async (s: Omit<FdmSyncSummary, 'startedAt' | 'finishedAt'>): Promise<FdmSyncSummary> => {
    const finishedAt = new Date().toISOString();
    try {
      await supabase.from('fdm_sync_log').insert({
        started_at: startedAt,
        finished_at: finishedAt,
        apartments: s.apartments,
        days: s.days,
        error: s.error ?? null,
      });
    } catch {
      /* log je informativní */
    }
    return { ...s, startedAt, finishedAt };
  };

  if (!isFdmConfigured()) {
    return finish({ ok: false, apartments: 0, days: 0, error: 'FDM_HOSTEL_ID není nastaveno' });
  }

  const { data: apartments, error: aptErr } = await supabase
    .from('apartments')
    .select('id, slug, fdm_room_use_id')
    .not('fdm_room_use_id', 'is', null);

  if (aptErr) return finish({ ok: false, apartments: 0, days: 0, error: aptErr.message });
  if (!apartments || apartments.length === 0) {
    return finish({ ok: true, apartments: 0, days: 0 });
  }

  const byRoomUse = new Map<number, string>();
  for (const a of apartments) byRoomUse.set(a.fdm_room_use_id as number, a.id);

  const today = todayUtc();
  const horizonEnd = addDays(today, FDM_HORIZON_DAYS);

  type Row = {
    apartment_id: string;
    date: string;
    available: boolean;
    price_cents: number | null;
    currency: string;
    min_stay: number | null;
    closed: boolean;
    synced_at: string;
  };
  const rows = new Map<string, Row>(); // key apartment_id|date

  let cursor = today;
  while (cursor < horizonEnd) {
    const chunkEnd = addDays(cursor, CHUNK_DAYS - 1) < horizonEnd ? addDays(cursor, CHUNK_DAYS - 1) : horizonEnd;

    const [avail, pricing, restr] = await Promise.all([
      fdmGetAvailability(cursor, chunkEnd),
      fdmGetPricing(cursor, chunkEnd),
      fdmGetRestrictions(cursor, chunkEnd),
    ]);

    if (!avail.ok) return finish({ ok: false, apartments: apartments.length, days: 0, error: avail.error });

    const syncedAt = new Date().toISOString();
    for (const d of avail.data) {
      const aptId = byRoomUse.get(d.roomUseId);
      if (!aptId || !d.date || d.date < today) continue;
      rows.set(`${aptId}|${d.date}`, {
        apartment_id: aptId,
        date: d.date,
        available: d.available > 0,
        price_cents: null,
        currency: FDM_CURRENCY,
        min_stay: null,
        closed: false,
        synced_at: syncedAt,
      });
    }

    if (pricing.ok) {
      for (const p of pricing.data) {
        if (p.rateId !== FDM_STANDARD_RATE_ID) continue;
        const aptId = byRoomUse.get(p.roomUseId);
        if (!aptId) continue;
        const row = rows.get(`${aptId}|${p.date}`);
        if (row) row.price_cents = Math.round(p.price * 100);
      }
    } else {
      console.warn('[fdm-sync] pricing selhalo, ceny zůstanou z minula:', pricing.error);
    }

    if (restr.ok) {
      for (const r of restr.data) {
        if (r.rateId !== FDM_STANDARD_RATE_ID) continue;
        const aptId = byRoomUse.get(r.roomUseId);
        if (!aptId) continue;
        const row = rows.get(`${aptId}|${r.date}`);
        if (!row) continue;
        row.min_stay = r.minStayArrival ?? r.minStayThrough ?? null;
        row.closed = r.closed || r.closedOnArrival;
      }
    } else {
      console.warn('[fdm-sync] restrictions selhalo:', restr.error);
    }

    cursor = addDays(chunkEnd, 1);
  }

  // Když FDM nevrátilo ceny, nepřepisuj existující cenu NULLem.
  const all = Array.from(rows.values());
  const withPrice = all.filter((r) => r.price_cents != null);
  const withoutPrice = all.filter((r) => r.price_cents == null);

  const BATCH = 500;
  for (let i = 0; i < withPrice.length; i += BATCH) {
    const { error } = await supabase
      .from('fdm_calendar')
      .upsert(withPrice.slice(i, i + BATCH), { onConflict: 'apartment_id,date' });
    if (error) return finish({ ok: false, apartments: apartments.length, days: i, error: error.message });
  }
  for (let i = 0; i < withoutPrice.length; i += BATCH) {
    const slice = withoutPrice.slice(i, i + BATCH).map(({ price_cents: _p, ...rest }) => rest);
    const { error } = await supabase
      .from('fdm_calendar')
      .upsert(slice, { onConflict: 'apartment_id,date' });
    if (error) return finish({ ok: false, apartments: apartments.length, days: withPrice.length + i, error: error.message });
  }

  // Úklid minulých dnů
  await supabase.from('fdm_calendar').delete().lt('date', today);

  console.log(`[fdm-sync] ${apartments.length} apartmánů, ${all.length} dnů`);
  return finish({ ok: true, apartments: apartments.length, days: all.length });
}

export async function getLastFdmSync() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('fdm_sync_log')
    .select('started_at, finished_at, apartments, days, error')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
