/**
 * Availability API
 * GET /api/v1/apartments/[slug]/availability
 * 
 * Query params:
 * - checkIn: ISO date string (required for range check)
 * - checkOut: ISO date string (required for range check)
 * - month: number 1-12 (for calendar view)
 * - year: number (for calendar view, defaults to current year)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  checkAvailability, 
  getMonthAvailability,
  getApartmentBySlug,
} from '@/lib/availability';

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
    
    // Check if requesting month availability (calendar view)
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    if (month) {
      const monthNum = parseInt(month);
      const yearNum = year ? parseInt(year) : new Date().getFullYear();
      
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Invalid month parameter (1-12)' },
          { status: 400 }
        );
      }
      
      if (isNaN(yearNum) || yearNum < 2024 || yearNum > 2030) {
        return NextResponse.json(
          { error: 'Invalid year parameter' },
          { status: 400 }
        );
      }
      
      const availability = await getMonthAvailability(
        apartment.id,
        yearNum,
        monthNum
      );
      
      return NextResponse.json(availability);
    }
    
    // Check date range availability
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    
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
    
    const availability = await checkAvailability(apartment.id, {
      checkIn,
      checkOut,
    });
    
    return NextResponse.json(availability);
    
  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
