/**
 * Leads API
 * POST /api/v1/leads - Create new lead
 * Sends notifications to info@zfpreality.cz + druzstvo@zfpakademie.cz
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLead, LeadInput } from '@/lib/leads-service';
import { getRequestLocale } from '@/lib/i18n-server';
import { createCoopContactFromLead } from '@/lib/coop';
import {
  checkAntispam, clientIp, isSpam, rateLimit, spamSignals,
  validateMessage, validateName, validatePhone,
} from '@/lib/forms/validation';
import { validateEmailDeliverable } from '@/lib/forms/validation.server';

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

// Příjemci notifikace o žádosti o podíl (družstvo)
const NOTIFICATION_EMAILS = ['info@zfpreality.cz', 'druzstvo@zfpakademie.cz'];

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

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.podzlatymnavrsim.cz').replace(/\/$/, '');
  const adminLink = lead.coop_id
    ? `\nKontakt v administraci (Družstvo): ${appUrl}/admin/druzstvo/${lead.coop_id}`
    : '\nKontakt se nepodařilo založit v administraci (Družstvo) — zadejte ho prosím ručně.';

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
${adminLink}
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
    const ip = clientIp(request.headers);
    const body = await request.json();

    // 1) Past a časová past (lib/forms/antispam.tsx) — bot dostane stejnou odpověď jako úspěch
    const trap = checkAntispam(body);
    if (!trap.ok) {
      console.warn('[leads] zahozeno jako spam:', trap.reason, body?.type);
      return NextResponse.json({ success: true, lead_id: null, message: msg.thankYou }, { status: 201 });
    }

    // 2) Strop na IP: 5 poptávek za 10 minut
    const limit = rateLimit(`leads:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: msg.tooManyRequests },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec ?? 600) } }
      );
    }

    // Handle simplified form (from /podil, nemovitostni-produkt): jedno pole „Jméno a příjmení“
    if (typeof body.name === 'string' && !body.first_name) {
      const nameParts = body.name.trim().split(/\s+/);
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
    
    // 3) Obsahové signály spamu → uložit se stavem spam (bez e-mailu, bez Družstva), odpovědět úspěchem
    const formLocale = body.metadata?.locale || body.language || locale;
    const fullName = [body.first_name, body.last_name === '-' ? '' : body.last_name].filter(Boolean).join(' ');
    const userAgent = request.headers.get('user-agent') || undefined;
    const signals = spamSignals({ name: fullName, email: body.email, message: body.message, userAgent });
    const spam = isSpam(signals);

    // 4) Validace polí — člověk dostane konkrétní hlášku
    if (!spam) {
      const firstCheck = validateName(body.first_name, { required: true, locale: formLocale });
      const lastCheck = body.last_name === '-' ? { ok: true as const, normalized: '-' } : validateName(body.last_name, { required: true, locale: formLocale });
      const emailCheck = await validateEmailDeliverable(body.email, { required: true, locale: formLocale });
      const phoneCheck = validatePhone(body.phone, { locale: formLocale });
      const messageCheck = validateMessage(body.message, { locale: formLocale, max: 4000 });
      const invalid = [firstCheck, lastCheck, emailCheck, phoneCheck, messageCheck].find((c) => !c.ok);
      if (invalid) {
        return NextResponse.json({ error: invalid.error }, { status: 400 });
      }
      body.first_name = firstCheck.normalized;
      body.last_name = lastCheck.normalized;
      body.email = emailCheck.normalized;
      body.phone = phoneCheck.normalized ?? undefined;
      body.message = messageCheck.normalized ?? undefined;
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
      user_agent: userAgent,
      ...(spam ? { status: 'spam' as const, notes: `Antispam: ${signals.join(', ')}` } : {}),
    };
    
    // Create lead
    const result = await createLead(leadInput);

    if (spam) {
      console.warn('[leads] uloženo jako spam:', signals.join(','), result.lead_id ?? result.error);
      return NextResponse.json({ success: true, lead_id: null, message: msg.thankYou }, { status: 201 });
    }
    
    if (!result.success) {
      return NextResponse.json(
        { error: serviceError(result.error, locale) },
        { status: 400 }
      );
    }
    
    // Žádost o podíl → kontakt v Družstvu (stav Nový) + notifikace s odkazem do adminu
    if (body.type === 'investment_share_request' && result.lead_id) {
      const shareCount = Number.parseInt(String(body.share_count ?? ''), 10);
      const geo = body.metadata?.geo ?? null;
      const coopId = await createCoopContactFromLead({
        leadId: result.lead_id,
        firstName: leadInput.first_name.trim(),
        lastName: leadInput.last_name?.trim() || null,
        email: leadInput.email,
        phone: typeof body.phone === 'string' ? body.phone : null,
        shareCount: Number.isFinite(shareCount) ? shareCount : null,
        postalCode: typeof geo?.postal === 'string' ? geo.postal : null,
        message: typeof body.message === 'string' ? body.message : null,
        language: leadInput.language ?? null,
        geo,
      });

      await sendNotificationEmail({
        name: body.name || `${body.first_name} ${body.last_name}`,
        email: body.email,
        phone: body.phone,
        share_count: body.share_count,
        message: body.message,
        metadata: body.metadata,
        coop_id: coopId,
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
