/**
 * Data pro prezentaci apartmánu na prodej (/suites/[slug]).
 *
 * - Galerie po kapitolách: `apartment_images.category` + `alt_text` (migrace 023).
 * - Pronájem v číslech: ceník a obsazenost ze `fdm_calendar` (Front Desk Master, cron).
 *   Prodejní a pronájemní záznam bytu jsou v DB dva řádky se stejnou budovou a jednotkou
 *   (např. chata-2-suite-11 ↔ golden-ridge-11) — data se berou z toho, který má FDM vazbu.
 *
 * Záměrně se nepočítá výnos ani příjem (rozhodnutí uživatele 10. 11. 2026: provize a náklady
 * zatím kolísají) — jen ceny za noc a obsazené noci k datu synchronizace.
 */

import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { storagePathToUrl } from '@/data/apartment-images';
import { todayPrague } from '@/lib/booking-engine/dates';

export type GalleryCategory = 'interior' | 'winter' | 'exterior' | 'plan' | 'other';

export interface GalleryPhoto {
  url: string;
  caption: string | null;
}

export interface GalleryChapter {
  key: GalleryCategory;
  photos: GalleryPhoto[];
}

const CHAPTER_ORDER: GalleryCategory[] = ['interior', 'winter', 'exterior', 'plan', 'other'];

/** Fotky bytu rozdělené do kapitol (prázdné kapitoly vynechány), uvnitř podle sort_order. */
export async function getGalleryChapters(apartmentId: string): Promise<GalleryChapter[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('apartment_images')
      .select('storage_path, sort_order, category, alt_text')
      .eq('apartment_id', apartmentId)
      .order('sort_order', { ascending: true });
    if (error || !data) return [];

    const byKey = new Map<GalleryCategory, GalleryPhoto[]>();
    for (const row of data as { storage_path: string; category: string | null; alt_text: string | null }[]) {
      const key = (CHAPTER_ORDER.includes(row.category as GalleryCategory) ? row.category : 'other') as GalleryCategory;
      const list = byKey.get(key) ?? [];
      list.push({ url: storagePathToUrl(row.storage_path), caption: row.alt_text });
      byKey.set(key, list);
    }
    return CHAPTER_ORDER.filter((k) => byKey.get(k)?.length).map((k) => ({ key: k, photos: byKey.get(k)! }));
  } catch {
    return [];
  }
}

export interface RentalMonth {
  /** 'YYYY-MM' */
  month: string;
  /** Noci v měsíci od dneška (aktuální měsíc je jen zbytek) */
  nights: number;
  /** Noci, které kalendář správce nenabízí — rezervace hostů nebo blokace */
  booked: number;
  /** Medián ceny za noc v centech (bez zástupných hodnot), null = ceník chybí */
  medianCents: number | null;
  /** Nejvyšší cena za noc v měsíci (svátky) v centech */
  maxCents: number | null;
  /** Měsíc začíná dnes (neúplný) */
  partial: boolean;
}

export interface SeasonMonth {
  month: string;
  booked: number;
  nights: number;
  houseBooked: number;
  houseNights: number;
}

/**
 * Obsazenost jen pro nejbližší sezónu, kde už rezervace jsou (zadání 10. 11.: měsíce
 * „0 z 31“ na jaře a v létě působily, jako by tam nikdo nebyl — na ně se zatím nerezervuje).
 * Říjen–únor = hlavní zimní sezóna prosinec–únor, jinak nejbližších 90 dní.
 * Průměr domu = všechny apartmány napojené na FDM ve stejném období.
 */
export interface RentalSeason {
  kind: 'winter' | 'next90';
  /** '2026/27' u zimy */
  label: string;
  from: string;
  to: string;
  booked: number;
  nights: number;
  houseBooked: number;
  houseNights: number;
  houseUnits: number;
  months: SeasonMonth[];
}

