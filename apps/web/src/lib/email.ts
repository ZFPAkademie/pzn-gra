import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder');
}

const FROM = process.env.EMAIL_FROM ?? 'noreply@podzlatymnavrsim.cz';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'rezervace@podzlatymnavrsim.cz';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://pzn-gra.vercel.app';

function fmtCZK(cents: number) {
  return (cents / 100).toLocaleString('cs-CZ') + ' Kč';
}
function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Shared layout ────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="cs">
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
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">Špindlerův Mlýn · Krkonoše</p>
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
  confirmationToken: string;
  bankIban: string;
  bankName: string;
  reference: string;
}) {
  const cardUrl = `${BASE_URL}/rezervace/${params.confirmationToken}`;
  const amountCZK = (params.totalAmountCents / 100).toFixed(2);

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:300;color:#0B1626;">Rezervace přijata</h1>
    <p style="margin:0 0 28px;color:rgba(11,22,38,0.5);font-size:14px;">
      Děkujeme, ${params.guestName}. Vaši rezervaci jsme přijali a čekáme na platbu.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#F4F6F8;border:1px solid rgba(11,22,38,0.08);padding:0;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 16px;font-size:10px;color:rgba(11,22,38,0.4);text-transform:uppercase;letter-spacing:0.1em;">${params.apartmentTitle}</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${row('Příjezd', fmtDate(params.checkIn))}
          ${row('Odjezd', fmtDate(params.checkOut))}
          ${row('Délka pobytu', `${params.nights} nocí`)}
          ${row('Počet hostů', String(params.guestsCount))}
          ${row('Celková cena', fmtCZK(params.totalAmountCents))}
          ${row('Reference', `<code style="font-size:13px;">${params.reference}</code>`)}
        </table>
      </td></tr>
    </table>

    <h2 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0B1626;text-transform:uppercase;letter-spacing:0.08em;">Platební instrukce</h2>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      ${row('Příjemce', params.bankName)}
      ${row('IBAN', `<code style="font-size:13px;">${params.bankIban}</code>`)}
      ${row('Částka', `<strong>${fmtCZK(params.totalAmountCents)}</strong>`)}
      ${row('Zpráva', `<code style="font-size:13px;">${params.reference}</code>`)}
    </table>

    <p style="margin:0 0 24px;color:rgba(11,22,38,0.5);font-size:13px;line-height:1.6;">
      Po přijetí platby vám zašleme potvrzení. Veškeré informace o rezervaci,
      QR kód pro platbu a komunikaci s námi najdete na vaší rezervační kartě.
    </p>

    ${btn(cardUrl, 'Otevřít rezervační kartu')}

    ${divider()}
    <p style="margin:0;color:rgba(11,22,38,0.35);font-size:11px;">
      Máte otázky? Odpovíme na
      <a href="mailto:rezervace@podzlatymnavrsim.cz" style="color:#C9A24D;">rezervace@podzlatymnavrsim.cz</a>
    </p>
  `);

  return sendSafe({
    from: FROM,
    to: params.guestEmail,
    subject: `Rezervace přijata — ${params.apartmentTitle}`,
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
  reference: string;
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
      ${row('Částka', fmtCZK(params.totalAmountCents))}
      ${row('Reference', `<code>${params.reference}</code>`)}
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
}) {
  const cardUrl = `${BASE_URL}/rezervace/${params.confirmationToken}`;

  const html = layout(`
    <div style="margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);padding:8px 16px;margin-bottom:20px;">
        <span style="color:#16a34a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">✓ Potvrzeno</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:300;color:#0B1626;">Rezervace potvrzena</h1>
      <p style="margin:0 0 28px;color:rgba(11,22,38,0.5);font-size:14px;">
        Platbu jsme přijali. Těšíme se na vás, ${params.guestName}!
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#F4F6F8;border:1px solid rgba(11,22,38,0.08);margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 16px;font-size:10px;color:rgba(11,22,38,0.4);text-transform:uppercase;letter-spacing:0.1em;">${params.apartmentTitle}</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${row('Příjezd', `${fmtDate(params.checkIn)} <span style="color:rgba(11,22,38,0.4);font-size:12px;">od 15:00</span>`)}
          ${row('Odjezd', `${fmtDate(params.checkOut)} <span style="color:rgba(11,22,38,0.4);font-size:12px;">do 10:00</span>`)}
          ${row('Délka pobytu', `${params.nights} nocí`)}
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 24px;color:rgba(11,22,38,0.6);font-size:14px;line-height:1.6;">
      Na vaší rezervační kartě najdete všechny informace k příjezdu —
      kód ke dveřím, Wi-Fi a pokyny k parkování (doplníme před vaším příjezdem).
    </p>

    ${btn(cardUrl, 'Otevřít rezervační kartu')}

    ${divider()}
    <p style="margin:0;color:rgba(11,22,38,0.35);font-size:11px;">
      Potřebujete pomoc? Napište přímo na rezervační kartě nebo na
      <a href="mailto:rezervace@podzlatymnavrsim.cz" style="color:#C9A24D;">rezervace@podzlatymnavrsim.cz</a>
    </p>
  `);

  return sendSafe({
    from: FROM,
    to: params.guestEmail,
    subject: `Potvrzení rezervace — ${params.apartmentTitle}`,
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
