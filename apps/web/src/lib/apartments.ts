/**
 * Apartments data library
 */

import apartmentsData from '@/data/apartments.canonical.json';

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

// Legacy compatibility
export function getAllApartments() {
  return [...apartmentsData.sale, ...apartmentsData.rental];
}
