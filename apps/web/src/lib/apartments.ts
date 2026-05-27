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
  for_sale: boolean;
  for_rent: boolean;
  in_rental_program: boolean;
  status: string;
}

const DB_SELECT =
  'id, slug, title, subtitle, layout, area_m2, floor, orientation, description, features, rooms, max_guests, base_price_cents, for_sale, for_rent, in_rental_program, status' as const;

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
