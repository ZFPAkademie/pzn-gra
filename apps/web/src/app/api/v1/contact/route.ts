/**
 * Contact API Endpoint
 * Sprint 1: POST /api/v1/contact per SPRINT_1_PLAN.md §7.2
 * 
 * Handles sale inquiries and contact form submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['sale', 'rental', 'general']).default('general'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, email, phone, message, type } = result.data;

    // TODO: Store in database (Sprint 1+)
    // TODO: Send email notification (Sprint 1+)
    
    // For now, just log the inquiry
    console.log('Contact inquiry received:', {
      name,
      email,
      phone,
      message,
      type,
      timestamp: new Date().toISOString(),
    });

    // In production, this would:
    // 1. Store the inquiry in the database
    // 2. Send email to michal.novotny@zfpa.cz for sale inquiries
    // 3. Send confirmation email to the user

    return NextResponse.json(
      { success: true, message: 'Inquiry submitted' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Don't allow other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
