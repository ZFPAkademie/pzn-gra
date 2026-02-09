/**
 * Leads API
 * POST /api/v1/leads - Create new lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLead, LeadInput } from '@/lib/leads-service';

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'first_name', 'last_name', 'email', 'gdpr_consent', 'terms_accepted'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        if (field === 'gdpr_consent' || field === 'terms_accepted') {
          if (body[field] !== true) {
            return NextResponse.json(
              { error: `${field} must be accepted` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: `${field} is required` },
            { status: 400 }
          );
        }
      }
    }
    
    // Validate type
    const validTypes = ['rent_inquiry', 'sale_inquiry', 'investment_inquiry', 'investment_share_request', 'general_inquiry'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid inquiry type' },
        { status: 400 }
      );
    }
    
    // Build lead input
    const leadInput: LeadInput = {
      type: body.type,
      apartment_slug: body.apartment_slug,
      apartment_title: body.apartment_title,
      source_url: body.source_url,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      preferred_dates: body.preferred_dates,
      guest_count: body.guest_count ? parseInt(body.guest_count, 10) : undefined,
      gdpr_consent: body.gdpr_consent === true,
      terms_accepted: body.terms_accepted === true,
      marketing_consent: body.marketing_consent === true,
      language: body.language || 'cs',
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || undefined,
    };
    
    // Create lead
    const result = await createLead(leadInput);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        lead_id: result.lead_id,
        message: 'Thank you for your inquiry. We will contact you soon.'
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
