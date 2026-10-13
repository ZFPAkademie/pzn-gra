import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

const FROM = process.env.EMAIL_FROM ?? 'noreply@podzlatymnavrsim.cz';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'rezervace@podzlatymnavrsim.cz';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://pzn-gra.vercel.app';

type EmailLocale = 'cs' | 'en';

function fmtMoney(cents: number, currency: string = 'CZK', locale: EmailLocale = 'cs') {
  if (locale === 'en') {
    const amount = cents / 100;
    return amount.toLocaleString('en-GB', {
      style: 'currency',
      currency: currency === 'EUR' ? 'EUR' : 'CZK',
      minimumFractionDigits: currency === 'EUR' && !Number.isInteger(amount) ? 2 : 0,
      maximumFractionDigits: currency === 'EUR' ? 2 : 0,
    });
  }
  if (currency === 'EUR') {
    const amount = cents / 100;
    return amount.toLocaleString('cs-CZ', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }) + ' €';
  }
  return (cents / 100).toLocaleString('cs-CZ') + ' Kč';
}
function fmtDate(d: string, locale: EmailLocale = 'cs') {
  return new Date(d + 'T12:00:00').toLocaleDateString(locale === 'en' ? 'en-GB' : 'cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Shared layout ────────────────────────────────────────────────
function layout(content: string, locale: EmailLocale = 'cs') {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pod Zlatým návrším</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0B1626;padding:28px 40px;">
          <p style="margin:0;color:#C9A24D;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;">Pod Zlatým návrším</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">${locale === 'en' ? 'Špindlerův Mlýn · Krkonoše (Giant Mountains)' : 'Špindlerův Mlýn · Krkonoše'}</p>
        </td></tr>

        <!-- Content -->
        <tr><td style="background:#ffffff;padding:40px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;text-align:center;">
          <p style="margin:0;color:rgba(11,22,38,0.35);font-size:11px;">
            Pod Zlatým návrším · Špindlerův Mlýn ·
            <a href="${BASE_URL}" style="color:#C9A24D;text-decoration:none;">podzlatymnavrsim.cz</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#C9A24D;color:#0B1626;text-decoration:none;padding:14px 28px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">${label}</a>`;
}

function divider() {
  return `<div style="border-top:1px solid rgba(11,22,38,0.08);margin:28px 0;"></div>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:rgba(11,22,38,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;width:140px;">${label}</td>
    <td style="padding:8px 0;color:#0B1626;font-size:14px;">${value}</td>
  </tr>`;
}

// ─── 1. Host: Potvrzení přijetí rezervace ────────────────────────
export async function sendBookingReceivedEmail(params: {
  guestEmail: string;
  guestName: string;
  apartmentTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  totalAmountCents: number;
  currency?: string;
  confirmationToken: string;
  bankIban: string;
  bankName: string;
  reference: string;
  /** Jazyk rezervace (bookings.language) */
  locale?: EmailLocale;
}) {
  const locale: EmailLocale = params.locale === 'en' ? 'en' : 'cs';
  // ?lang= nastaví jazyk celého webu (hlavička, patička) i v prohlížeči bez cookie
  const cardUrl = `${BASE_URL}/rezervace/${params.confirmationToken}?lang=${locale}`;
  const t = locale === 'cs'
    ? {
        heading: 'Rezervace přijata',
        intro: `Děkujeme, ${params.guestName}. Vaši rezervaci jsme přijali a čekáme na platbu.`,
        checkIn: 'Příjezd',
        checkOut: 'Odjezd',
        stay: 'Délka pobytu',
        nights: `${params.nights} nocí`,
        guests: 'Počet hostů',
        total: 'Celková cena',
        reference: 'Reference',
        paymentTitle: 'Platební instrukce',
        recipient: 'Příjemce',
        amount: 'Částka',
        message: 'Zpráva',
        note: `Po přijetí platby vám zašleme potvrzení. Veškeré informace o rezervaci,
      QR kód pro platbu a komunikaci s námi najdete na vaší rezervační kartě.`,
        button: 'Otevřít rezervační kartu',
        questions: 'Máte otázky? Odpovíme na',
        subject: `Rezervace přijata — ${params.apartmentTitle}`,
      }
    : {
        heading: 'Reservation received',
        intro: `Thank you, ${params.guestName}. We have received your reservation and are awaiting your payment.`,
        checkIn: 'Arrival',
        checkOut: 'Departure',
        stay: 'Length of stay',
        nights: `${params.nights} ${params.nights === 1 ? 'night' : 'nights'}`,
        guests: 'Guests',
        total: 'Total price',
        reference: 'Reference',
        paymentTitle: 'Payment instructions',
        recipient: 'Beneficiary',
        amount: 'Amount',
        message: 'Payment reference',
        note: `We will send you a confirmation once your payment has been received. All details of your reservation,
      the payment QR code and your messages with us can be found on your reservation card.`,
        button: 'Open reservation card',
        questions: 'Any questions? We will reply at',
        subject: `Reservation received — ${params.apartmentTitle}`,
      };

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:300;color:#0B1626;">${t.heading}</h1>
    <p style="margin:0 0 28px;color:rgba(11,22,38,0.5);font-size:14px;">
      ${t.intro}
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#F4F6F8;border:1px solid rgba(11,22,38,0.08);padding:0;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 16px;font-size:10px;color:rgba(11,22,38,0.4);text-transform:uppercase;letter-spacing:0.1em;">${params.apartmentTitle}</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${row(t.checkIn, fmtDate(params.checkIn, locale))}
          ${row(t.checkOut, fmtDate(params.checkOut, locale))}
          ${row(t.stay, t.nights)}
          ${row(t.guests, String(params.guestsCount))}
          ${row(t.total, fmtMoney(params.totalAmountCents, params.currency, locale))}
          ${row(t.reference, `<code style="font-size:13px;">${params.reference}</code>`)}
        </table>
      </td></tr>
    </table>

    <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0B1626;text-transform:uppercase;letter-spacing:0.08em;">${t.paymentTitle}</h2>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      ${row(t.recipient, params.bankName)}
      ${row('IBAN', `<code style="font-size:13px;">${params.bankIban}</code>`)}
      ${row(t.amount, `<strong>${fmtMoney(params.totalAmountCents, params.currency, locale)}</strong>`)}
      ${row(t.message, `<code style="font-size:13px;">${params.reference}</code>`)}
    </table>

    <p style="margin:0 0 24px;color:rgba(11,22,38,0.5);font-size:13px;line-height:1.6;">
      ${t.note}
    </p>

    ${btn(cardUrl, t.button)}

    ${divider()}
    <p style="margin:0;color:rgba(11,22,38,0.35);font-size:11px;">
      ${t.questions}
      <a href="mailto:rezervace@podzlatymnavrsim.cz" style="color:#C9A24D;">rezervace@podzlatymnavrsim.cz</a>
    </p>
  `, locale);

  return sendSafe({
    from: FROM,
    to: params.guestEmail,
    subject: t.subject,
    html,
  });
}

// ─── 2. Admin: Nová rezervace ─────────────────────────────────────
export async function sendAdminNewBookingEmail(params: {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  apartmentTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmountCents: number;
  currency?: string;
  reference: string;
  fdmNote?: string | null;
  /** Jazyk hosta (bookings.language) — admin e-mail zůstává česky */
  guestLanguage?: EmailLocale;
}) {
  const adminUrl = `${BASE_URL}/admin/rezervace/${params.bookingId}`;

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:300;color:#0B1626;">Nová rezervace</h1>
    <p style="margin:0 0 28px;color:rgba(11,22,38,0.5);font-size:14px;">
      Přišla nová rezervace čekající na potvrzení platby.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      ${row('Apartmán', params.apartmentTitle)}
      ${row('Host', `${params.guestName}<br/><span style="color:rgba(11,22,38,0.5)">${params.guestEmail}</span>${params.guestPhone ? `<br/><span style="color:rgba(11,22,38,0.5)">${params.guestPhone}</span>` : ''}`)}
      ${row('Příjezd', fmtDate(params.checkIn))}
      ${row('Odjezd', fmtDate(params.checkOut))}
      ${row('Nocí', String(params.nights))}
      ${row('Částka', fmtMoney(params.totalAmountCents, params.currency))}
      ${row('Reference', `<code>${params.reference}</code>`)}
      ${row('Jazyk hosta', params.guestLanguage === 'en' ? 'EN' : 'CZ')}
      ${params.fdmNote ? row('Front Desk Master', params.fdmNote) : ''}
    </table>

    ${btn(adminUrl, 'Otevřít v adminu')}
  `);

  return sendSafe({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Nová rezervace — ${params.apartmentTitle} (${params.reference})`,
    html,
  });
}

// ─── 3. Host: Platba potvrzena ────────────────────────────────────
export async function sendBookingConfirmedEmail(params: {
  guestEmail: string;
  guestName: string;
  apartmentTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  confirmationToken: string;
  reference: string;
  /** Jazyk rezervace (bookings.language) */
  locale?: EmailLocale;
}) {
  const locale: EmailLocale = params.locale === 'en' ? 'en' : 'cs';
  // ?lang= nastaví jazyk celého webu (hlavička, patička) i v prohlížeči bez cookie
  const cardUrl = `${BASE_URL}/rezervace/${params.confirmationToken}?lang=${locale}`;
  const t = locale === 'cs'
    ? {
        badge: '✓ Potvrzeno',
        heading: 'Rezervace potvrzena',
        intro: `Platbu jsme přijali. Těšíme se na vás, ${params.guestName}!`,
        checkIn: 'Příjezd',
        checkOut: 'Odjezd',
        from: 'od 15:00',
        until: 'do 10:00',
        stay: 'Délka pobytu',
        nights: `${params.nights} nocí`,
        note: `Na vaší rezervační kartě najdete všechny informace k příjezdu —
      kód ke dveřím, Wi-Fi a pokyny k parkování (doplníme před vaším příjezdem).`,
        button: 'Otevřít rezervační kartu',
        help: 'Potřebujete pomoc? Napište přímo na rezervační kartě nebo na',
        subject: `Potvrzení rezervace — ${params.apartmentTitle}`,
      }
    : {
        badge: '✓ Confirmed',
        heading: 'Reservation confirmed',
        intro: `We have received your payment. We look forward to welcoming you, ${params.guestName}!`,
        checkIn: 'Arrival',
        checkOut: 'Departure',
        from: 'from 3:00 pm',
        until: 'by 10:00 am',
        stay: 'Length of stay',
        nights: `${params.nights} ${params.nights === 1 ? 'night' : 'nights'}`,
        note: `Your reservation card contains all the information you need for your arrival —
      the door code, Wi-Fi and parking instructions (we will add these before you arrive).`,
        button: 'Open reservation card',
        help: 'Need help? Write to us directly on your reservation card or at',
        subject: `Reservation confirmation — ${params.apartmentTitle}`,
      };

  const html = layout(`
    <div style="margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);padding:8px 16px;margin-bottom:20px;">
        <span style="color:#16a34a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">${t.badge}</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:300;color:#0B1626;">${t.heading}</h1>
      <p style="margin:0 0 28px;color:rgba(11,22,38,0.5);font-size:14px;">
        ${t.intro}
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#F4F6F8;border:1px solid rgba(11,22,38,0.08);margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 16px;font-size:10px;color:rgba(11,22,38,0.4);text-transform:uppercase;letter-spacing:0.1em;">${params.apartmentTitle}</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${row(t.checkIn, `${fmtDate(params.checkIn, locale)} <span style="color:rgba(11,22,38,0.4);font-size:12px;">${t.from}</span>`)}
          ${row(t.checkOut, `${fmtDate(params.checkOut, locale)} <span style="color:rgba(11,22,38,0.4);font-size:12px;">${t.until}</span>`)}
          ${row(t.stay, t.nights)}
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 24px;color:rgba(11,22,38,0.6);font-size:14px;line-height:1.6;">
      ${t.note}
    </p>

    ${btn(cardUrl, t.button)}

    ${divider()}
    <p style="margin:0;color:rgba(11,22,38,0.35);font-size:11px;">
      ${t.help}
      <a href="mailto:rezervace@podzlatymnavrsim.cz" style="color:#C9A24D;">rezervace@podzlatymnavrsim.cz</a>
    </p>
  `, locale);

  return sendSafe({
    from: FROM,
    to: params.guestEmail,
    subject: t.subject,
    html,
  });
}

// ─── Soft-fail wrapper ────────────────────────────────────────────
async function sendSafe(params: { from: string; to: string; subject: string; html: string }) {
  try {
    const { error } = await getResend().emails.send(params);
    if (error) console.error('[email] Resend error:', error);
    else console.log('[email] Sent to:', params.to, '—', params.subject);
  } catch (err) {
    console.error('[email] Failed to send:', err);
  }
}
