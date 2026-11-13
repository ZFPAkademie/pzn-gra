// vk-analytics 0.3.0 — identita návštěvníka počítaná na serveru.
//
// Do zařízení se nezapisuje nic. Otisk vzniká z údajů, které v každém požadavku
// stejně dorazí (IP, prohlížeč, doména), osolených klíčem odvozeným pro daný den.
// Den se mění → otisk se mění, takže z návštěvníka je po půlnoci cizinec a data
// nejsou dlouhodobý identifikátor. Surová IP se nikam neukládá ani nevrací.
//
// Proč to takhle: pravidlo o souhlasu míří na ukládání informací v koncovém
// zařízení. localStorage pod něj spadá stejně jako cookie — tohle ne.
import { createHmac } from "node:crypto"

type H = { get(name: string): string | null }

/** Klientská IP z hlaviček proxy. Jen pro výpočet otisku, nikdy se neukládá. */
function clientIp(h: H): string {
  const xff = h.get("x-forwarded-for")
  if (xff) { const first = xff.split(",")[0]?.trim(); if (first) return first }
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || ""
}

/** Den v UTC — hranice otáčení soli. */
export function saltDay(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Otisk návštěvníka, stabilní v rámci jednoho dne a jedné domény.
 * Vrací null, když chybí sůl nebo IP — pak se neměří (raději nic než nesmysl).
 */
export function visitorHash(headers: H, host: string, now = new Date()): string | null {
  const master = process.env.VK_IDENTITY_SALT
  if (!master) return null
  const ip = clientIp(headers)
  const ua = headers.get("user-agent") || ""
  if (!ip && !ua) return null

  // Denní klíč: z hlavní soli a data. Bez znalosti IP a prohlížeče se z otisku
  // zpětně nedá nikdo určit — a ty se neukládají.
  const dayKey = createHmac("sha256", master).update("vk-visitor|" + saltDay(now)).digest()
  return createHmac("sha256", dayKey).update(`${ip}|${ua}|${host}`).digest("hex").slice(0, 32)
}
