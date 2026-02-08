/**
 * Apartments Catalogue
 * Production v1: Uses canonical JSON data
 * 
 * Modes: rent | sale | investment
 * CTA rules per design doc:
 *   - rent → "Poptat termín"
 *   - sale → "Nezávazně poptat cenu"
 *   - investment → "Kontaktovat investiční tým"
 */

import apartmentsData from '@/data/apartments.canonical.json';

// ===========================================
// TYPES
// ===========================================

export type ApartmentMode = 'rent' | 'sale' | 'investment';
export type LeadIntent = 'rent_inquiry' | 'sale_inquiry' | 'investment_inquiry' | 'general_inquiry';

export interface RoomBreakdown {
  room: string;
  m2: number;
}

export interface M2Data {
  total: number;
  breakdown: RoomBreakdown[];
}

export interface GalleryItem {
  url: string;
  alt?: string;
}

export interface Gallery {
  items: GalleryItem[];
  placeholder: boolean;
}

export interface Pricing {
  rent_from_eur_per_night?: number | null;
  sale_price?: number | null;
  currency: string;
  on_request?: boolean;
  pricing_note?: string;
}

export interface CTA {
  target: string;
  type: string;
  intent: LeadIntent;
  label: string;
}

export interface ContentState {
  images: 'placeholder' | 'ready';
  copy: 'draft' | 'final';
}

export interface Apartment {
  slug: string;
  source_url: string;
  title: string;
  mode: ApartmentMode;
  status: 'available' | 'reserved' | 'sold';
  m2: M2Data;
  gallery: Gallery;
  notes: string[];
  legacy_slugs?: string[];
  pricing: Pricing;
  building: string;
  unit_number: number;
  cta: CTA;
  content_state: ContentState;
  // Optional fields
  capacity?: number;
  description_cs?: string;
  description_en?: string;
  amenities?: string[];
}

// ===========================================
// DATA ACCESS
// ===========================================

const apartments: Apartment[] = apartmentsData as Apartment[];

/**
 * Get all apartments
 */
export function getAllApartments(): Apartment[] {
  return apartments;
}

/**
 * Get apartments for rent
 */
export function getRentApartments(): Apartment[] {
  return apartments.filter(apt => apt.mode === 'rent' && apt.status === 'available');
}

/**
 * Get apartments for sale
 */
export function getSaleApartments(): Apartment[] {
  return apartments.filter(apt => apt.mode === 'sale' && apt.status === 'available');
}

/**
 * Get apartments for investment
 */
export function getInvestmentApartments(): Apartment[] {
  return apartments.filter(apt => apt.mode === 'investment' && apt.status === 'available');
}

/**
 * Get apartment by slug
 */
export function getApartmentBySlug(slug: string): Apartment | undefined {
  return apartments.find(apt => 
    apt.slug === slug || apt.legacy_slugs?.includes(slug)
  );
}

/**
 * Get apartments by building
 */
export function getApartmentsByBuilding(building: string): Apartment[] {
  return apartments.filter(apt => apt.building === building);
}

// ===========================================
// DISPLAY HELPERS (per Design Rules)
// ===========================================

/**
 * Format price display
 * - sale → VŽDY "Cena na dotaz"
 * - rent → "od X € / noc"
 */
export function formatPriceDisplay(apt: Apartment, locale: string = 'cs'): string {
  // Sale = NIKDY nezobrazovat cenu
  if (apt.mode === 'sale' || apt.mode === 'investment') {
    return locale === 'cs' ? 'Cena na dotaz' : 'Price on request';
  }
  
  // Rent = EUR / noc
  if (apt.pricing.rent_from_eur_per_night) {
    return locale === 'cs' 
      ? `od ${apt.pricing.rent_from_eur_per_night} € / noc`
      : `from €${apt.pricing.rent_from_eur_per_night} / night`;
  }
  
  // Fallback
  return locale === 'cs' ? 'Cena na vyžádání' : 'Price on request';
}

/**
 * Format area display
 */
export function formatAreaDisplay(m2: number): string {
  return `${Math.round(m2)} m²`;
}

/**
 * Get CTA label by mode (per design doc)
 * - rent → "Poptat termín"
 * - sale → "Nezávazně poptat cenu"
 * - investment → "Kontaktovat investiční tým"
 */
export function getCTALabel(apt: Apartment, locale: string = 'cs'): string {
  if (locale === 'cs') {
    switch (apt.mode) {
      case 'rent': return 'Poptat termín';
      case 'sale': return 'Nezávazně poptat cenu';
      case 'investment': return 'Kontaktovat investiční tým';
      default: return 'Kontaktovat nás';
    }
  }
  // English
  switch (apt.mode) {
    case 'rent': return 'Inquire about dates';
    case 'sale': return 'Request price';
    case 'investment': return 'Contact investment team';
    default: return 'Contact us';
  }
}

/**
 * Get lead intent from mode
 */
export function getLeadIntent(mode: ApartmentMode): LeadIntent {
  switch (mode) {
    case 'rent': return 'rent_inquiry';
    case 'sale': return 'sale_inquiry';
    case 'investment': return 'investment_inquiry';
    default: return 'general_inquiry';
  }
}

/**
 * Get mode badge label
 */
export function getModeBadge(mode: ApartmentMode, locale: string = 'cs'): string {
  if (locale === 'cs') {
    switch (mode) {
      case 'rent': return 'Pronájem';
      case 'sale': return 'Prodej';
      case 'investment': return 'Investice';
      default: return mode;
    }
  }
  switch (mode) {
    case 'rent': return 'Rent';
    case 'sale': return 'Sale';
    case 'investment': return 'Investment';
    default: return mode;
  }
}

/**
 * Get apartment display name
 */
export function getApartmentDisplayName(apt: Apartment, locale: string = 'cs'): string {
  // Use title directly if set
  if (apt.title) return apt.title;
  
  if (locale === 'cs') {
    return `${apt.building} apartmán č. ${apt.unit_number}`;
  }
  return `${apt.building} Apartment #${apt.unit_number}`;
}

/**
 * Get short description
 */
export function getShortDescription(apt: Apartment, locale: string = 'cs'): string {
  const area = formatAreaDisplay(apt.m2.total);
  const rooms = apt.m2.breakdown.length;
  
  if (locale === 'cs') {
    return `${area} · ${rooms} místnosti · ${apt.building}`;
  }
  return `${area} · ${rooms} rooms · ${apt.building}`;
}
