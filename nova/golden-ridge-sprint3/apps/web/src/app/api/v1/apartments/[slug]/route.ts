/**
 * Apartment Detail API Endpoint
 * Sprint 1: GET /api/v1/apartments/[slug] per SPRINT_1_PLAN.md §7.1
 * 
 * Returns single apartment details
 * Sprint 3: Uses shared mock data module
 */

import { NextRequest, NextResponse } from 'next/server';
import { Locale, defaultLocale, locales } from '@/lib/i18n';
import { getMockApartmentBySlug } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') as Locale) || defaultLocale;
    const validLang = locales.includes(lang) ? lang : defaultLocale;

    const apartment = getMockApartmentBySlug(params.slug, validLang);

    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(apartment);
  } catch (error) {
    console.error('Apartment detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
