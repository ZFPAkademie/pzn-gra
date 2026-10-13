/**
 * Apartments data library
 */

import apartmentsData from '@/data/apartments.canonical.json';
import { createSupabaseAdminClient } from './supabase-server';

// ═══════════════════════════════════════════════════════════
// DB interface — apartmány čtené přímo z Supabase
// ═══════════════════════════════════════════════════════════

export interface ApartmentDB {
  id: string;
  slug: string;
  title: string | null;
  subtitle: string | null;
  layout: string | null;
  area_m2: number | null;
  floor: number | null;
  orientation: string | null;
  description: string | null;
  features: string[] | null;
  rooms: { hall: string; bathroom: string; bedroom: string | null; livingKitchen: string } | null;
  max_guests: number | null;
  base_price_cents: number | null;
  fdm_room_use_id: number | null;
  for_sale: boolean;
  for_rent: boolean;
  in_rental_program: boolean;
  status: string;
  // Anglické texty (013) — NULL = zobrazí se česká verze
  title_en: string | null;
  subtitle_en: string | null;
  orientation_en: string | null;
  description_en: string | null;
  features_en: string[] | null;
  // Polské texty (014) — jen apartmány k pronájmu; NULL = angličtina, pak čeština
  title_pl: string | null;
  subtitle_pl: string | null;
  orientation_pl: string | null;
  description_pl: string | null;
  features_pl: string[] | null;
}

const DB_SELECT =
  'id, slug, title, subtitle, layout, area_m2, floor, orientation, description, features, rooms, max_guests, base_price_cents, fdm_room_use_id, for_sale, for_rent, in_rental_program, status, title_en, subtitle_en, orientation_en, description_en, features_en, title_pl, subtitle_pl, orientation_pl, description_pl, features_pl' as const;

/**
 * Texty apartmánu v jazyce návštěvníka — 'en' přepíše title/subtitle/orientation/description/features
 * anglickou verzí, 'pl' polskou (chybějící PL pole → EN → CZ). Chybějící pole zůstanou česky.
 */
export function localizeApartment<T extends ApartmentDB>(apt: T, locale: 'cs' | 'en' | 'pl'): T {
  if (locale === 'cs') return apt;
  const pl = locale === 'pl';
  const pick = <V,>(plVal: V | null | undefined, enVal: V | null | undefined, csVal: V): V =>
    (pl ? plVal : null) ?? enVal ?? csVal;
  return {
    ...apt,
    title: pick(apt.title_pl, apt.title_en, apt.title),
    subtitle: pick(apt.subtitle_pl, apt.subtitle_en, apt.subtitle),
    orientation: pick(apt.orientation_pl, apt.orientation_en, apt.orientation),
    description: pick(apt.description_pl, apt.description_en, apt.description),
    features:
      (pl && apt.features_pl?.length ? apt.features_pl : null) ??
      (apt.features_en?.length ? apt.features_en : null) ??
      apt.features,
  };
}

/** Dispozice pro zahraničního hosta: 1+kk → Studio (1+kk) / Kawalerka (1+kk), 2+kk → One-bedroom / Apartament z 1 sypialnią */
export function layoutLabel(layout: string | null | undefined, locale: 'cs' | 'en' | 'pl'): string {
  if (!layout) return '';
  if (locale === 'cs') return layout;
  const m = layout.match(/^(\d)\s*\+\s*(kk|1)$/i);
  if (!m) return layout;
  const rooms = Number(m[1]) - (m[2].toLowerCase() === 'kk' ? 1 : 0);
  if (locale === 'pl') {
    const name = rooms <= 0 ? 'Kawalerka' : rooms === 1 ? 'Apartament z 1 sypialnią' : `Apartament z ${rooms} sypialniami`;
    return `${name} (${layout})`;
  }
  const name = rooms <= 0 ? 'Studio' : rooms === 1 ? 'One-bedroom' : rooms === 2 ? 'Two-bedroom' : `${rooms}-bedroom`;
  return `${name} (${layout})`;
}

export async function getApartmentBySlugDB(slug: string): Promise<ApartmentDB | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('apartments')
    .select(DB_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) console.error('[getApartmentBySlugDB]', error.message);
  return (data as ApartmentDB | null) ?? null;
}

export async function getSaleApartmentsDB(): Promise<ApartmentDB[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('apartments')
    .select(DB_SELECT)
    .eq('for_sale', true)
    .order('slug');
  if (error) console.error('[getSaleApartmentsDB]', error.message);
  return (data as ApartmentDB[]) ?? [];
}

export async function getRentalApartmentsDB(): Promise<ApartmentDB[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('apartments')
    .select(DB_SELECT)
    .eq('for_rent', true)
    .order('slug');
  if (error) console.error('[getRentalApartmentsDB]', error.message);
  return (data as ApartmentDB[]) ?? [];
}

export interface Room {
  hall: string;
  bathroom: string;
  bedroom: string | null;
  livingKitchen: string;
}

export interface SaleApartment {
  slug: string;
  title: string;
  subtitle: string;
  layout: string;
  totalArea: string;
  rooms: Room;
  description: string;
  features: string[];
  floor: number;
  orientation: string;
  status: string;
  belongsToRealEstateProduct?: boolean;
}

export interface RentalApartment {
  slug: string;
  title: string;
  layout: string;
  totalArea: string;
  rooms: Room;
  description: string;
  features: string[];
  orientation: string;
  maxGuests: number;
  pricePerNight: number;
  status: string;
  alsoForSale?: boolean;
}

export interface SalesManager {
  name: string;
  title: string;
  phone: string;
  email: string;
  photo: string;
}

export function getSaleApartments(): SaleApartment[] {
  return apartmentsData.sale as SaleApartment[];
}

export function getRentalApartments(): RentalApartment[] {
  return apartmentsData.rental as RentalApartment[];
}

export function getSaleApartmentBySlug(slug: string): SaleApartment | undefined {
  return apartmentsData.sale.find((apt) => apt.slug === slug) as SaleApartment | undefined;
}

export function getRentalApartmentBySlug(slug: string): RentalApartment | undefined {
  return apartmentsData.rental.find((apt) => apt.slug === slug) as RentalApartment | undefined;
}

export function getSalesManager(): SalesManager {
  return apartmentsData.salesManager as SalesManager;
}

// Get rental apartments that are also for sale
export function getRentalApartmentsForSale(): RentalApartment[] {
  return apartmentsData.rental.filter((apt) => apt.alsoForSale) as RentalApartment[];
}

// Get sale apartments that belong to real estate product (nemovitostní produkt)
export function getRealEstateProductApartments(): SaleApartment[] {
  return apartmentsData.sale.filter((apt) => apt.belongsToRealEstateProduct) as SaleApartment[];
}
