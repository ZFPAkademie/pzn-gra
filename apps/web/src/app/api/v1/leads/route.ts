/**
 * Leads API
 * POST /api/v1/leads - Create new lead
 * Sends notifications to info@zfpreality.cz
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLead, LeadInput } from '@/lib/leads-service';

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000; // 1 minute

// Notification email for investment inquiries
const NOTIFICATION_EMAIL = 'info@zfpreality.cz';

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

// Send email notification via Resend
async function sendNotificationEmail(lead: any) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return;
  }

  const geoInfo = lead.metadata?.geo 
    ? `\nLokalizace: ${lead.metadata.geo.city || 'N/A'}, ${lead.metadata.geo.country || 'N/A'} (PSČ: ${lead.metadata.geo.postal || 'N/A'})`
    : '';

  const emailBody = `
Nová poptávka investičního podílu

Jméno: ${lead.name}
E-mail: ${lead.email}
Telefon: ${lead.phone || 'Neuvedeno'}
Počet podílů: ${lead.share_count || 'Nespecifikováno'}
Poznámka: ${lead.message || 'Žádná'}
${geoInfo}

Zdroj: ${lead.metadata?.source || 'web'}
Jazyk: ${lead.metadata?.locale || 'cs'}
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pod Zlatým návrším <noreply@podzlatymnavrsim.cz>',
        to: NOTIFICATION_EMAIL,
        subject: `Nová poptávka podílů: ${lead.name}`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send notification email:', await response.text());
    }
  } catch (error) {
    console.error('Email sending error:', error);
  }
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
    
    // Handle simplified form (from nemovitostni-produkt)
    if (body.name && !body.first_name) {
      const nameParts = body.name.trim().split(' ');
      body.first_name = nameParts[0] || body.name;
      body.last_name = nameParts.slice(1).join(' ') || '-';
      body.gdpr_consent = true;
      body.terms_accepted = true;
    }
    
    // Validate required fields
    if (!body.type || !body.email) {
      return NextResponse.json(
        { error: 'Type and email are required' },
        { status: 400 }
      );
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
      language: body.metadata?.locale || body.language || 'cs',
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
    
    // Send notification email for investment share requests
    if (body.type === 'investment_share_request') {
      await sendNotificationEmail({
        name: body.name || `${body.first_name} ${body.last_name}`,
        email: body.email,
        phone: body.phone,
        share_count: body.share_count,
        message: body.message,
        metadata: body.metadata,
      });
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
