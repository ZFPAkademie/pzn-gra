/**
 * Price Calculation API
 * GET /api/v1/apartments/[slug]/price
 * 
 * Query params:
 * - checkIn: ISO date string (required)
 * - checkOut: ISO date string (required)
 * - guestCount: number (optional, defaults to 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApartmentBySlug } from '@/lib/availability';
import { calculatePrice, getPriceSummary } from '@/lib/pricing';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Verify apartment exists
    const apartment = await getApartmentBySlug(slug);
    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
    }
    
    // Get query parameters
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guestCountParam = searchParams.get('guestCount');
    const detailed = searchParams.get('detailed') === 'true';
    
    // Validate required parameters
    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut parameters are required' },
        { status: 400 }
      );
    }
    
    // Validate date format
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }
    
    // Parse guest count
    const guestCount = guestCountParam ? parseInt(guestCountParam) : 2;
    
    if (isNaN(guestCount) || guestCount < 1) {
      return NextResponse.json(
        { error: 'Invalid guestCount parameter' },
        { status: 400 }
      );
    }
    
    // Validate guest count against apartment capacity
    if (guestCount > apartment.maxGuests) {
      return NextResponse.json(
        { 
          error: `Maximum ${apartment.maxGuests} guests allowed for this apartment`,
          maxGuests: apartment.maxGuests,
        },
        { status: 400 }
      );
    }
    
    // Return detailed or summary price calculation
    if (detailed) {
      const priceCalculation = await calculatePrice(apartment.id, {
        checkIn,
        checkOut,
        guestCount,
      });
      
      if (!priceCalculation.isValid) {
        return NextResponse.json(
          { 
            error: 'Price calculation failed',
            validationErrors: priceCalculation.validationErrors,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        apartmentId: apartment.id,
        apartmentName: apartment.name,
        ...priceCalculation,
      });
    }
    
    // Return simplified summary
    const summary = await getPriceSummary(
      apartment.id,
      checkIn,
      checkOut,
      guestCount
    );
    
    if (!summary.valid) {
      return NextResponse.json(
        { 
          error: summary.error || 'Price calculation failed',
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      apartmentId: apartment.id,
      apartmentName: apartment.name,
      checkIn,
      checkOut,
      guestCount,
      nightsCount: summary.nightsCount,
      pricePerNight: summary.pricePerNight,
      totalPrice: summary.totalPrice,
      currency: summary.currency,
      hasSeasonalPricing: summary.hasSeasonalPricing,
    });
    
  } catch (error) {
    console.error('Price API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
