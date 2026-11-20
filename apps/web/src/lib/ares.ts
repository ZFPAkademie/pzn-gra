/**
 * ARES (registr MF ČR) — načtení firmy podle IČO pro předvyplnění formuláře.
 *
 * Veřejné REST bez klíče a bez SLA → soft fail: výpadek ani neznámý tvar
 * odpovědi nic neblokují, admin údaje vyplní ručně.
 */

const ARES_URL = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty';

/** IČO bez mezer, kratší doplněné nulami zleva (ARES vede 8 číslic). */
export function normalizeIco(raw: string): string {
  const digits = raw.replace(/\s/g, '');
  return /^\d{1,8}$/.test(digits) ? digits.padStart(8, '0') : digits;
}

/** Kontrolní číslice IČO (mod 11) — chytí překlep dřív než registr. */
export function isValidIco(ico: string): boolean {
  if (!/^\d{8}$/.test(ico)) return false;
  const d = ico.split('').map(Number);
  const sum = d.slice(0, 7).reduce((a, n, i) => a + n * (8 - i), 0);
  const r = sum % 11;
  const check = r === 0 ? 1 : r === 1 ? 0 : 11 - r;
  return check === d[7];
}

export interface AresCompany {
  name: string;
  vat_id: string | null;
  address: string | null;
  /** Subjekt zanikl — admin by měl vědět, že firma už neexistuje */
  dissolved: boolean;
}

export async function lookupAresCompany(
  rawIco: string,
): Promise<{ ok: true; data: AresCompany } | { ok: false; error: string }> {
  const ico = normalizeIco(rawIco);
  if (!isValidIco(ico)) return { ok: false, error: 'IČO nemá platný tvar (8 číslic s kontrolní číslicí).' };

  let res: Response;
  try {
    res = await fetch(`${ARES_URL}/${ico}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, error: 'ARES neodpověděl včas. Údaje vyplňte ručně.' };
  }
  if (res.status === 404) return { ok: false, error: 'ARES toto IČO nezná.' };
  if (!res.ok) return { ok: false, error: `ARES odpověděl chybou (${res.status}). Údaje vyplňte ručně.` };

  const body = (await res.json().catch(() => null)) as {
    obchodniJmeno?: unknown;
    dic?: unknown;
    datumZaniku?: unknown;
    sidlo?: { textovaAdresa?: unknown };
  } | null;
  if (!body || typeof body.obchodniJmeno !== 'string') {
    return { ok: false, error: 'Odpověď ARES má neznámý tvar. Údaje vyplňte ručně.' };
  }
  return {
    ok: true,
    data: {
      name: body.obchodniJmeno,
      vat_id: typeof body.dic === 'string' ? body.dic : null,
      address: typeof body.sidlo?.textovaAdresa === 'string' ? body.sidlo.textovaAdresa : null,
      dissolved: typeof body.datumZaniku === 'string',
    },
  };
}
