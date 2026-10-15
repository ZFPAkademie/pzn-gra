/**
 * Leads API
 * POST /api/v1/leads - Create new lead
 * Sends notifications to info@zfpreality.cz + druzstvo@zfpakademie.cz
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLead, LeadInput } from '@/lib/leads-service';
import { getRequestLocale } from '@/lib/i18n-server';

// Hlášky vracené návštěvníkovi — jazyk podle cookie NEXT_LOCALE
const MESSAGES = {
  cs: {
    tooManyRequests: 'Příliš mnoho požadavků. Zkuste to prosím později.',
    typeEmailRequired: 'Vyplňte prosím e-mail.',
    invalidType: 'Neplatný typ poptávky.',
    internal: 'Poptávku se nepodařilo odeslat. Zkuste to prosím znovu.',
    thankYou: 'Děkujeme za poptávku. Ozveme se vám co nejdříve.',
  },
  en: {
    tooManyRequests: 'Too many requests. Please try again later.',
    typeEmailRequired: 'Type and email are required',
    invalidType: 'Invalid enquiry type',
    internal: 'Internal server error',
    thankYou: 'Thank you for your enquiry. We will be in touch soon.',
  },
} as const;

// Chyby z leads-service (anglicky) → hláška pro návštěvníka
const SERVICE_ERRORS_CS: Record<string, string> = {
  'First name is required': 'Vyplňte prosím jméno.',
  'Last name is required': 'Vyplňte prosím příjmení.',
  'Email is required': 'Vyplňte prosím e-mail.',
  'GDPR consent is required': 'Je potřeba souhlas se zpracováním osobních údajů.',
  'Terms acceptance is required': 'Je potřeba souhlas s obchodními podmínkami.',
  'Invalid email format': 'Neplatný formát e-mailu.',
  'Failed to submit inquiry': 'Poptávku se nepodařilo odeslat. Zkuste to prosím znovu.',
  'Internal server error': 'Poptávku se nepodařilo odeslat. Zkuste to prosím znovu.',
};

const SERVICE_ERRORS_EN: Record<string, string> = {
  'Failed to submit inquiry': 'Failed to submit enquiry',
};

function serviceError(error: string | undefined, locale: 'cs' | 'en'): string | undefined {
  if (!error) return error;
  const map = locale === 'cs' ? SERVICE_ERRORS_CS : SERVICE_ERRORS_EN;
  return map[error] ?? error;
}

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000; // 1 minute

// Příjemci notifikace o žádosti o podíl (družstvo)
const NOTIFICATION_EMAILS = ['info@zfpreality.cz', 'druzstvo@zfpakademie.cz'];

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
        from: process.env.RESEND_FROM_EMAIL || 'Pod Zlatým návrším <info@zfpreality.cz>',
        to: NOTIFICATION_EMAILS,
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
  const locale = getRequestLocale();
  const msg = MESSAGES[locale];
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: msg.tooManyRequests },
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
        { error: msg.typeEmailRequired },
        { status: 400 }
      );
    }
    
    // Validate type
    const validTypes = ['rent_inquiry', 'sale_inquiry', 'investment_inquiry', 'investment_share_request', 'general_inquiry'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: msg.invalidType },
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
        { error: serviceError(result.error, locale) },
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
        message: msg.thankYou
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: msg.internal },
      { status: 500 }
    );
  }
}