export interface RentalSnapshot {
  /** Slug pronájemního záznamu (odkaz „Vyzkoušejte jako host“), null = není veřejně k pronájmu */
  rentalSlug: string | null;
  maxGuests: number | null;
  currency: string;
  /** Kdy FDM data naposledy přišla (ISO) */
  syncedAt: string | null;
  /** Ceník po měsících na rok dopředu (obsazenost se z nich na stránce neukazuje) */
  months: RentalMonth[];
  season: RentalSeason | null;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Okno sezóny podle dnešního data (viz RentalSeason) */
function seasonWindow(today: string): { kind: 'winter' | 'next90'; label: string; from: string; to: string } {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  if (month >= 10 || month <= 2) {
    const startYear = month >= 10 ? year : year - 1;
    const start = `${startYear}-12-01`;
    const end = addDays(`${startYear + 1}-03-01`, -1); // poslední den února i v přestupném roce
    return { kind: 'winter', label: `${startYear}/${String(startYear + 1).slice(2)}`, from: today > start ? today : start, to: end };
  }
  return { kind: 'next90', label: '', from: today, to: addDays(today, 89) };
}

/** FDM vrací 999 € jako zástupnou cenu u dnů bez ceníku — do statistik nepatří. */
const PLACEHOLDER_CENTS = 99_900;

function median(sorted: number[]): number | null {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Pronájem v číslech pro prodávaný byt; null = byt nemá FDM vazbu ani pronájemní dvojče. */
export async function getRentalSnapshot(apartment: {
  id: string;
  fdm_room_use_id: number | null;
}): Promise<RentalSnapshot | null> {
  // DB-05: datum mimo async closure
  const today = todayPrague();

  try {
    const supabase = createSupabaseAdminClient();

    // Dvojče se stejnou budovou a jednotkou, které je napojené na FDM (nebo byt sám)
    const { data: self } = await supabase
      .from('apartments')
      .select('building, unit')
      .eq('id', apartment.id)
      .maybeSingle();
    if (!self) return null;

    const { data: twins } = await supabase
      .from('apartments')
      .select('id, slug, for_rent, max_guests, fdm_room_use_id')
      .eq('building', self.building)
      .eq('unit', self.unit)
      .not('fdm_room_use_id', 'is', null);

    const list = (twins ?? []) as { id: string; slug: string; for_rent: boolean; max_guests: number | null }[];
    if (!list.length) return null;
    // Přednost má záznam, který je veřejně v pronájmu
    const twin = list.find((t) => t.for_rent) ?? list[0];

    const { data: rows } = await supabase
      .from('fdm_calendar')
      .select('date, available, price_cents, currency, synced_at')
      .eq('apartment_id', twin.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(400);

    const days = (rows ?? []) as { date: string; available: boolean; price_cents: number | null; currency: string | null; synced_at: string | null }[];
    if (!days.length) return null;

    const monthMap = new Map<string, { nights: number; booked: number; prices: number[] }>();
    let syncedAt: string | null = null;
    let currency = 'EUR';
    for (const d of days) {
      const m = d.date.slice(0, 7);
      const e = monthMap.get(m) ?? { nights: 0, booked: 0, prices: [] };
      e.nights += 1;
      if (!d.available) e.booked += 1;
      if (d.price_cents != null && d.price_cents > 0 && d.price_cents < PLACEHOLDER_CENTS) e.prices.push(d.price_cents);
      monthMap.set(m, e);
      if (d.synced_at && (!syncedAt || d.synced_at > syncedAt)) syncedAt = d.synced_at;
      if (d.currency) currency = d.currency;
    }

    const thisMonth = today.slice(0, 7);
    const months: RentalMonth[] = Array.from(monthMap.entries())
      .slice(0, 12)
      .map(([month, e]) => {
        const sorted = [...e.prices].sort((a, b) => a - b);
        return {
          month,
          nights: e.nights,
          booked: e.booked,
          medianCents: median(sorted),
          maxCents: sorted.length ? sorted[sorted.length - 1] : null,
          partial: month === thisMonth && !today.endsWith('-01'),
        };
      })
      // Poslední neúplný měsíc kalendáře (FDM posílá rok dopředu) by zkresloval
      .filter((m) => m.partial || m.nights >= 28);

    // Sezóna: tento apartmán + průměr celého domu (všechny apartmány s FDM kalendářem)
    const win = seasonWindow(today);
    const houseRows: { apartment_id: string; date: string; available: boolean }[] = [];
    for (let offset = 0; offset < 20_000; offset += 1000) {
      const { data: page } = await supabase
        .from('fdm_calendar')
        .select('apartment_id, date, available')
        .gte('date', win.from)
        .lte('date', win.to)
        .order('date', { ascending: true })
        .order('apartment_id', { ascending: true })
        .range(offset, offset + 999);
      houseRows.push(...((page ?? []) as typeof houseRows));
      if (!page || page.length < 1000) break;
    }

    const seasonMonths = new Map<string, SeasonMonth>();
    const units = new Set<string>();
    for (const r of houseRows) {
      const m = r.date.slice(0, 7);
      const e = seasonMonths.get(m) ?? { month: m, booked: 0, nights: 0, houseBooked: 0, houseNights: 0 };
      units.add(r.apartment_id);
      e.houseNights += 1;
      if (!r.available) e.houseBooked += 1;
      if (r.apartment_id === twin.id) {
        e.nights += 1;
        if (!r.available) e.booked += 1;
      }
      seasonMonths.set(m, e);
    }
    const sm = Array.from(seasonMonths.values()).sort((a, b) => a.month.localeCompare(b.month));
    const sum = (k: keyof Omit<SeasonMonth, 'month'>) => sm.reduce((s, m) => s + m[k], 0);
    const season: RentalSeason | null =
      sum('nights') > 0
        ? {
            ...win,
            booked: sum('booked'),
            nights: sum('nights'),
            houseBooked: sum('houseBooked'),
            houseNights: sum('houseNights'),
            houseUnits: units.size,
            months: sm,
          }
        : null;

    return {
      rentalSlug: twin.for_rent ? twin.slug : null,
      maxGuests: twin.max_guests,
      currency,
      syncedAt,
      months,
      season,
    };
  } catch {
    return null;
  }
}
