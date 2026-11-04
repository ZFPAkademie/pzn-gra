/**
 * Contact API Endpoint
 * Sprint 1: POST /api/v1/contact per SPRINT_1_PLAN.md §7.2
 * 
 * Handles sale inquiries and contact form submissions → leads + e-mail adminovi (ADMIN_EMAIL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestLocale, getRequestLocaleFull } from '@/lib/i18n-server';
import { createLead, type LeadInput } from '@/lib/leads-service';
import { sendAdminContactEmail } from '@/lib/email';

const LEAD_TYPE: Record<'sale' | 'rental' | 'general', LeadInput['type']> = {
  sale: 'sale_inquiry',
  rental: 'rent_inquiry',
  general: 'general_inquiry',
};

// Hlášky vracené návštěvníkovi — jazyk podle cookie NEXT_LOCALE
const MESSAGES = {
  cs: {
    validation: 'Zkontrolujte prosím vyplněné údaje.',
    submitted: 'Poptávka byla odeslána.',
    internal: 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.',
    tooManyRequests: 'Příliš mnoho zpráv. Zkuste to prosím za chvíli.',
  },
  en: {
    validation: 'Validation failed',
    submitted: 'Enquiry submitted',
    internal: 'Internal server error',
    tooManyRequests: 'Too many requests. Please try again later.',
  },
} as const;

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['sale', 'rental', 'general']).default('general'),
});

// Zápis do DB + e-mail → strop na IP (stejně jako /api/v1/leads)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const msg = MESSAGES[getRequestLocale()];
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: msg.tooManyRequests }, { status: 429 });
  }
  try {
    const body = await request.json();

    // Validate input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: msg.validation, details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, email, phone, message, type } = result.data;
    const locale = getRequestLocaleFull();

    // Zpráva → leads (admin inbox) + upozornění e-mailem. Do 4. 11. 2026 se jen logovala
    // a návštěvník viděl úspěch, i když poptávka nikam nedošla.
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lead = await createLead({
      type: LEAD_TYPE[type],
      source_url: request.headers.get('referer') ?? undefined,
      first_name: firstName,
      last_name: rest.join(' ') || '-',
      email,
      phone,
      message,
      // Odpověď na dotaz = jednání o smlouvě (čl. 6 odst. 1 b) GDPR), viz /ochrana-osobnich-udaju
      gdpr_consent: true,
      terms_accepted: true,
      language: locale,
      ip_address: ip,
      user_agent: request.headers.get('user-agent') || undefined,
    });
    if (!lead.success || !lead.lead_id) {
      return NextResponse.json({ error: msg.internal }, { status: 500 });
    }

    await sendAdminContactEmail({ leadId: lead.lead_id, name, email, phone, message, language: locale });

    return NextResponse.json(
      { success: true, message: msg.submitted },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: msg.internal },
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
