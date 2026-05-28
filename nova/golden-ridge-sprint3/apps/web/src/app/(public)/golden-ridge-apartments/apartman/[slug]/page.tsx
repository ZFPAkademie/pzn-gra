/**
 * Apartment Detail Page
 * Sprint 1: Individual apartment pages per SPRINT_1_PLAN.md §3.2
 * 
 * URL: /golden-ridge-apartments/apartman/[slug]
 * 
 * Sprint 3: Uses mock data directly for reliable SSR
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { getMockApartmentBySlug } from '@/lib/mock-data';
import { ApartmentDetail, ApartmentDetailData } from '@/components/features/apartment-detail';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  
  const apartment = getMockApartmentBySlug(params.slug, locale);
  
  if (!apartment) {
    return {
      title: 'Apartmán nenalezen | Golden Ridge Apartments',
    };
  }

  return {
    title: `${apartment.name} | Golden Ridge Apartments`,
    description: apartment.description.slice(0, 160),
    openGraph: {
      title: `${apartment.name} | Golden Ridge Apartments`,
      description: apartment.description.slice(0, 160),
      images: apartment.photos.length > 0 ? [apartment.photos[0]] : [],
    },
  };
}

export default async function ApartmentDetailPage({ params }: PageProps) {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);

  const apartment = getMockApartmentBySlug(params.slug, locale);

  if (!apartment) {
    notFound();
  }

  return <ApartmentDetail apartment={apartment as ApartmentDetailData} />;
}
