/**
 * Contact API Endpoint
 * Sprint 1: POST /api/v1/contact per SPRINT_1_PLAN.md §7.2
 * 
 * Handles sale inquiries and contact form submissions → leads + e-mail adminovi (ADMIN_EMAIL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestLocale, getRequestLocaleFull } from '@/lib/i18n-server';
import { createLead, type LeadInput } from '@/lib/leads-service';
import { sendAdminContactEmail } from '@/lib/email';
import {
  checkAntispam, clientIp, formMessages, isSpam, rateLimit, spamSignals,
  validateMessage, validateName, validatePhone,
} from '@/lib/forms/validation';
import { validateEmailDeliverable } from '@/lib/forms/validation.server';

const LEAD_TYPE: Record<'sale' | 'rental' | 'general', LeadInput['type']> = {
  sale: 'sale_inquiry',
  rental: 'rent_inquiry',
  general: 'general_inquiry',
};

// Hlášky vracené návštěvníkovi — jazyk podle cookie NEXT_LOCALE
const MESSAGES = {
  cs: {
    submitted: 'Poptávka byla odeslána.',
    internal: 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.',
  },
  en: {
    submitted: 'Enquiry submitted',
    internal: 'Internal server error',
  },
} as const;

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

export async function POST(request: NextRequest) {
  const msg = MESSAGES[getRequestLocale()];
  const locale = getRequestLocaleFull();
  const fm = formMessages(locale);
  const ip = clientIp(request.headers);

  try {
    const body = await request.json();

    // 1) Past a časová past (lib/forms/antispam.tsx) — bot dostane stejnou odpověď jako
    //    úspěch, ať nezkouší, na čem spadl. Nic se neuloží, nic se nepošle.
    const trap = checkAntispam(body);
    if (!trap.ok) {
      console.warn('[contact] zahozeno jako spam:', trap.reason);
      return NextResponse.json({ success: true, message: msg.submitted }, { status: 201 });
    }

    // 2) Strop na IP: 5 zpráv za 10 minut
    const limit = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: fm.tooMany },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec ?? 600) } }
      );
    }

    const rawName = str(body.name) ?? '';
    const rawEmail = str(body.email) ?? '';
    const rawPhone = str(body.phone) ?? '';
    const rawMessage = str(body.message) ?? '';
    const type: keyof typeof LEAD_TYPE = body.type in LEAD_TYPE ? body.type : 'general';
    const userAgent = request.headers.get('user-agent') || undefined;

    // 3) Obsahové signály spamu → uložit se stavem spam (bez e-mailu, mimo inbox), odpovědět úspěchem
    const signals = spamSignals({ name: rawName, email: rawEmail, message: rawMessage, userAgent });
    const spam = isSpam(signals);

    // 4) Validace polí — člověk dostane konkrétní hlášku (u spamu se nevaliduje, uloží se, jak přišel)
    let name = rawName.trim();
    let email = rawEmail.trim().toLowerCase();
    let phone: string | undefined = rawPhone.trim() || undefined;
    let message = rawMessage.trim();
    if (!spam) {
      const nameCheck = validateName(rawName, { required: true, locale });
      const emailCheck = await validateEmailDeliverable(rawEmail, { required: true, locale });
      const phoneCheck = validatePhone(rawPhone, { locale });
      const messageCheck = validateMessage(rawMessage, { required: true, locale, max: 4000 });
      const invalid = [nameCheck, emailCheck, phoneCheck, messageCheck].find((c) => !c.ok);
      if (invalid) {
        return NextResponse.json({ error: invalid.error }, { status: 400 });
      }
      name = nameCheck.normalized as string;
      email = emailCheck.normalized as string;
      phone = phoneCheck.normalized ?? undefined;
      message = messageCheck.normalized as string;
    }

    // Zpráva → leads (admin inbox) + upozornění e-mailem. Do 4. 11. 2026 se jen logovala
    // a návštěvník viděl úspěch, i když poptávka nikam nedošla.
    const [firstName, ...rest] = (name || '-').split(/\s+/);
    const lead = await createLead({
      type: LEAD_TYPE[type],
      source_url: request.headers.get('referer') ?? undefined,
      first_name: firstName.slice(0, 100),
      last_name: rest.join(' ').slice(0, 100) || '-',
      email: email || '-@-.-',
      phone,
      message: message.slice(0, 4000),
      // Odpověď na dotaz = jednání o smlouvě (čl. 6 odst. 1 b) GDPR), viz /ochrana-osobnich-udaju
      gdpr_consent: true,
      terms_accepted: true,
      language: locale,
      ip_address: ip,
      user_agent: userAgent,
      ...(spam ? { status: 'spam' as const, notes: `Antispam: ${signals.join(', ')}` } : {}),
    });

    if (spam) {
      console.warn('[contact] uloženo jako spam:', signals.join(','), lead.lead_id ?? lead.error);
      return NextResponse.json({ success: true, message: msg.submitted }, { status: 201 });
    }
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
