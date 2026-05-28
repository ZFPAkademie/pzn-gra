/**
 * Apartments API Endpoint
 * Sprint 1: GET /api/v1/apartments per SPRINT_1_PLAN.md §7.1
 * 
 * Returns list of apartments available for rental
 * Sprint 3: Uses shared mock data module
 */

import { NextRequest, NextResponse } from 'next/server';
import { Locale, defaultLocale, locales } from '@/lib/i18n';
import { getMockApartments } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get('lang') as Locale) || defaultLocale;
    const validLang = locales.includes(lang) ? lang : defaultLocale;

    const apartments = getMockApartments(validLang);

    return NextResponse.json({
      apartments,
      total: apartments.length,
    });
  } catch (error) {
    console.error('Apartments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
